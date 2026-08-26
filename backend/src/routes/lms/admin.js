const { Router } = require('express');
const db = require('../../db');
const { protect, authorize } = require('../middleware/lmsAuth');

const router = Router();

// All admin routes require authentication + admin role
router.use(protect, authorize('admin'));

// ─── GET /api/admin/users ────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = '1=1';
    const params = [];
    if (role) { where += ' AND lmsRole = ?'; params.push(role); }

    const [rows] = await db.query(
      `SELECT id, name, email, avatar, lmsRole AS role, lmsIsActive AS isActive, createdAt
       FROM User WHERE ${where} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM User WHERE ${where}`, params
    );
    res.json({
      success: true,
      users: rows.map(u => ({ ...u, isActive: !!u.isActive })),
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── PUT /api/admin/users/:id/role ───────────────────────────────────────────
// Promote / demote a user's LMS role
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['student', 'trainer', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be student, trainer or admin' });
    }
    const [rows] = await db.query('SELECT id, lmsRole AS currentRole FROM User WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found' });

    await db.query('UPDATE User SET lmsRole = ?, updatedAt = NOW() WHERE id = ?', [role, req.params.id]);
    const [updated] = await db.query(
      'SELECT id, name, email, avatar, lmsRole AS role, lmsIsActive AS isActive FROM User WHERE id = ?',
      [req.params.id]
    );
    res.json({ success: true, user: { ...updated[0], isActive: !!updated[0].isActive } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── PUT /api/admin/users/:id/toggle-active ──────────────────────────────────
router.put('/users/:id/toggle-active', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, lmsRole AS role, lmsIsActive AS isActive FROM User WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found' });
    if (rows[0].role === 'admin') return res.status(403).json({ success: false, message: 'Cannot deactivate an admin' });

    const newActive = rows[0].isActive ? 0 : 1;
    await db.query('UPDATE User SET lmsIsActive = ?, updatedAt = NOW() WHERE id = ?', [newActive, req.params.id]);
    const [updated] = await db.query(
      'SELECT id, name, email, avatar, lmsRole AS role, lmsIsActive AS isActive FROM User WHERE id = ?',
      [req.params.id]
    );
    res.json({ success: true, user: { ...updated[0], isActive: !!updated[0].isActive } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── GET /api/admin/stats ────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [[{ totalUsers }]]     = await db.query('SELECT COUNT(*) AS totalUsers FROM User');
    const [[{ totalStudents }]]  = await db.query("SELECT COUNT(*) AS totalStudents FROM User WHERE lmsRole = 'student'");
    const [[{ totalTrainers }]]  = await db.query("SELECT COUNT(*) AS totalTrainers FROM User WHERE lmsRole = 'trainer'");
    const [[{ totalNotes }]]     = await db.query('SELECT COUNT(*) AS totalNotes FROM lms_notes');
    const [[{ totalVideos }]]    = await db.query('SELECT COUNT(*) AS totalVideos FROM lms_videos');
    const [[{ totalQuizzes }]]   = await db.query('SELECT COUNT(*) AS totalQuizzes FROM lms_quizzes');
    const [[{ totalFlashcards }]]= await db.query('SELECT COUNT(*) AS totalFlashcards FROM lms_flashcards');
    res.json({ success: true, stats: { totalUsers, totalStudents, totalTrainers, totalNotes, totalVideos, totalQuizzes, totalFlashcards } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
