const { Router } = require('express');
const db = require('../../db');
const { protect, authorize } = require('../../middleware/lmsAuth');

const router = Router();

const safeJSON = (v) => { try { return JSON.parse(v); } catch { return []; } };

// ─── GET /api/subjects ───────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM lms_subjects ORDER BY name ASC');
    const subjects = rows.map(r => ({ ...r, topics: safeJSON(r.topics) }));
    res.json({ success: true, subjects });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── POST /api/subjects ──────────────────────────────────────────────────────
router.post('/', protect, authorize('trainer', 'admin'), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'Subject name is required' });

    const [existing] = await db.query('SELECT id FROM lms_subjects WHERE name = ?', [name.trim()]);
    if (existing.length) return res.status(400).json({ success: false, message: 'Subject already exists' });

    const [result] = await db.query(
      'INSERT INTO lms_subjects (name, topics) VALUES (?, ?)',
      [name.trim(), '[]']
    );
    const [rows] = await db.query('SELECT * FROM lms_subjects WHERE id = ?', [result.insertId]);
    const subject = { ...rows[0], topics: safeJSON(rows[0].topics) };
    res.status(201).json({ success: true, subject });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── POST /api/subjects/:id/topics ──────────────────────────────────────────
router.post('/:id/topics', protect, authorize('trainer', 'admin'), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'Topic name is required' });

    const [rows] = await db.query('SELECT * FROM lms_subjects WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Subject not found' });

    const topics = safeJSON(rows[0].topics);
    if (topics.some(t => t.name.toLowerCase() === name.trim().toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Topic already exists' });
    }

    topics.push({ _id: Date.now().toString(), name: name.trim() });
    await db.query('UPDATE lms_subjects SET topics = ?, updatedAt = NOW() WHERE id = ?', [JSON.stringify(topics), req.params.id]);

    const [updated] = await db.query('SELECT * FROM lms_subjects WHERE id = ?', [req.params.id]);
    res.status(201).json({ success: true, subject: { ...updated[0], topics: safeJSON(updated[0].topics) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── DELETE /api/subjects/:id ────────────────────────────────────────────────
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id FROM lms_subjects WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Subject not found' });
    await db.query('DELETE FROM lms_subjects WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Subject deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── DELETE /api/subjects/:id/topics/:topicId ────────────────────────────────
router.delete('/:id/topics/:topicId', protect, authorize('admin'), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM lms_subjects WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Subject not found' });

    const topics = safeJSON(rows[0].topics).filter(t => String(t._id) !== req.params.topicId);
    await db.query('UPDATE lms_subjects SET topics = ?, updatedAt = NOW() WHERE id = ?', [JSON.stringify(topics), req.params.id]);

    const [updated] = await db.query('SELECT * FROM lms_subjects WHERE id = ?', [req.params.id]);
    res.json({ success: true, subject: { ...updated[0], topics: safeJSON(updated[0].topics) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
