const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  
 
  max: 20,            
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 2000, 
  maxUses: 7500,       
});


pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error("❌ Database connection error:", err.stack);
  } else {
    console.log('✅ Connected to SMPS database at:', res.rows[0].now);
  }
});


setInterval(() => {
  
}, 5000);

module.exports = pool;
