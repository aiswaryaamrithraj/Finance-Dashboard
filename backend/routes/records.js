// routes/records.js
const express = require('express');
const {
  getRecords, getRecord, createRecord, updateRecord, deleteRecord,
} = require('../controllers/recordsController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRecord, validateRecordQuery } = require('../middleware/validate');

const router = express.Router();

// All record routes require authentication
router.use(authenticate);

// GET  /api/records        — all roles can read
router.get('/',    validateRecordQuery, getRecords);
router.get('/:id', getRecord);

// POST /api/records        — admin and analyst only
router.post('/', authorize('admin', 'analyst'), validateRecord, createRecord);

// PUT  /api/records/:id    — admin only
router.put('/:id', authorize('admin'), validateRecord, updateRecord);

// DELETE /api/records/:id  — admin only
router.delete('/:id', authorize('admin'), deleteRecord);

module.exports = router;
