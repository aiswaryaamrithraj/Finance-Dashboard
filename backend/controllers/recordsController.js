// controllers/recordsController.js
// Handles all CRUD operations for financial records.

const db = require('../config/db');

// ─── GET /api/records ──────────────────────────────────────────────────────────
// Supports: filtering by type/category/date range, search, pagination
// Any authenticated user can read records (role check in route).
const getRecords = async (req, res) => {
  try {
    const {
      type,
      category,
      startDate,
      endDate,
      search,
      page  = 1,
      limit = 10,
    } = req.query;

    // Build WHERE clauses dynamically based on provided filters
    // We use parameterized queries (?) to prevent SQL injection
    const conditions = ['r.deleted_at IS NULL']; // Only non-deleted records
    const params = [];

    if (type) {
      conditions.push('r.type = ?');
      params.push(type);
    }
    if (category) {
      conditions.push('r.category = ?');
      params.push(category);
    }
    if (startDate) {
      conditions.push('r.date >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('r.date <= ?');
      params.push(endDate);
    }
    if (search) {
      conditions.push('(r.description LIKE ? OR r.category LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Get total count for pagination metadata
    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total FROM financial_records r ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Fetch the actual records, joining with users to get creator's name
    const [records] = await db.query(
      `SELECT 
         r.id, r.amount, r.type, r.category, r.description, r.date,
         r.created_at, r.updated_at,
         u.name AS created_by_name
       FROM financial_records r
       JOIN users u ON r.user_id = u.id
       ${whereClause}
       ORDER BY r.date DESC, r.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          total,
          page:       parseInt(page),
          limit:      parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (err) {
    console.error('getRecords error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch records.' });
  }
};

// ─── GET /api/records/:id ──────────────────────────────────────────────────────
const getRecord = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, u.name AS created_by_name
       FROM financial_records r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = ? AND r.deleted_at IS NULL`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }

    res.json({ success: true, data: { record: rows[0] } });
  } catch (err) {
    console.error('getRecord error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch record.' });
  }
};

// ─── POST /api/records ─────────────────────────────────────────────────────────
// Only admin and analyst can create records (enforced in route middleware)
const createRecord = async (req, res) => {
  try {
    const { amount, type, category, description, date } = req.body;

    const [result] = await db.query(
      `INSERT INTO financial_records (user_id, amount, type, category, description, date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, amount, type, category, description || null, date]
    );

    // Fetch the newly created record to return it
    const [rows] = await db.query(
      'SELECT * FROM financial_records WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Record created successfully.',
      data: { record: rows[0] },
    });
  } catch (err) {
    console.error('createRecord error:', err);
    res.status(500).json({ success: false, message: 'Failed to create record.' });
  }
};

// ─── PUT /api/records/:id ──────────────────────────────────────────────────────
// Only admin can update (enforced in route)
const updateRecord = async (req, res) => {
  try {
    const { amount, type, category, description, date } = req.body;

    // First verify the record exists and isn't deleted
    const [existing] = await db.query(
      'SELECT id FROM financial_records WHERE id = ? AND deleted_at IS NULL',
      [req.params.id]
    );
    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }

    await db.query(
      `UPDATE financial_records
       SET amount = ?, type = ?, category = ?, description = ?, date = ?
       WHERE id = ?`,
      [amount, type, category, description || null, date, req.params.id]
    );

    const [rows] = await db.query(
      'SELECT * FROM financial_records WHERE id = ?',
      [req.params.id]
    );

    res.json({
      success: true,
      message: 'Record updated successfully.',
      data: { record: rows[0] },
    });
  } catch (err) {
    console.error('updateRecord error:', err);
    res.status(500).json({ success: false, message: 'Failed to update record.' });
  }
};

// ─── DELETE /api/records/:id ───────────────────────────────────────────────────
// SOFT DELETE — sets deleted_at timestamp instead of removing the row.
// This preserves audit history and allows recovery.
// Only admin can delete (enforced in route).
const deleteRecord = async (req, res) => {
  try {
    const [existing] = await db.query(
      'SELECT id FROM financial_records WHERE id = ? AND deleted_at IS NULL',
      [req.params.id]
    );
    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }

    // Set deleted_at to now — the record still exists in the DB
    await db.query(
      'UPDATE financial_records SET deleted_at = NOW() WHERE id = ?',
      [req.params.id]
    );

    res.json({
      success: true,
      message: 'Record deleted successfully.',
    });
  } catch (err) {
    console.error('deleteRecord error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete record.' });
  }
};

module.exports = { getRecords, getRecord, createRecord, updateRecord, deleteRecord };
