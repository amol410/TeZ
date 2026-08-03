const { Router } = require('express');
const { randomUUID } = require('crypto');
const { authenticate } = require('../middleware/auth');
const db = require('../db');

const router = Router();
router.use(authenticate);

router.post('/', async (req, res) => {
  const { type, upiId, accountNo, ifsc, bankName } = req.body;
  try {
    const id = randomUUID();
    const now = new Date();
    await db.query(
      'INSERT INTO Beneficiary (id, userId, type, upiId, accountNo, ifsc, bankName, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, req.userId, type, upiId || null, accountNo || null, ifsc || null, bankName || null, now]
    );
    const [rows] = await db.query('SELECT * FROM Beneficiary WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error adding beneficiary', error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const [beneficiaries] = await db.query('SELECT * FROM Beneficiary WHERE userId = ?', [req.userId]);
    res.json(beneficiaries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching beneficiaries', error: error.message });
  }
});

module.exports = router;
