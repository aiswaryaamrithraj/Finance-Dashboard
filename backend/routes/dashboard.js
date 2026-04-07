// routes/dashboard.js
const express = require('express');
const {
  getSummary, getCategoryTotals, getMonthlyTrends, getRecentActivity,
} = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All dashboard routes require authentication
// Viewers, analysts, and admins can all read dashboard data
router.use(authenticate);

router.get('/summary',         getSummary);
router.get('/category-totals', getCategoryTotals);
router.get('/monthly-trends',  getMonthlyTrends);
router.get('/recent-activity', getRecentActivity);

module.exports = router;
