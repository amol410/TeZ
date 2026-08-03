const { Router } = require('express');
const { randomUUID } = require('crypto');
const { authenticate } = require('../middleware/auth');
const db = require('../db');

const router = Router();
router.use(authenticate);

router.post('/', async (req, res) => {
  const { token, last4, network } = req.body;
  try {
    const id = randomUUID();
    const now = new Date();
    await db.query(
      'INSERT INTO Card (id, userId, token, last4, network, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      [id, req.userId, token, last4, network, now]
    );
    const [rows] = await db.query('SELECT * FROM Card WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error adding card', error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const [cards] = await db.query('SELECT * FROM Card WHERE userId = ?', [req.userId]);
    res.json(cards);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cards', error: error.message });
  }
});

module.exports = router;
