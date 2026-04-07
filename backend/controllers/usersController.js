// controllers/usersController.js
// Admin-only: manage users, change roles, activate/deactivate accounts.

const bcrypt = require('bcryptjs');
const db     = require('../config/db');

// ─── GET /api/users ────────────────────────────────────────────────────────────
const getUsers = async (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 10 } = req.query;

    const conditions = [];
    const params = [];

    if (role)   { conditions.push('role = ?');             params.push(role); }
    if (status) { conditions.push('status = ?');           params.push(status); }
    if (search) {
      conditions.push('(name LIKE ? OR email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total FROM users ${where}`, params
    );
    const total = countRows[0].total;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Never select the password column when listing users
    const [users] = await db.query(
      `SELECT id, name, email, role, status, created_at
       FROM users
       ${where}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page:       parseInt(page),
          limit:      parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (err) {
    console.error('getUsers error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
};

// ─── GET /api/users/:id ────────────────────────────────────────────────────────
const getUser = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, role, status, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, data: { user: rows[0] } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch user.' });
  }
};

// ─── PUT /api/users/:id ────────────────────────────────────────────────────────
// Admin can change name, role, and status. Cannot change email or password here.
const updateUser = async (req, res) => {
  try {
    const { name, role, status } = req.body;
    const userId = parseInt(req.params.id);

    // Prevent admin from deactivating themselves
    if (userId === req.user.id && status === 'inactive') {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account.',
      });
    }

    const [existing] = await db.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Only update fields that were provided
    const updates = [];
    const params  = [];
    if (name   !== undefined) { updates.push('name = ?');   params.push(name); }
    if (role   !== undefined) { updates.push('role = ?');   params.push(role); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }

    if (!updates.length) {
      return res.status(400).json({ success: false, message: 'No fields to update.' });
    }

    params.push(userId);
    await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params
    );

    const [rows] = await db.query(
      'SELECT id, name, email, role, status, created_at FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: 'User updated successfully.',
      data: { user: rows[0] },
    });
  } catch (err) {
    console.error('updateUser error:', err);
    res.status(500).json({ success: false, message: 'Failed to update user.' });
  }
};

// ─── DELETE /api/users/:id ─────────────────────────────────────────────────────
// Hard delete — removes user entirely. (Could be made a soft delete too.)
const deleteUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Prevent self-deletion
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account.',
      });
    }

    const [existing] = await db.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await db.query('DELETE FROM users WHERE id = ?', [userId]);

    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    console.error('deleteUser error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete user.' });
  }
};

module.exports = { getUsers, getUser, updateUser, deleteUser };
