const db = require('../config/db');
const jwt = require('jsonwebtoken');

const login = (taiKhoan, matKhau) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT nd.*, vt.ten_vai_tro FROM nguoi_dung nd LEFT JOIN vai_tro vt ON nd.vai_tro_id = vt.id WHERE nd.tai_khoan = ? AND nd.mat_khau = ?`;
    
    db.query(sql, [taiKhoan, matKhau], (err, results) => {
      if (err) return reject(err);

      if (results.length > 0) {
        const user = results[0];
        const JWT_SECRET = process.env.JWT_SECRET || 'secret';
        const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

        const payload = {
          id: user.id,
          tai_khoan: user.tai_khoan,
          ho_ten: user.ho_ten,
          vai_tro_id: user.vai_tro_id,
          role: user.ten_vai_tro || null,
          lop_hoc_id: user.lop_hoc_id
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        resolve({
          success: true,
          message: 'Đăng nhập thành công',
          token,
          data: payload,
          role: user.ten_vai_tro ? user.ten_vai_tro.toLowerCase() : 'student'
        });
      } else {
        resolve({ success: false, message: 'Sai tài khoản hoặc mật khẩu' });
      }
    });
  });
};

module.exports = { login };