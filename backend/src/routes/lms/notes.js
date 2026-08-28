const { Router } = require('express');
const multer  = require('multer');
const mammoth = require('mammoth');
const db = require('../../db');
const { protect, optionalProtect, authorize } = require('../../middleware/lmsAuth');

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const safeJSON = (v) => { try { return JSON.parse(v); } catch { return []; } };

const formatNote = (row) => ({
  ...row,
  tags: safeJSON(row.tags),
  isPinned: !!row.isPinned,
  owner: row.ownerName ? { id: row.owner, name: row.ownerName } : row.owner,
  subject: row.subjectId ? { id: row.subjectId, name: row.subjectName } : null,
});

// ─── GET /api/notes ──────────────────────────────────────────────────────────
router.get('/', optionalProtect, async (req, res) => {
  try {
    const { q, tag, page = 1, limit = 12, subject, topic } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = '1=1';
    const params = [];
    
    if (req.user && req.user.role !== 'student') {
      where = 'n.owner = ?';
      params.push(req.user.id);
    }

    if (q) { where += ` AND (n.title LIKE ? OR n.content LIKE ?)`; params.push(`%${q}%`, `%${q}%`); }
    if (tag) { where += ` AND n.tags LIKE ?`; params.push(`%"${tag}"%`); }
    if (subject) { where += ` AND n.subjectId = ?`; params.push(parseInt(subject)); }
    if (topic)   { where += ` AND n.topic = ?`; params.push(topic); }

    const sql = `
      SELECT n.*, u.name AS ownerName, s.name AS subjectName
      FROM lms_notes n
      LEFT JOIN User u ON u.id = n.owner
      LEFT JOIN lms_subjects s ON s.id = n.subjectId
      WHERE ${where}
      ORDER BY n.isPinned DESC, n.updatedAt DESC
      LIMIT ? OFFSET ?
    `;
    const countSql = `SELECT COUNT(*) AS total FROM lms_notes n WHERE ${where}`;

    const [rows] = await db.query(sql, [...params, parseInt(limit), offset]);
    const [countRows] = await db.query(countSql, params);
    const total = countRows[0].total;

    res.json({
      success: true,
      notes: rows.map(formatNote),
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), limit: parseInt(limit) },
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── GET /api/notes/:id ──────────────────────────────────────────────────────
router.get('/:id', optionalProtect, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT n.*, u.name AS ownerName, s.name AS subjectName
       FROM lms_notes n
       LEFT JOIN User u ON u.id = n.owner
       LEFT JOIN lms_subjects s ON s.id = n.subjectId
       WHERE n.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Note not found' });

    const note = rows[0];
    if (req.user && req.user.role !== 'student' && note.owner !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, note: formatNote(note) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── POST /api/notes ─────────────────────────────────────────────────────────
router.post('/', protect, authorize('trainer', 'admin'), async (req, res) => {
  try {
    const { title, content, tags = [], color = 'default', isPinned = false, contentType = 'richtext', subject, topic, moduleId } = req.body;
    const [result] = await db.query(
      `INSERT INTO lms_notes (owner, subjectId, topic, title, content, tags, isPinned, color, contentType)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, subject || null, topic || null, title, content, JSON.stringify(tags), isPinned ? 1 : 0, color, contentType]
    );

    if (moduleId) {
      await db.query(
        `INSERT INTO lms_course_items (moduleId, itemType, itemId) VALUES (?, 'note', ?)`,
        [moduleId, result.insertId]
      );
    }

    const [rows] = await db.query('SELECT * FROM lms_notes WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, note: formatNote(rows[0]) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── POST /api/notes/upload ──────────────────────────────────────────────────
router.post('/upload', protect, authorize('trainer', 'admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const { title, tags, color, isPinned, noteId, subject, topic } = req.body;
    const ext = req.file.originalname.split('.').pop().toLowerCase();

    let content = '', contentType = '';
    if (ext === 'docx') {
      const r = await mammoth.convertToHtml({ buffer: req.file.buffer });
      content = r.value; contentType = 'docx';
    } else if (ext === 'html' || ext === 'htm') {
      content = req.file.buffer.toString('utf8'); contentType = 'html';
    } else {
      return res.status(400).json({ success: false, message: 'Only .docx and .html files are supported' });
    }
    if (!content.trim()) return res.status(400).json({ success: false, message: 'File appears to be empty' });

    const parsedTags = tags ? JSON.parse(tags) : [];

    if (noteId) {
      const [noteRows] = await db.query('SELECT * FROM lms_notes WHERE id = ?', [noteId]);
      if (!noteRows.length) return res.status(404).json({ success: false, message: 'Note not found' });
      if (noteRows[0].owner !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });
      await db.query(
        `UPDATE lms_notes SET title=?, content=?, contentType=?, tags=?, color=?, isPinned=?, subjectId=?, topic=?, updatedAt=NOW() WHERE id=?`,
        [title || noteRows[0].title, content, contentType, JSON.stringify(parsedTags),
         color || noteRows[0].color, isPinned === 'true' ? 1 : 0, subject || null, topic || null, noteId]
      );
      const [updated] = await db.query('SELECT * FROM lms_notes WHERE id = ?', [noteId]);
      return res.json({ success: true, note: formatNote(updated[0]) });
    }

    const [result] = await db.query(
        `INSERT INTO lms_notes (owner, subjectId, topic, title, content, tags, isPinned, color, contentType)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, subject || null, topic || null, title || req.file.originalname, content, JSON.stringify(parsedTags), isPinned === 'true' ? 1 : 0, color || 'default', contentType]
      );

      if (req.body.moduleId) {
        await db.query(
          `INSERT INTO lms_course_items (moduleId, itemType, itemId) VALUES (?, 'note', ?)`,
          [req.body.moduleId, result.insertId]
        );
      }

      const [rows] = await db.query('SELECT * FROM lms_notes WHERE id = ?', [result.insertId]);
      res.status(201).json({ success: true, note: formatNote(rows[0]) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── PUT /api/notes/:id ──────────────────────────────────────────────────────
router.put('/:id', protect, authorize('trainer', 'admin'), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM lms_notes WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Note not found' });
    if (rows[0].owner !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    const n = rows[0];
    const { title, content, tags, color, isPinned, contentType, subject, topic } = req.body;
    await db.query(
      `UPDATE lms_notes SET title=?, content=?, tags=?, color=?, isPinned=?, contentType=?, subjectId=?, topic=?, updatedAt=NOW() WHERE id=?`,
      [
        title ?? n.title, content ?? n.content,
        tags !== undefined ? JSON.stringify(tags) : n.tags,
        color ?? n.color,
        isPinned !== undefined ? (isPinned ? 1 : 0) : n.isPinned,
        contentType ?? n.contentType,
        subject !== undefined ? (subject || null) : n.subjectId,
        topic !== undefined ? (topic || null) : n.topic,
        req.params.id
      ]
    );
    const [updated] = await db.query('SELECT * FROM lms_notes WHERE id = ?', [req.params.id]);
    res.json({ success: true, note: formatNote(updated[0]) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── PATCH /api/notes/:id/pin ─────────────────────────────────────────────────
router.patch('/:id/pin', protect, authorize('trainer', 'admin'), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM lms_notes WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Note not found' });
    if (rows[0].owner !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    const newPin = rows[0].isPinned ? 0 : 1;
    await db.query('UPDATE lms_notes SET isPinned=?, updatedAt=NOW() WHERE id=?', [newPin, req.params.id]);
    const [updated] = await db.query('SELECT * FROM lms_notes WHERE id = ?', [req.params.id]);
    res.json({ success: true, note: formatNote(updated[0]) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── DELETE /api/notes/:id ───────────────────────────────────────────────────
router.delete('/:id', protect, authorize('trainer', 'admin'), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM lms_notes WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Note not found' });
    if (rows[0].owner !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });
    await db.query('DELETE FROM lms_notes WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Note deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
