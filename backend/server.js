// server.js
// The main entry point for the backend.
// This file wires everything together: middleware, routes, error handling.

const express    = require('express');
const cors       = require('cors');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
require('dotenv').config();

// Initialize the database connection immediately when server starts
require('./config/db');

const app = express();

// ─── Global Middleware ─────────────────────────────────────────────────────────

// CORS: Allow requests from the React frontend
// Accepts both the proxy setup and the direct dev URL
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ],
  credentials: true,
}));

// Parse JSON request bodies (so req.body works)
app.use(express.json());

// HTTP request logger (shows method, path, status, response time in dev)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate Limiting: Prevents brute-force attacks.
// Limits each IP to 100 requests per 15 minutes.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api', limiter);

// Stricter limiter on auth routes (prevent password brute-forcing)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts. Please wait 15 minutes.' },
});
app.use('/api/auth', authLimiter);

// ─── Routes ────────────────────────────────────────────────────────────────────

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/records',   require('./routes/records'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/users',     require('./routes/users'));

// Health check — useful to verify the server is running
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Finance Dashboard API is running.', timestamp: new Date() });
});

// ─── 404 Handler ───────────────────────────────────────────────────────────────
// Catches any request that didn't match a route above
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

// ─── Global Error Handler ───────────────────────────────────────────────────────
// Express calls this when any route handler calls next(error)
// Having 4 parameters (err, req, res, next) is how Express identifies error middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
});

// ─── Start Server ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Finance Dashboard API running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
