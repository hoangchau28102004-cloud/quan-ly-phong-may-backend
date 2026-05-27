require('dotenv').config();
const mysql = require('mysql2');

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'pmcnttckc';

// Sử dụng connection pool để tối ưu hiệu năng và tự động tái sử dụng kết nối
const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  
  // === 2 DÒNG QUAN TRỌNG THÊM VÀO ĐỂ CHỐNG SẬP KẾT NỐI ===
  enableKeepAlive: true,        // Bật tính năng giữ kết nối luôn sống
  keepAliveInitialDelay: 10000  // Cứ sau 10 giây tự động gửi tín hiệu ping ngầm lên Clever Cloud
});

// Kiểm tra nhanh kết nối khi khởi động server
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Lỗi kết nối CSDL:', err.message || err);
    return;
  }
  console.log(`Đã kết nối thành công tới MySQL ${DB_HOST}:${DB_PORT}/${DB_NAME} dưới quyền ${DB_USER}`);
  if (connection) connection.release();
});

// Theo dõi luồng tạo kết nối mới và bắt lỗi cục bộ để tránh sập hệ thống
pool.on('connection', (connection) => {
  console.log('MySQL pool đã tạo kết nối vật lý mới, threadId =', connection.threadId);
  
  // Bắt lỗi trực tiếp trên kết nối vật lý này nếu bị mất mạng đột ngột giữa chừng
  connection.on('error', (err) => {
    console.error('Lỗi kết nối MySQL (threadId = ' + connection.threadId + '):', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.log('-> Kết nối bị mất từ phía Cloud, Pool sẽ tự động khởi tạo kết nối mới ở request tiếp theo.');
    }
  });
});

// Đóng kết nối an toàn khi tắt server (Graceful shutdown)
process.on('SIGINT', () => {
  pool.end(() => {
    console.log('MySQL pool đã đóng kết nối an toàn.');
    process.exit(0);
  });
});

module.exports = pool;