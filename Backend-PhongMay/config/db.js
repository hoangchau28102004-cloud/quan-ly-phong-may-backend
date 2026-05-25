require('dotenv').config();
const mysql = require('mysql2');
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'pmcnttckc';

// Use a connection pool to avoid PROTOCOL_CONNECTION_LOST and allow automatic
// reuse of connections. The exported `db` supports both callback-style
// `db.query(sql, params, cb)` and promise-style `db.promise().query(...);`.
const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Quick sanity check to ensure we can acquire a connection on startup.
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Lỗi kết nối CSDL:', err.message || err);
    return;
  }
  console.log(`Đã kết nối thành công tới MySQL ${DB_HOST}:${DB_PORT}/${DB_NAME} as ${DB_USER}`);
  if (connection) connection.release();
});

// Log when pool creates new physical connections and attach an error handler
// to each connection so errors don't bubble as unhandled exceptions.
pool.on('connection', (connection) => {
  console.log('MySQL pool created new connection, threadId=', connection.threadId);
  connection.on('error', (err) => {
    console.error('MySQL connection error (threadId=' + connection.threadId + '):', err);
  });
});

// Graceful shutdown: close pool on process exit.
process.on('SIGINT', () => {
  pool.end(() => {
    console.log('MySQL pool closed.');
    process.exit(0);
  });
});

module.exports = pool;