require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./src/routes/auth');
const cardRoutes = require('./src/routes/cards');
const beneficiaryRoutes = require('./src/routes/beneficiaries');
const transactionRoutes = require('./src/routes/transactions');

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

// ─── Dynamic Frontend Resolution & Serving ───────────────────────────────────
function getIndexPath() {
  const candidates = [
    path.resolve(__dirname, '..', 'web', 'dist', 'index.html'),
    path.resolve(__dirname, 'web', 'dist', 'index.html'),
    path.resolve(__dirname, 'dist', 'index.html'),
    path.resolve(__dirname, '..', 'dist', 'index.html'),
    path.resolve(__dirname, '..', 'public_html', 'index.html'),
  ];
  for (const candidate of candidates) {
    if (require('fs').existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();

  const indexPath = getIndexPath();

  if (indexPath) {
    const distDir = path.dirname(indexPath);
    const requestedPath = path.join(distDir, req.path);

    // If a specific static asset (CSS, JS, images) is requested and exists
    if (req.path !== '/' && require('fs').existsSync(requestedPath) && require('fs').statSync(requestedPath).isFile()) {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      return res.sendFile(requestedPath, { dotfiles: 'allow' }, (err) => {
        if (err && !res.headersSent) {
          next(err);
        }
      });
    }

    // SPA fallback — serve index.html for all other routes
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res.sendFile(indexPath, { dotfiles: 'allow' }, (err) => {
      if (err && !res.headersSent) {
        try {
          // Fallback to direct fs read if sendFile is blocked by hostinger path rules
          const htmlContent = require('fs').readFileSync(indexPath, 'utf8');
          res.type('html').send(htmlContent);
        } catch (readErr) {
          console.error('Error sending index.html:', err);
          res.status(500).send(`<h3>Error serving index.html: ${err.message}</h3>`);
        }
      }
    });
  }

  // Diagnostic 404 if index.html is missing
  const checkedPaths = [
    path.resolve(__dirname, '..', 'web', 'dist', 'index.html'),
    path.resolve(__dirname, 'web', 'dist', 'index.html'),
    path.resolve(__dirname, 'dist', 'index.html'),
    path.resolve(__dirname, '..', 'dist', 'index.html'),
  ];

  res.status(404).send(`
    <div style="font-family: system-ui, sans-serif; padding: 2rem; max-width: 650px; margin: 40px auto; background: #0f172a; color: #f8fafc; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
      <h2 style="color: #f43f5e; margin-top: 0;">⚠️ TezSend API is running, but Frontend is missing!</h2>
      <p>The backend could not find <code>index.html</code> in any of these expected locations:</p>
      <ul style="background: #1e293b; padding: 1rem 1.5rem; border-radius: 8px; font-family: monospace; font-size: 13px;">
        ${checkedPaths.map(p => `<li style="margin-bottom: 6px;">${p}</li>`).join('')}
      </ul>
      <p style="color: #94a3b8; font-size: 14px;">This means the React build (<code>npm run build</code> in the <code>web</code> directory) did not complete during Hostinger deployment.</p>
    </div>
  `);
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
