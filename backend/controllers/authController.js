// controllers/authController.js
// Controllers contain the actual business logic for each route.
// They receive (req, res) and send back responses.

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');

// ─── generateToken ─────────────────────────────────────────────────────────────
// Helper: creates a signed JWT containing the user's ID.
// The token expires after the time set in .env (e.g. "24h").
const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });

// ─── POST /api/auth/register ───────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password, role = 'viewer' } = req.body;

    // Check if email is already taken
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ?', [email]
    );
    if (existing.length) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Hash password before storing (NEVER store plain text passwords)
    const hashedPassword = await bcrypt.hash(password, 12);

    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );

    const token = generateToken(result.insertId);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        token,
        user: { id: result.insertId, name, email, role, status: 'active' },
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// ─── POST /api/auth/login ──────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Fetch user by email (include password hash for comparison)
    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ?', [email]
    );
    if (!rows.length) {
      // Use a vague message so attackers can't enumerate valid emails
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const user = rows[0];

    if (user.status === 'inactive') {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive. Contact an administrator.',
      });
    }

    // bcrypt.compare hashes the provided password and compares to the stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user.id);

    // Never send the password hash to the client
    const { password: _, ...safeUser } = user;

    res.json({
      success: true,
      message: 'Logged in successfully.',
      data: { token, user: safeUser },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// ─── GET /api/auth/me ──────────────────────────────────────────────────────────
// Returns the currently logged-in user's profile.
// req.user is populated by the authenticate middleware.
const getMe = async (req, res) => {
  res.json({
    success: true,
    data: { user: req.user },
  });
};

module.exports = { register, login, getMe };
