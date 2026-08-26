const { Router } = require('express');
const { randomUUID } = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const db = require('../../db');
const { protect } = require('../../middleware/lmsAuth');

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const SAFE_FIELDS = 'id, email, name, googleId, avatar, role, isActive, createdAt, updatedAt';

const signToken = (userId) => jwt.sign({ lmsUserId: userId }, JWT_SECRET, { expiresIn: '7d' });

// ─── Register with email + password ──────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }

  try {
    const [existing] = await db.query('SELECT id FROM lms_users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = randomUUID();
    const now = new Date();

    await db.query(
      'INSERT INTO lms_users (id, email, name, passwordHash, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
      [id, email, name, passwordHash, now, now]
    );

    const [rows] = await db.query(`SELECT ${SAFE_FIELDS} FROM lms_users WHERE id = ?`, [id]);
    const token = signToken(id);
    res.status(201).json({ token, user: rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// ─── Login with email + password ─────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM lms_users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    const token = signToken(user.id);
    const [safeRows] = await db.query(`SELECT ${SAFE_FIELDS} FROM lms_users WHERE id = ?`, [user.id]);
    res.json({ token, user: safeRows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// ─── Google OAuth ─────────────────────────────────────────────────────────────
router.post('/google', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ message: 'Google token is required' });

  try {
    let googleId, email, name, avatar;

    const userinfoRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
      headers: { Authorization: `Bearer ${idToken}` }
    });

    if (userinfoRes.ok) {
      const userinfo = await userinfoRes.json();
      googleId = userinfo.sub;
      email = userinfo.email;
      name = userinfo.name;
      avatar = userinfo.picture;
    } else {
      const ticket = await googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) return res.status(401).json({ message: 'Invalid Google token' });
      googleId = payload.sub;
      email = payload.email;
      name = payload.name;
      avatar = payload.picture;
    }

    if (!email) return res.status(401).json({ message: 'Could not retrieve email from Google' });

    const [rows] = await db.query('SELECT * FROM lms_users WHERE googleId = ? OR email = ? LIMIT 1', [googleId, email]);
    let user = rows[0];

    if (!user) {
      const id = randomUUID();
      const now = new Date();
      await db.query(
        'INSERT INTO lms_users (id, googleId, email, name, avatar, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, googleId, email, name, avatar || null, now, now]
      );
      const [newRows] = await db.query(`SELECT ${SAFE_FIELDS} FROM lms_users WHERE id = ?`, [id]);
      user = newRows[0];
    } else if (!user.googleId) {
      await db.query('UPDATE lms_users SET googleId = ?, avatar = ?, updatedAt = ? WHERE id = ?',
        [googleId, avatar || user.avatar, new Date(), user.id]);
      const [updRows] = await db.query(`SELECT ${SAFE_FIELDS} FROM lms_users WHERE id = ?`, [user.id]);
      user = updRows[0];
    } else {
      const [safeRows] = await db.query(`SELECT ${SAFE_FIELDS} FROM lms_users WHERE id = ?`, [user.id]);
      user = safeRows[0];
    }
    
    if (user && !user.isActive) {
       return res.status(403).json({ message: 'Account is deactivated' });
    }

    const token = signToken(user.id);
    res.json({ token, user });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ message: 'Google authentication failed' });
  }
});

// ─── Get current user ─────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  // protect middleware already populates req.user
  res.json(req.user);
});

module.exports = router;
