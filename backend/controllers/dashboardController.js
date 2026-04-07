// controllers/dashboardController.js
// Provides all the aggregated/summary data for the dashboard.
// This is where complex SQL queries live to power analytics.

const db = require('../config/db');

// ─── GET /api/dashboard/summary ────────────────────────────────────────────────
// Returns top-level KPIs: total income, total expenses, net balance, record count
const getSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = 'WHERE deleted_at IS NULL';
    const params = [];

    if (startDate) { dateFilter += ' AND date >= ?'; params.push(startDate); }
    if (endDate)   { dateFilter += ' AND date <= ?'; params.push(endDate); }

    // SUM with CASE WHEN lets us get both totals in a single DB query
    // instead of making two separate queries — more efficient!
    const [rows] = await db.query(
      `SELECT
         SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) AS totalIncome,
         SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS totalExpenses,
         COUNT(*) AS totalRecords
       FROM financial_records
       ${dateFilter}`,
      params
    );

    const { totalIncome, totalExpenses, totalRecords } = rows[0];
    const netBalance = (parseFloat(totalIncome) || 0) - (parseFloat(totalExpenses) || 0);

    res.json({
      success: true,
      data: {
        totalIncome:   parseFloat(totalIncome)   || 0,
        totalExpenses: parseFloat(totalExpenses) || 0,
        netBalance,
        totalRecords,
      },
    });
  } catch (err) {
    console.error('getSummary error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch summary.' });
  }
};

// ─── GET /api/dashboard/category-totals ────────────────────────────────────────
// Returns spending/income broken down by category
const getCategoryTotals = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;

    const conditions = ['deleted_at IS NULL'];
    const params = [];

    if (type)      { conditions.push('type = ?');      params.push(type); }
    if (startDate) { conditions.push('date >= ?');     params.push(startDate); }
    if (endDate)   { conditions.push('date <= ?');     params.push(endDate); }

    const [rows] = await db.query(
      `SELECT
         category,
         type,
         SUM(amount) AS total,
         COUNT(*)    AS count
       FROM financial_records
       WHERE ${conditions.join(' AND ')}
       GROUP BY category, type
       ORDER BY total DESC`,
      params
    );

    res.json({ success: true, data: { categories: rows } });
  } catch (err) {
    console.error('getCategoryTotals error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch category totals.' });
  }
};

// ─── GET /api/dashboard/monthly-trends ─────────────────────────────────────────
// Returns income vs expenses per month — great for line/bar charts
const getMonthlyTrends = async (req, res) => {
  try {
    const { year } = req.query;
    const params = [];
    let yearFilter = '';

    if (year) {
      yearFilter = 'AND YEAR(date) = ?';
      params.push(parseInt(year));
    }

    // DATE_FORMAT groups by "2025-01", "2025-02", etc.
    const [rows] = await db.query(
      `SELECT
         DATE_FORMAT(date, '%Y-%m') AS month,
         SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) AS income,
         SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expenses,
         COUNT(*) AS transactionCount
       FROM financial_records
       WHERE deleted_at IS NULL ${yearFilter}
       GROUP BY DATE_FORMAT(date, '%Y-%m')
       ORDER BY month ASC`,
      params
    );

    res.json({ success: true, data: { trends: rows } });
  } catch (err) {
    console.error('getMonthlyTrends error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch monthly trends.' });
  }
};

// ─── GET /api/dashboard/recent-activity ────────────────────────────────────────
// Returns the 10 most recent transactions for the activity feed
const getRecentActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const [rows] = await db.query(
      `SELECT
         r.id, r.amount, r.type, r.category, r.description, r.date,
         u.name AS created_by_name
       FROM financial_records r
       JOIN users u ON r.user_id = u.id
       WHERE r.deleted_at IS NULL
       ORDER BY r.created_at DESC
       LIMIT ?`,
      [limit]
    );

    res.json({ success: true, data: { activities: rows } });
  } catch (err) {
    console.error('getRecentActivity error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch recent activity.' });
  }
};

module.exports = { getSummary, getCategoryTotals, getMonthlyTrends, getRecentActivity };
