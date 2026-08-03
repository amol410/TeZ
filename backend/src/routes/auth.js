const { Router } = require('express');
const { randomUUID } = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { firebaseApp } = require('../firebaseAdmin');
const { getAuth } = require('firebase-admin/auth');

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const SAFE_FIELDS = 'id, phone, email, name, googleId, avatar, createdAt, updatedAt';

const signToken = (userId) => jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });

// ─── Register with email + password ──────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }

  try {
    let checkSql = 'SELECT id FROM User WHERE email = ?';
    let checkParams = [email];
    if (phone) {
      checkSql = 'SELECT id FROM User WHERE email = ? OR phone = ?';
      checkParams = [email, phone];
    }
    const [existing] = await db.query(checkSql, checkParams);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = randomUUID();
    const now = new Date();

    await db.query(
      'INSERT INTO User (id, email, name, passwordHash, phone, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, email, name, passwordHash, phone || null, now, now]
    );

    const [rows] = await db.query(`SELECT ${SAFE_FIELDS} FROM User WHERE id = ?`, [id]);
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
    const [rows] = await db.query('SELECT * FROM User WHERE email = ?', [email]);
    const user = rows[0];

    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user.id);
    const [safeRows] = await db.query(`SELECT ${SAFE_FIELDS} FROM User WHERE id = ?`, [user.id]);
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

    // @react-oauth/google sends an access_token, not an id_token
    // Try fetching from Google userinfo endpoint first
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
      // Fallback: try verifying as a standard Google ID Token
      const ticket = await googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) return res.status(401).json({ message: 'Invalid Google token' });
      googleId = payload.sub;
      email = payload.email;
      name = payload.name;
      avatar = payload.picture;
    }

    if (!email) return res.status(401).json({ message: 'Could not retrieve email from Google' });

    const [rows] = await db.query('SELECT * FROM User WHERE googleId = ? OR email = ? LIMIT 1', [googleId, email]);
    let user = rows[0];

    if (!user) {
      const id = randomUUID();
      const now = new Date();
      await db.query(
        'INSERT INTO User (id, googleId, email, name, avatar, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, googleId, email, name, avatar || null, now, now]
      );
      const [newRows] = await db.query(`SELECT ${SAFE_FIELDS} FROM User WHERE id = ?`, [id]);
      user = newRows[0];
    } else if (!user.googleId) {
      await db.query('UPDATE User SET googleId = ?, avatar = ?, updatedAt = ? WHERE id = ?',
        [googleId, avatar || user.avatar, new Date(), user.id]);
      const [updRows] = await db.query(`SELECT ${SAFE_FIELDS} FROM User WHERE id = ?`, [user.id]);
      user = updRows[0];
    } else {
      const [safeRows] = await db.query(`SELECT ${SAFE_FIELDS} FROM User WHERE id = ?`, [user.id]);
      user = safeRows[0];
    }

    const token = signToken(user.id);
    res.json({ token, user });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ message: 'Google authentication failed' });
  }
});


// ─── Firebase-backed Google sign-in ──────────────────────────────────────────
router.post('/firebase-google', async (req, res) => {
  if (!firebaseApp) return res.status(503).json({ message: 'Firebase is not configured on this server' });
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ message: 'Firebase ID token is required' });

  try {
    const decodedToken = await getAuth(firebaseApp).verifyIdToken(idToken);
    const email = decodedToken.email;
    const firebaseUid = decodedToken.uid;
    const name = decodedToken.name || 'Firebase User';
    const avatar = decodedToken.picture || null;

    if (!email) return res.status(401).json({ message: 'Invalid Firebase token (no email)' });

    const [rows] = await db.query('SELECT * FROM User WHERE email = ? OR googleId = ? LIMIT 1', [email, firebaseUid]);
    let user = rows[0];

    if (!user) {
      const id = randomUUID();
      const now = new Date();
      await db.query(
        'INSERT INTO User (id, googleId, email, name, avatar, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, firebaseUid, email, name, avatar, now, now]
      );
      const [newRows] = await db.query(`SELECT ${SAFE_FIELDS} FROM User WHERE id = ?`, [id]);
      user = newRows[0];
    } else if (!user.googleId) {
      await db.query('UPDATE User SET googleId = ?, avatar = ?, updatedAt = ? WHERE id = ?',
        [firebaseUid, avatar || user.avatar, new Date(), user.id]);
      const [updRows] = await db.query(`SELECT ${SAFE_FIELDS} FROM User WHERE id = ?`, [user.id]);
      user = updRows[0];
    } else {
      const [safeRows] = await db.query(`SELECT ${SAFE_FIELDS} FROM User WHERE id = ?`, [user.id]);
      user = safeRows[0];
    }

    const token = signToken(user.id);
    res.json({ token, user });
  } catch (error) {
    console.error('Firebase Google auth error:', error?.message || error);
    res.status(401).json({ message: 'Firebase Google authentication failed', detail: error?.message });
  }
});

