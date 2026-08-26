const jwt = require('jsonwebtoken');
const db  = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// ─── protect ─────────────────────────────────────────────────────────────────
// Verifies LMS JWT and populates req.user with { id, name, email, avatar, role }
const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded.lmsUserId) {
      return res.status(401).json({ success: false, message: 'Not authorized, invalid token type' });
    }

    const [rows] = await db.query(
      'SELECT id, name, email, avatar, role, isActive FROM lms_users WHERE id = ? LIMIT 1',
      [decoded.lmsUserId]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (!rows[0].isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

// ─── authorize ────────────────────────────────────────────────────────────────
// Usage: authorize('trainer', 'admin')
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Role '${req.user?.role || 'unknown'}' is not authorized for this action`,
    });
  }
  next();
};

module.exports = { protect, authorize };
