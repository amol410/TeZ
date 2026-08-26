const { Router } = require('express');
const multer  = require('multer');
const mammoth = require('mammoth');
const db = require('../../db');
const { protect, authorize } = require('../middleware/lmsAuth');

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const safeJSON = (v) => { try { return JSON.parse(v); } catch { return []; } };

const formatDeck = (row) => ({
  ...row,
  cards: safeJSON(row.cards),
  tags: safeJSON(row.tags),
  isPublic: !!row.isPublic,
  owner: row.ownerName ? { id: row.owner, name: row.ownerName, avatar: row.ownerAvatar } : row.owner,
});

router.use(protect);

// ─── POST /api/flashcards/bulk-upload ────────────────────────────────────────
// (must be before /:id to avoid route conflict)
router.post('/bulk-upload', authorize('trainer', 'admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const result = await mammoth.extractRawText({ buffer: req.file.buffer });
    const text = result.value;

    const deckNameMatch = text.match(/^DECK_NAME:\s*(.+)/m);
    const descMatch     = text.match(/^DESCRIPTION:\s*(.+)/m);
    const colorMatch    = text.match(/^COLOR:\s*(\w+)/m);

    const deckName    = deckNameMatch ? deckNameMatch[1].trim() : 'Uploaded Deck';
    const description = descMatch     ? descMatch[1].trim()     : '';
    const color       = colorMatch    ? colorMatch[1].trim()    : 'default';

    const cardBlocks = text.split(/\n(?=Q:)/i).filter(b => b.match(/^Q:/i));
    const cards = [];
    for (const block of cardBlocks) {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      const frontMatch = lines[0].match(/^Q:\s*(.+)/i);
      const backLine   = lines.find(l => /^A:/i.test(l));
      const hintLine   = lines.find(l => /^HINT:/i.test(l));
      if (!frontMatch || !backLine) continue;
      const front = frontMatch[1].trim();
      const back  = backLine.replace(/^A:\s*/i, '').trim();
      const hint  = hintLine ? hintLine.replace(/^HINT:\s*/i, '').trim() : '';
      if (front && back) cards.push({ front, back, hint });
    }

    if (!cards.length) return res.status(400).json({ success: false, message: 'No valid cards found' });

    const [result2] = await db.query(
      `INSERT INTO lms_flashcards (owner, deckName, description, color, cards, cardCount, isPublic) VALUES (?,?,?,?,?,?,0)`,
      [req.user.id, deckName, description, color, JSON.stringify(cards), cards.length]
    );
    const [rows] = await db.query('SELECT * FROM lms_flashcards WHERE id = ?', [result2.insertId]);
    res.status(201).json({ success: true, deck: formatDeck(rows[0]), message: `Deck created with ${cards.length} cards` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── GET /api/flashcards ─────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { q, page = 1, limit = 12 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = `(f.owner = ? OR f.isPublic = 1)`;
    const params = [req.user.id];

    if (q) { where += ` AND (f.deckName LIKE ? OR f.description LIKE ?)`; params.push(`%${q}%`, `%${q}%`); }

    const sql = `
      SELECT f.*, u.name AS ownerName, u.avatar AS ownerAvatar
      FROM lms_flashcards f LEFT JOIN User u ON u.id = f.owner
      WHERE ${where} ORDER BY f.createdAt DESC LIMIT ? OFFSET ?`;

    const [rows] = await db.query(sql, [...params, parseInt(limit), offset]);
    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM lms_flashcards f WHERE ${where}`, params);

    res.json({
      success: true,
      decks: rows.map(formatDeck),
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── POST /api/flashcards ────────────────────────────────────────────────────
router.post('/', authorize('trainer', 'admin'), async (req, res) => {
  try {
    const { deckName, description = '', cards = [], color = 'default', isPublic = false, tags = [] } = req.body;
    if (!cards.length) return res.status(400).json({ success: false, message: 'At least one card is required' });

    const [result] = await db.query(
      `INSERT INTO lms_flashcards (owner, deckName, description, cards, cardCount, color, isPublic, tags) VALUES (?,?,?,?,?,?,?,?)`,
      [req.user.id, deckName, description, JSON.stringify(cards), cards.length, color, isPublic ? 1 : 0, JSON.stringify(tags)]
    );
    const [rows] = await db.query('SELECT * FROM lms_flashcards WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, deck: formatDeck(rows[0]) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── GET /api/flashcards/:id ─────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT f.*, u.name AS ownerName, u.avatar AS ownerAvatar
       FROM lms_flashcards f LEFT JOIN User u ON u.id = f.owner WHERE f.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Deck not found' });
    const deck = formatDeck(rows[0]);
    if (!deck.isPublic && rows[0].owner !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });
    res.json({ success: true, deck });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── PUT /api/flashcards/:id ─────────────────────────────────────────────────
router.put('/:id', authorize('trainer', 'admin'), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM lms_flashcards WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Deck not found' });
    if (rows[0].owner !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    const d = rows[0];
    const { deckName, description, cards, color, isPublic, tags } = req.body;
    const newCards = cards !== undefined ? cards : safeJSON(d.cards);
    await db.query(
      `UPDATE lms_flashcards SET deckName=?, description=?, cards=?, cardCount=?, color=?, isPublic=?, tags=?, updatedAt=NOW() WHERE id=?`,
      [deckName ?? d.deckName, description ?? d.description, JSON.stringify(newCards), newCards.length,
       color ?? d.color, isPublic !== undefined ? (isPublic ? 1 : 0) : d.isPublic,
       tags !== undefined ? JSON.stringify(tags) : d.tags, req.params.id]
    );
    const [updated] = await db.query('SELECT * FROM lms_flashcards WHERE id = ?', [req.params.id]);
    res.json({ success: true, deck: formatDeck(updated[0]) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── DELETE /api/flashcards/:id ──────────────────────────────────────────────
router.delete('/:id', authorize('trainer', 'admin'), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM lms_flashcards WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Deck not found' });
    if (rows[0].owner !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });
    await db.query('DELETE FROM lms_flashcard_progress WHERE flashcard = ?', [req.params.id]);
    await db.query('DELETE FROM lms_flashcards WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Deck deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── POST /api/flashcards/:id/cards ─────────────────────────────────────────
router.post('/:id/cards', authorize('trainer', 'admin'), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM lms_flashcards WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Deck not found' });
    if (rows[0].owner !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });
    const cards = [...safeJSON(rows[0].cards), req.body];
    await db.query('UPDATE lms_flashcards SET cards=?, cardCount=?, updatedAt=NOW() WHERE id=?',
      [JSON.stringify(cards), cards.length, req.params.id]);
    const [updated] = await db.query('SELECT * FROM lms_flashcards WHERE id = ?', [req.params.id]);
    res.json({ success: true, deck: formatDeck(updated[0]) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── DELETE /api/flashcards/:id/cards/:cardId ────────────────────────────────
router.delete('/:id/cards/:cardId', authorize('trainer', 'admin'), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM lms_flashcards WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Deck not found' });
    if (rows[0].owner !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });
    const cards = safeJSON(rows[0].cards).filter((_, i) => String(i) !== req.params.cardId);
    await db.query('UPDATE lms_flashcards SET cards=?, cardCount=?, updatedAt=NOW() WHERE id=?',
      [JSON.stringify(cards), cards.length, req.params.id]);
    const [updated] = await db.query('SELECT * FROM lms_flashcards WHERE id = ?', [req.params.id]);
    res.json({ success: true, deck: formatDeck(updated[0]) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── GET /api/flashcards/:id/progress ───────────────────────────────────────
router.get('/:id/progress', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM lms_flashcard_progress WHERE student = ? AND flashcard = ?',
      [req.user.id, req.params.id]
    );
    const progress = rows[0]
      ? { ...rows[0], cardResults: safeJSON(rows[0].cardResults) }
      : null;
    res.json({ success: true, progress });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── POST /api/flashcards/:id/progress ──────────────────────────────────────
router.post('/:id/progress', async (req, res) => {
  try {
    const { cardResults } = req.body;
    const masteredCount = cardResults.filter(r => r.status === 'known').length;

    const [existing] = await db.query(
      'SELECT * FROM lms_flashcard_progress WHERE student = ? AND flashcard = ?',
      [req.user.id, req.params.id]
    );

    if (existing.length) {
      await db.query(
        `UPDATE lms_flashcard_progress SET cardResults=?, masteredCount=?, lastStudiedAt=NOW(), sessionCount=sessionCount+1, updatedAt=NOW()
         WHERE student=? AND flashcard=?`,
        [JSON.stringify(cardResults), masteredCount, req.user.id, req.params.id]
      );
    } else {
      await db.query(
        `INSERT INTO lms_flashcard_progress (student, flashcard, cardResults, masteredCount, lastStudiedAt, sessionCount) VALUES (?,?,?,?,NOW(),1)`,
        [req.user.id, req.params.id, JSON.stringify(cardResults), masteredCount]
      );
    }

    const [rows] = await db.query(
      'SELECT * FROM lms_flashcard_progress WHERE student = ? AND flashcard = ?',
      [req.user.id, req.params.id]
    );
    res.json({ success: true, progress: { ...rows[0], cardResults: safeJSON(rows[0].cardResults) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
