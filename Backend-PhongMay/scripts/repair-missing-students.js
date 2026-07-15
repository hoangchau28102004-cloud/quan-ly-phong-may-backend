require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    await connection.beginTransaction();
    const [result] = await connection.query(`
      INSERT INTO sinh_vien
        (ma_nguoi_dung, ma_sinh_vien, ma_lop, nien_khoa, created_at, updated_at)
      SELECT nd.id, UPPER(SUBSTRING_INDEX(nd.email, '@', 1)), NULL,
             '2023-2026', NOW(), NOW()
      FROM nguoi_dung nd
      LEFT JOIN sinh_vien sv ON sv.ma_nguoi_dung = nd.id
      WHERE nd.ma_vai_tro = 2 AND sv.id IS NULL
    `);
    await connection.commit();
    console.log(`Da bo sung ${result.affectedRows} sinh vien bi thieu.`);
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) await connection.end();
  }
})().catch(error => {
  console.error(error.message);
  process.exit(1);
});
