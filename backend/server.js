require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./src/routes/auth');
const cardRoutes = require('./src/routes/cards');
const beneficiaryRoutes = require('./src/routes/beneficiaries');
const transactionRoutes = require('./src/routes/transactions');

// ─── LMS Routes ───────────────────────────────────────────────────────────────
const lmsSubjectRoutes   = require('./src/routes/lms/subjects');
const lmsNoteRoutes      = require('./src/routes/lms/notes');
const lmsVideoRoutes     = require('./src/routes/lms/videos');
const lmsQuizRoutes      = require('./src/routes/lms/quizzes');
const lmsFlashcardRoutes = require('./src/routes/lms/flashcards');
const lmsAdminRoutes     = require('./src/routes/lms/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── CORS ─────────────────────────────────────────────────────────────────────
const defaultAllowed = [
  'https://tezsend.com',
  'https://www.tezsend.com',
  'http://localhost:5173',
  'http://localhost:3000'
];

const envAllowed = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [];

const allowedOrigins = [...new Set([...defaultAllowed, ...envAllowed])];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Allow any subdomains of tezsend.com
      if (origin.endsWith('.tezsend.com') || origin === 'https://tezsend.com') {
        return callback(null, true);
      }
      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
// ─── TezSend (Payment) Routes ────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/beneficiaries', beneficiaryRoutes);
app.use('/api/transactions', transactionRoutes);

app.get('/api', (req, res) => {
  res.json({ status: 'ok', message: 'Welcome to the TezSend API' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'TezSend API is running' });
});

// ─── LMS (DolphinCoder → tezsend.com) Routes ─────────────────────────────────
app.use('/api/subjects',   lmsSubjectRoutes);
app.use('/api/notes',      lmsNoteRoutes);
app.use('/api/videos',     lmsVideoRoutes);
app.use('/api/quizzes',    lmsQuizRoutes);
app.use('/api/flashcards', lmsFlashcardRoutes);
app.use('/api/admin',      lmsAdminRoutes);



// ─── Dual Frontend Serving ────────────────────────────────────────────────────
// /transferred/* → web/dist   (TezSend payment app)
// everything else → frontend/dist  (LMS)
function findDist(candidates) {
  for (const c of candidates) {
    if (require('fs').existsSync(c)) return c;
  }
  return null;
}

const tezIndexPath = findDist([
  path.resolve(__dirname, '..', 'web', 'dist', 'index.html'),
  path.resolve(__dirname, 'web', 'dist', 'index.html'),
  path.resolve(__dirname, 'dist', 'index.html'),
  path.resolve(__dirname, '..', 'dist', 'index.html'),
]);

const lmsIndexPath = findDist([
  path.resolve(__dirname, '..', 'frontend', 'dist', 'index.html'),
  path.resolve(__dirname, 'frontend', 'dist', 'index.html'),
  path.resolve(__dirname, '..', 'lms_dist', 'index.html'),
]);

function serveApp(indexPath, req, res, next) {
  if (!indexPath) {
    return res.status(404).send('Frontend not built. Run npm run build.');
  }
  const distDir = path.dirname(indexPath);
  const requestedFile = path.join(distDir, req.path);
  if (req.path !== '/' && require('fs').existsSync(requestedFile) && require('fs').statSync(requestedFile).isFile()) {
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    return res.sendFile(requestedFile, (err) => { if (err && !res.headersSent) next(err); });
  }
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  return res.sendFile(indexPath, (err) => {
    if (err && !res.headersSent) {
      try {
        const html = require('fs').readFileSync(indexPath, 'utf8');
        res.type('html').send(html);
      } catch (e) {
        res.status(500).send('Error serving index.html: ' + err.message);
      }
    }
  });
}

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();

  // /transferred/* → TezSend payment app
  if (req.path.startsWith('/transferred')) {
    return serveApp(tezIndexPath, req, res, next);
  }

  // everything else → LMS app
  return serveApp(lmsIndexPath, req, res, next);
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    message: 'Internal server error', 
    error: err.message,
    stack: err.stack
  });
});

// ─── Start server ─────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`🚀 TezSend API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

// Graceful shutdown on PM2 SIGINT
process.on('SIGINT', () => {
  console.log('SIGINT received – shutting down gracefully');
  server.close(() => process.exit(0));
});
process.on('SIGTERM', () => {
  console.log('SIGTERM received – shutting down gracefully');
  server.close(() => process.exit(0));
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

module.exports = app;