// ─── Firebase Phone Auth ──────────────────────────────────────────────────────
router.post('/firebase-phone', async (req, res) => {
  if (!firebaseApp) return res.status(503).json({ message: 'Firebase is not configured on this server' });
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ message: 'Firebase ID token is required' });

  try {
    const decodedToken = await getAuth(firebaseApp).verifyIdToken(idToken);
    const phone = decodedToken.phone_number;

    if (!phone) return res.status(400).json({ message: 'No phone number associated with this Firebase account' });

    const [rows] = await db.query('SELECT * FROM User WHERE phone = ? LIMIT 1', [phone]);
    let user = rows[0];

    if (!user) {
      const id = randomUUID();
      const now = new Date();
      const email = `${phone.replace('+', '')}@tezsend-app.internal`;
      await db.query(
        'INSERT INTO User (id, phone, email, name, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
        [id, phone, email, 'Mobile User', now, now]
      );
      const [newRows] = await db.query(`SELECT ${SAFE_FIELDS} FROM User WHERE id = ?`, [id]);
      user = newRows[0];
    } else {
      const [safeRows] = await db.query(`SELECT ${SAFE_FIELDS} FROM User WHERE id = ?`, [user.id]);
      user = safeRows[0];
    }

    const token = signToken(user.id);
    res.json({ token, user });
  } catch (error) {
    console.error('Firebase Phone auth error:', error?.message);
    res.status(401).json({ message: 'Firebase authentication failed', detail: error?.message });
  }
});

// ─── Mock Phone Auth ──────────────────────────────────────────────────────────
router.post('/mock-phone', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: 'Phone number is required' });

  try {
    const [rows] = await db.query('SELECT * FROM User WHERE phone = ? LIMIT 1', [phone]);
    let user = rows[0];

    if (!user) {
      const id = randomUUID();
      const now = new Date();
      await db.query(
        'INSERT INTO User (id, phone, email, name, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
        [id, phone, `${phone.replace('+', '')}@tezsend-mock.internal`, 'Mock Mobile User', now, now]
      );
      const [newRows] = await db.query(`SELECT ${SAFE_FIELDS} FROM User WHERE id = ?`, [id]);
      user = newRows[0];
    } else {
      const [safeRows] = await db.query(`SELECT ${SAFE_FIELDS} FROM User WHERE id = ?`, [user.id]);
      user = safeRows[0];
    }

    const token = signToken(user.id);
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ message: 'Mock authentication failed' });
  }
});

// ─── Get current user ─────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT ${SAFE_FIELDS} FROM User WHERE id = ?`, [req.userId]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
});

// ─── Link phone to existing account ──────────────────────────────────────────
router.post('/link-phone', authenticate, async (req, res) => {
  if (!firebaseApp) return res.status(503).json({ message: 'Firebase is not configured on this server' });
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ message: 'Firebase ID token is required' });

  try {
    const decodedToken = await getAuth(firebaseApp).verifyIdToken(idToken);
    const phone = decodedToken.phone_number;

    if (!phone) return res.status(400).json({ message: 'No phone number associated with this Firebase token' });

    const [existing] = await db.query('SELECT id FROM User WHERE phone = ? AND id != ?', [phone, req.userId]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'This phone number is already linked to another account' });
    }

    await db.query('UPDATE User SET phone = ?, updatedAt = ? WHERE id = ?', [phone, new Date(), req.userId]);
    const [rows] = await db.query(`SELECT ${SAFE_FIELDS} FROM User WHERE id = ?`, [req.userId]);
    res.json({ message: 'Phone number linked successfully', user: rows[0] });
  } catch (error) {
    console.error('Link phone error:', error?.message);
    res.status(401).json({ message: 'Phone verification failed', detail: error?.message });
  }
});

module.exports = router;
