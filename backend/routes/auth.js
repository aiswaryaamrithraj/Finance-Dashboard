// routes/auth.js
const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validateLogin, validateRegister } = require('../middleware/validate');

const router = express.Router();

// POST /api/auth/register — create a new account
router.post('/register', validateRegister, register);

// POST /api/auth/login — get a JWT token
router.post('/login', validateLogin, login);

// GET /api/auth/me — get current user profile (protected)
router.get('/me', authenticate, getMe);

module.exports = router;
