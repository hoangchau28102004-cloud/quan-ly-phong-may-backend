require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

(async () => {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'pmcnttckc';

  try {
    const connection = await mysql.createConnection({ host, port, user, password, multipleStatements: true });
    console.log(`Connected to MySQL server ${host}:${port}.`);

    const sqlPath = path.join(__dirname, '..', 'SQL_DATN.txt');
    let sqlContent = '';
    if (fs.existsSync(sqlPath)) {
      sqlContent = fs.readFileSync(sqlPath, 'utf8');
      // make CREATE TABLE idempotent
      sqlContent = sqlContent.replace(/CREATE TABLE\s+/gi, 'CREATE TABLE IF NOT EXISTS ');
    } else {
      console.warn('SQL_DATN.txt not found, skipping DDL creation.');
    }

    const seedSql = `
      CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
      USE ${dbName};
      ${sqlContent}

      INSERT IGNORE INTO vai_tro (ten_vai_tro) VALUES ('ADMIN'), ('GIANG_VIEN'), ('SINH_VIEN');
      INSERT IGNORE INTO lop_hoc (ma_lop) VALUES ('CNTT-01');
      INSERT IGNORE INTO mon_hoc (ten_mon) VALUES ('Lập trình căn bản'), ('Cấu trúc dữ liệu');
      INSERT IGNORE INTO ca_hoc (gio_bat_dau, gio_ket_thuc) VALUES ('07:00:00', '09:30:00'), ('10:00:00', '12:30:00');
      INSERT IGNORE INTO phong_may (ten_phong) VALUES ('P101'), ('P102');
      INSERT IGNORE INTO cau_hinh (cpu, ram, o_cung, gpu) VALUES ('Intel i5', '8GB', '256GB SSD', 'IGP');

      INSERT IGNORE INTO nguoi_dung (tai_khoan, mat_khau, ho_ten, email, vai_tro_id, lop_hoc_id) VALUES
        ('admin','admin','Admin Quản trị','admin@example.com',1,NULL),
        ('gv1','gv1','Giảng Viên 1','gv1@example.com',2,NULL),
        ('sv1','sv1','Sinh Viên 1','sv1@example.com',3,1);

      INSERT IGNORE INTO may_tinh (ma_may, ma_qr, ip_may, he_dieu_hanh, trang_thai, phong_may_id, cau_hinh_id) VALUES
        ('PC-01','QR-PC-01','192.168.0.101','Windows 10','TOT',1,1),
        ('PC-02','QR-PC-02','192.168.0.102','Windows 10','TOT',1,1);
    `;

    console.log('Running seed SQL (this may take a few seconds)...');
    await connection.query(seedSql);
    console.log('Seeding complete.');
    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err.message || err);
    process.exit(1);
  }
})();
