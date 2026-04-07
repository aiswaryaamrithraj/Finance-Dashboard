// config/db.js
// This file creates and exports the MySQL connection pool.
// A "pool" means multiple connections are kept ready, which is faster
// than creating a new connection for every database request.

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,   // Wait if all connections are busy
  connectionLimit: 10,         // Max 10 connections at once
  queueLimit: 0,               // Unlimited queue
  timezone: '+00:00',          // Store all dates in UTC
});

// Test the connection when the app starts
pool.getConnection()
  .then((conn) => {
    console.log('✅ MySQL connected successfully');
    conn.release(); // Always release the connection back to the pool
  })
  .catch((err) => {
    console.error('❌ MySQL connection failed:', err.message);
    process.exit(1); // Stop the server if DB can't connect
  });

module.exports = pool;
