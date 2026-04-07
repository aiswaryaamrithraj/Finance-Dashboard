// middleware/validate.js
// Reusable validation rules using express-validator.
// express-validator lets you describe rules as arrays, then check them in a middleware.

const { body, query, param, validationResult } = require('express-validator');

// ─── handleValidationErrors ────────────────────────────────────────────────────
// Always add this AFTER your validation rule arrays.
// It collects all errors and returns them in a clean format.
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ─── Auth Validators ───────────────────────────────────────────────────────────
const validateLogin = [
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors,
];

const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'analyst', 'viewer']).withMessage('Role must be admin, analyst, or viewer'),
  handleValidationErrors,
];

// ─── Record Validators ─────────────────────────────────────────────────────────
const validateRecord = [
  body('amount')
    .isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('type')
    .isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('category')
    .trim()
    .notEmpty().withMessage('Category is required')
    .isLength({ max: 100 }).withMessage('Category max 100 characters'),
  body('date')
    .isISO8601().withMessage('Date must be a valid date (YYYY-MM-DD)'),
  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('Description max 500 characters'),
  handleValidationErrors,
];

// ─── Query Validators (for filtering) ─────────────────────────────────────────
const validateRecordQuery = [
  query('type')
    .optional()
    .isIn(['income', 'expense']).withMessage('Type filter must be income or expense'),
  query('startDate')
    .optional()
    .isISO8601().withMessage('startDate must be YYYY-MM-DD'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('endDate must be YYYY-MM-DD'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be 1–100'),
  handleValidationErrors,
];

// ─── User Update Validators ────────────────────────────────────────────────────
const validateUserUpdate = [
  body('role')
    .optional()
    .isIn(['admin', 'analyst', 'viewer']).withMessage('Invalid role'),
  body('status')
    .optional()
    .isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
  handleValidationErrors,
];

module.exports = {
  validateLogin,
  validateRegister,
  validateRecord,
  validateRecordQuery,
  validateUserUpdate,
};
