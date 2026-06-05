const db = require('../config/db');
const jwt = require('jsonwebtoken');

// Robust login: detect column names in `nguoi_dung` and build SQL accordingly
const login = async (taiKhoan, matKhau) => {
  try {
    const conn = db.promise();

    const [colsRows] = await conn.query('SHOW COLUMNS FROM nguoi_dung');
    const cols = colsRows.map(c => c.Field);

    const emailCol = cols.includes('email') ? 'email' : (cols.includes('tai_khoan') ? 'tai_khoan' : 'email');
    const roleCol = cols.includes('ma_vai_tro') ? 'ma_vai_tro' : (cols.includes('vai_tro_id') ? 'vai_tro_id' : null);

    let sql;
    if (roleCol) {
      sql = `SELECT nd.*, vt.ten_vai_tro FROM nguoi_dung nd LEFT JOIN vai_tro vt ON nd.${roleCol} = vt.id WHERE nd.${emailCol} = ? AND nd.mat_khau = ?`;
    } else {
      sql = `SELECT nd.* FROM nguoi_dung nd WHERE nd.${emailCol} = ? AND nd.mat_khau = ?`;
    }

    const [results] = await conn.query(sql, [taiKhoan, matKhau]);
    if (results.length > 0) {
      const user = results[0];
      const JWT_SECRET = process.env.JWT_SECRET || 'secret';
      const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

      const payload = {
        id: user.id,
        email: user.email || user.tai_khoan || null,
        ho_ten: user.ho_ten || null,
        ma_vai_tro: user.ma_vai_tro || user.vai_tro_id || null,
        role: user.ten_vai_tro || null
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      return {
        success: true,
        message: 'Đăng nhập thành công',
        token,
        data: payload,
        role: (user.ten_vai_tro || 'student').toLowerCase()
      };
    }

    return { success: false, message: 'Sai tài khoản hoặc mật khẩu' };
  } catch (err) {
    throw err;
  }
};

module.exports = { login };