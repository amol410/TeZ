const mysql = require('mysql2/promise');
require('dotenv').config();

let paymentPool;

try {
  const url = new URL(process.env.PAYMENT_DATABASE_URL);
  paymentPool = mysql.createPool({
    host: url.hostname === 'localhost' ? '127.0.0.1' : url.hostname,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    port: parseInt(url.port) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
  });
  console.log('Payment MySQL pool created successfully');
} catch (e) {
  console.error('Failed to create Payment MySQL pool:', e.message);
}

module.exports = paymentPool;
