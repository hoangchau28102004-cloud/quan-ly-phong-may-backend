require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

(async () => {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'qlpm'; // Đổi tên DB khớp với của bạn

  try {
    const connection = await mysql.createConnection({ host, port, user, password, multipleStatements: true });
    console.log(`Connected to MySQL server ${host}:${port}.`);

    const sqlPath = path.join(__dirname, '..', 'SQL_DATN.txt');
    let sqlContent = '';
    if (fs.existsSync(sqlPath)) {
      sqlContent = fs.readFileSync(sqlPath, 'utf8');
      // Thêm IF NOT EXISTS để không bị lỗi nếu bảng đã tồn tại
      sqlContent = sqlContent.replace(/CREATE TABLE\s+/gi, 'CREATE TABLE IF NOT EXISTS ');
    } else {
      console.warn('SQL_DATN.txt not found, skipping DDL creation.');
    }

    const seedSql = `
      CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
      USE ${dbName};
      ${sqlContent}

      -- Chèn dữ liệu cơ bản (Dùng INSERT IGNORE để tránh lỗi trùng)
      INSERT IGNORE INTO vai_tro (id, ten_vai_tro, mo_ta) VALUES 
      (1, 'admin', 'Quản trị viên'), 
      (2, 'student', 'Sinh viên'), 
      (3, 'teacher', 'Giảng viên');

      -- Tạo phòng mẫu (bao gồm Kho)
      INSERT IGNORE INTO phong_may (ma_phong, ten_phong, vi_tri, suc_chua, trang_thai) VALUES 
      ('KHO01', 'Kho Thiết Bị', 'Tầng Trệt', 100, 'active'),
      ('PM01', 'Phòng Máy 1', 'Tầng 1', 40, 'active');

      -- Tạo tài khoản Admin mặc định (mật khẩu đã hash sẵn)
      -- Lưu ý: mật khẩu '$2y$12$lnXGf3FDGb0pL0RyI5CaHO9043nimUd839GlCFeK5BfOFJ0wlOquW' là 'admin'
      INSERT IGNORE INTO nguoi_dung (id, ma_vai_tro, ho_ten, email, mat_khau, so_dien_thoai) VALUES
      (1, 1, 'Admin Hệ Thống', 'admin@itlab.test', '$2y$12$lnXGf3FDGb0pL0RyI5CaHO9043nimUd839GlCFeK5BfOFJ0wlOquW', '0900000001');
    `;

    console.log('Running seed SQL...');
    await connection.query(seedSql);
    console.log('Seeding complete.');
    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err.message || err);
    process.exit(1);
  }
})();