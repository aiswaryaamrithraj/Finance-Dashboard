// routes/users.js
const express = require('express');
const { getUsers, getUser, updateUser, deleteUser } = require('../controllers/usersController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateUserUpdate } = require('../middleware/validate');

const router = express.Router();

// All user management routes require authentication AND admin role
router.use(authenticate, authorize('admin'));

router.get('/',     getUsers);
router.get('/:id',  getUser);
router.put('/:id',  validateUserUpdate, updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
