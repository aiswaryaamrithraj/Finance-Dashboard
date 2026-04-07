// middleware/auth.js
// JWT authentication + role-based authorization.
// Supports dual-secret verification so old tokens stay valid during rotation.

const jwt = require('jsonwebtoken');
const db  = require('../config/db');

// ─── verifyToken ───────────────────────────────────────────────────────────────
// Tries the current secret first, then falls back to the old secret.
// This means users don't get logged out the moment you rotate the secret.
//
// How rotation works:
//   1. Generate new secret → put it in JWT_SECRET
//   2. Move old secret     → put it in JWT_SECRET_OLD
//   3. Restart the server
//   4. Old tokens (signed with JWT_SECRET_OLD) still verify via fallback
//   5. As users log in again they get tokens signed with the new JWT_SECRET
//   6. After JWT_EXPIRES_IN time, all old tokens have expired naturally
//   7. Remove JWT_SECRET_OLD from .env — rotation complete

const verifyToken = (token) => {
  const secrets = [
    process.env.JWT_SECRET,
    process.env.JWT_SECRET_OLD,  // fallback during rotation (optional)
  ].filter(Boolean); // remove undefined if JWT_SECRET_OLD isn't set

  let lastError;
  for (const secret of secrets) {
    try {
      return jwt.verify(token, secret); // returns decoded payload if valid
    } catch (err) {
      lastError = err;
      // If it expired under this secret, no point trying the next one
      if (err.name === 'TokenExpiredError') throw err;
    }
  }
  throw lastError; // throw the last error (JsonWebTokenError)
};

// ─── authenticate ──────────────────────────────────────────────────────────────
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token   = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Always fetch fresh user from DB so role/status changes take effect immediately
    const [rows] = await db.query(
      'SELECT id, name, email, role, status FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    const user = rows[0];
    if (user.status === 'inactive') {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive. Contact an administrator.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please log in again.',
      });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

// ─── authorize ─────────────────────────────────────────────────────────────────
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access forbidden. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}.`,
      });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
