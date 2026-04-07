// config/setupDatabase.js
// Run this ONCE with: node config/setupDatabase.js
// It creates all tables and inserts sample data.

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setupDatabase() {
  // Connect WITHOUT specifying a database first, so we can CREATE it
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  console.log('🔧 Setting up database...');

  // ─── Create Database ──────────────────────────────────────────────
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`
  );
  await connection.query(`USE ${process.env.DB_NAME}`);
  console.log(`✅ Database "${process.env.DB_NAME}" ready`);

  // ─── Users Table ──────────────────────────────────────────────────
  // Stores all users. Role determines what they can do.
  // 'status' allows soft-disabling users without deleting them.
  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      name        VARCHAR(100) NOT NULL,
      email       VARCHAR(150) NOT NULL UNIQUE,
      password    VARCHAR(255) NOT NULL,
      role        ENUM('admin', 'analyst', 'viewer') NOT NULL DEFAULT 'viewer',
      status      ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Table: users');

  // ─── Financial Records Table ──────────────────────────────────────
  // Core data. Every financial entry goes here.
  // 'deleted_at' enables soft delete (record stays in DB but is hidden).
  await connection.query(`
    CREATE TABLE IF NOT EXISTS financial_records (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      user_id      INT NOT NULL,
      amount       DECIMAL(15, 2) NOT NULL,
      type         ENUM('income', 'expense') NOT NULL,
      category     VARCHAR(100) NOT NULL,
      description  TEXT,
      date         DATE NOT NULL,
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at   TIMESTAMP NULL DEFAULT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_type     (type),
      INDEX idx_category (category),
      INDEX idx_date     (date),
      INDEX idx_deleted  (deleted_at)
    )
  `);
  console.log('✅ Table: financial_records');

  // ─── Seed Users ───────────────────────────────────────────────────
  // bcrypt hashes passwords. The "12" is the "salt rounds" -
  // higher = more secure but slower. 12 is a good balance.
  const passwordHash = await bcrypt.hash('password123', 12);

  const users = [
    ['Alice Admin',   'admin@finance.com',   passwordHash, 'admin'],
    ['Bob Analyst',   'analyst@finance.com', passwordHash, 'analyst'],
    ['Carol Viewer',  'viewer@finance.com',  passwordHash, 'viewer'],
  ];

  for (const [name, email, password, role] of users) {
    // INSERT IGNORE skips if the email already exists (safe to re-run)
    await connection.query(
      `INSERT IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
      [name, email, password, role]
    );
  }
  console.log('✅ Seeded: 3 users (admin, analyst, viewer) — password: password123');

  // ─── Seed Financial Records ───────────────────────────────────────
  const [adminRows] = await connection.query(
    `SELECT id FROM users WHERE email = 'admin@finance.com'`
  );
  const adminId = adminRows[0].id;

  const records = [
    // [user_id, amount, type, category, description, date]
    [adminId, 85000.00,  'income',  'Salary',        'Monthly salary - Q1',          '2025-01-05'],
    [adminId, 12000.00,  'income',  'Freelance',     'Web design project',           '2025-01-15'],
    [adminId, 2500.00,   'expense', 'Rent',          'Office rent January',          '2025-01-01'],
    [adminId, 450.00,    'expense', 'Utilities',     'Electricity & internet',       '2025-01-10'],
    [adminId, 3200.00,   'expense', 'Marketing',     'Google Ads campaign',          '2025-01-20'],
    [adminId, 90000.00,  'income',  'Salary',        'Monthly salary - Q1',          '2025-02-05'],
    [adminId, 8500.00,   'income',  'Consulting',    'Strategy consultation',        '2025-02-18'],
    [adminId, 2500.00,   'expense', 'Rent',          'Office rent February',         '2025-02-01'],
    [adminId, 1200.00,   'expense', 'Software',      'Annual SaaS subscriptions',    '2025-02-14'],
    [adminId, 5000.00,   'expense', 'Equipment',     'New laptop purchase',          '2025-02-25'],
    [adminId, 90000.00,  'income',  'Salary',        'Monthly salary - Q1',          '2025-03-05'],
    [adminId, 15000.00,  'income',  'Sales',         'Product license sales',        '2025-03-10'],
    [adminId, 2500.00,   'expense', 'Rent',          'Office rent March',            '2025-03-01'],
    [adminId, 800.00,    'expense', 'Travel',        'Client meeting travel',        '2025-03-15'],
    [adminId, 2200.00,   'expense', 'Marketing',     'Social media ads',             '2025-03-22'],
    [adminId, 95000.00,  'income',  'Salary',        'Monthly salary - Q2',          '2025-04-05'],
    [adminId, 6000.00,   'income',  'Freelance',     'Logo design project',          '2025-04-12'],
    [adminId, 2500.00,   'expense', 'Rent',          'Office rent April',            '2025-04-01'],
    [adminId, 3500.00,   'expense', 'Salaries',      'Contractor payment',           '2025-04-30'],
    [adminId, 500.00,    'expense', 'Utilities',     'Water & electricity',          '2025-04-15'],
    [adminId, 95000.00,  'income',  'Salary',        'Monthly salary - Q2',          '2025-05-05'],
    [adminId, 22000.00,  'income',  'Sales',         'Enterprise deal closed',       '2025-05-20'],
    [adminId, 2500.00,   'expense', 'Rent',          'Office rent May',              '2025-05-01'],
    [adminId, 4000.00,   'expense', 'Marketing',     'Conference sponsorship',       '2025-05-10'],
    [adminId, 750.00,    'expense', 'Software',      'Cloud services upgrade',       '2025-05-25'],
    [adminId, 95000.00,  'income',  'Salary',        'Monthly salary - Q2',          '2025-06-05'],
    [adminId, 11000.00,  'income',  'Consulting',    'Q2 strategy session',          '2025-06-18'],
    [adminId, 2500.00,   'expense', 'Rent',          'Office rent June',             '2025-06-01'],
    [adminId, 600.00,    'expense', 'Utilities',     'Summer electricity bill',      '2025-06-20'],
    [adminId, 900.00,    'expense', 'Travel',        'Trade show attendance',        '2025-06-28'],
  ];

  for (const record of records) {
    await connection.query(
      `INSERT IGNORE INTO financial_records (user_id, amount, type, category, description, date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      record
    );
  }
  console.log('✅ Seeded: 30 financial records across 6 months');

  await connection.end();
  console.log('\n🎉 Database setup complete! You can now start the server.');
  console.log('   Run: npm run dev\n');
}

setupDatabase().catch((err) => {
  console.error('❌ Setup failed:', err.message);
  process.exit(1);
});
