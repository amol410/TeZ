const { Router } = require('express');
const { randomUUID, randomBytes } = require('crypto');
const { authenticate } = require('../middleware/auth');
const db = require('../db');

const router = Router();
const CONVENIENCE_FEE_RATE = 0.02;

router.use(authenticate);

router.post('/calculate-fee', (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Invalid amount' });
  }
  const convenienceFee = amount * CONVENIENCE_FEE_RATE;
  const totalAmount = amount + convenienceFee;
  res.json({ amount, convenienceFee, totalAmount });
});

router.post('/initiate', async (req, res) => {
  const { beneficiaryId, amount } = req.body;
  if (!beneficiaryId || !amount) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const convenienceFee = amount * CONVENIENCE_FEE_RATE;
  const totalAmount = amount + convenienceFee;

  try {
    const id = randomUUID();
    const now = new Date();
    await db.query(
      'INSERT INTO Transaction (id, userId, beneficiaryId, amount, convenienceFee, totalAmount, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, req.userId, beneficiaryId, amount, convenienceFee, totalAmount, 'PENDING', now, now]
    );

    const mockAirpayOrderId = `AIRPAY_${randomBytes(8).toString('hex').toUpperCase()}`;
    await db.query('UPDATE Transaction SET airpayOrderId = ?, updatedAt = ? WHERE id = ?',
      [mockAirpayOrderId, new Date(), id]);

    res.json({ transactionId: id, airpayOrderId: mockAirpayOrderId, totalAmount, currency: 'INR' });
  } catch (error) {
    res.status(500).json({ message: 'Error initiating transaction', error: error.message });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT SUM(totalAmount) as totalVolume 
       FROM \`Transaction\` 
       WHERE userId = ? AND (status = 'completed' OR status = 'COMPLETED')`,
      [req.userId]
    );
    const totalVolume = rows[0].totalVolume || 0;
    res.json({ totalVolume: Number(totalVolume) });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching summary', error: error.message });
  }
});

router.get('/history', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        t.id, t.userId, t.beneficiaryId, t.amount, t.convenienceFee, t.totalAmount,
        t.status, t.airpayOrderId, t.createdAt, t.updatedAt,
        b.id as b_id, b.type as b_type, b.upiId as b_upiId,
        b.accountNo as b_accountNo, b.ifsc as b_ifsc, b.bankName as b_bankName
       FROM \`Transaction\` t
       LEFT JOIN Beneficiary b ON t.beneficiaryId = b.id
       WHERE t.userId = ?
       ORDER BY t.createdAt DESC`,
      [req.userId]
    );

    const transactions = rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      beneficiaryId: r.beneficiaryId,
      amount: r.amount,
      convenienceFee: r.convenienceFee,
      totalAmount: r.totalAmount,
      status: r.status,
      airpayOrderId: r.airpayOrderId,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      beneficiary: r.b_id ? {
        id: r.b_id,
        type: r.b_type,
        upiId: r.b_upiId,
        accountNo: r.b_accountNo,
        ifsc: r.b_ifsc,
        bankName: r.b_bankName,
      } : null,
    }));

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions', error: error.message });
  }
});

module.exports = router;
