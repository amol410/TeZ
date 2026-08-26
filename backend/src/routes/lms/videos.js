const { Router } = require('express');
const db = require('../db');
const { protect, authorize } = require('../middleware/lmsAuth');

const router = Router();

const safeJSON = (v) => { try { return JSON.parse(v); } catch { return []; } };

const extractYouTubeId = (url) => {
  const patterns = [
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/watch\?.*v=([^&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
    /youtube\.com\/shorts\/([^?&]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
};

const formatVideo = (row) => ({
  ...row,
  tags: safeJSON(row.tags),
  isPublic: !!row.isPublic,
  addedBy: row.addedByName ? { id: row.addedBy, name: row.addedByName, avatar: row.addedByAvatar } : row.addedBy,
});

// ─── GET /api/videos ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { q, tag, page = 1, limit = 12 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = 'v.isPublic = 1';
    const params = [];

    if (q) { where += ` AND (v.title LIKE ? OR v.description LIKE ?)`; params.push(`%${q}%`, `%${q}%`); }
    if (tag) { where += ` AND v.tags LIKE ?`; params.push(`%"${tag}"%`); }

    const sql = `
      SELECT v.*, u.name AS addedByName, u.avatar AS addedByAvatar
      FROM lms_videos v
      LEFT JOIN User u ON u.id = v.addedBy
      WHERE ${where} ORDER BY v.createdAt DESC LIMIT ? OFFSET ?`;
    const [rows] = await db.query(sql, [...params, parseInt(limit), offset]);
    const [countRows] = await db.query(`SELECT COUNT(*) AS total FROM lms_videos v WHERE ${where}`, params);
    const total = countRows[0].total;

    res.json({
      success: true,
      videos: rows.map(formatVideo),
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── GET /api/videos/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT v.*, u.name AS addedByName, u.avatar AS addedByAvatar
       FROM lms_videos v LEFT JOIN User u ON u.id = v.addedBy WHERE v.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Video not found' });
    await db.query('UPDATE lms_videos SET viewCount = viewCount + 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true, video: formatVideo(rows[0]) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── POST /api/videos ────────────────────────────────────────────────────────
router.post('/', protect, authorize('trainer', 'admin'), async (req, res) => {
  try {
    const { title, description = '', youtubeUrl, tags = [], isPublic = true } = req.body;
    const youtubeVideoId = extractYouTubeId(youtubeUrl);
    if (!youtubeVideoId) return res.status(400).json({ success: false, message: 'Invalid YouTube URL' });

    const thumbnailUrl = `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`;
    const [result] = await db.query(
      `INSERT INTO lms_videos (addedBy, title, description, youtubeUrl, youtubeVideoId, thumbnailUrl, tags, isPublic)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, title, description, youtubeUrl, youtubeVideoId, thumbnailUrl, JSON.stringify(tags), isPublic ? 1 : 0]
    );
    const [rows] = await db.query('SELECT * FROM lms_videos WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, video: formatVideo(rows[0]) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── PUT /api/videos/:id ─────────────────────────────────────────────────────
router.put('/:id', protect, authorize('trainer', 'admin'), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM lms_videos WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Video not found' });
    if (rows[0].addedBy !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    const v = rows[0];
    let { title, description, youtubeUrl, tags, isPublic } = req.body;
    let youtubeVideoId = v.youtubeVideoId, thumbnailUrl = v.thumbnailUrl;

    if (youtubeUrl) {
      youtubeVideoId = extractYouTubeId(youtubeUrl);
      if (!youtubeVideoId) return res.status(400).json({ success: false, message: 'Invalid YouTube URL' });
      thumbnailUrl = `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`;
    }

    await db.query(
      `UPDATE lms_videos SET title=?, description=?, youtubeUrl=?, youtubeVideoId=?, thumbnailUrl=?, tags=?, isPublic=?, updatedAt=NOW() WHERE id=?`,
      [title ?? v.title, description ?? v.description, youtubeUrl ?? v.youtubeUrl,
       youtubeVideoId, thumbnailUrl, tags !== undefined ? JSON.stringify(tags) : v.tags,
       isPublic !== undefined ? (isPublic ? 1 : 0) : v.isPublic, req.params.id]
    );
    const [updated] = await db.query('SELECT * FROM lms_videos WHERE id = ?', [req.params.id]);
    res.json({ success: true, video: formatVideo(updated[0]) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── DELETE /api/videos/:id ──────────────────────────────────────────────────
router.delete('/:id', protect, authorize('trainer', 'admin'), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM lms_videos WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Video not found' });
    if (rows[0].addedBy !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });
    await db.query('DELETE FROM lms_videos WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Video deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
