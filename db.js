const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  
  // --- CONNECTION POOL SETTINGS ---
  max: 20,              // Max 20 connections in the pool (adjust based on your RAM)
  idleTimeoutMillis: 10000, // Close idle clients after 10 seconds of inactivity
  connectionTimeoutMillis: 2000, // Return an error if a connection takes > 2 seconds
  maxUses: 7500,        // Recycle connections after 7500 uses to prevent memory leaks
});

// Simple test to verify connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error("❌ Database connection error:", err.stack);
  } else {
    console.log('✅ Connected to SMPS database at:', res.rows[0].now);
  }
});

// Helper for debugging: Monitor the number of active/idle clients
// You can remove this in production
setInterval(() => {
  // console.log(`Pool Stats: Total: ${pool.totalCount} | Idle: ${pool.idleCount} | Waiting: ${pool.waitingCount}`);
}, 5000);

module.exports = pool;