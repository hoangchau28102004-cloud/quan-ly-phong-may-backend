const db = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); 

const login = async (taiKhoan, matKhau) => {
  try {
    const conn = db.promise();

    const [colsRows] = await conn.query('SHOW COLUMNS FROM nguoi_dung');
    const cols = colsRows.map(c => c.Field);

    const emailCol = cols.includes('email') ? 'email' : (cols.includes('tai_khoan') ? 'tai_khoan' : 'email');
    const roleCol = cols.includes('ma_vai_tro') ? 'ma_vai_tro' : (cols.includes('vai_tro_id') ? 'vai_tro_id' : null);

    let sql;
    if (roleCol) {
      sql = `SELECT nd.*, vt.ten_vai_tro FROM nguoi_dung nd LEFT JOIN vai_tro vt ON nd.${roleCol} = vt.id WHERE nd.${emailCol} = ?`;
    } else {
      sql = `SELECT nd.* FROM nguoi_dung nd WHERE nd.${emailCol} = ?`;
    }

    const [results] = await conn.query(sql, [taiKhoan]);
    
    if (results.length > 0) {
      const user = results[0];

      // 1. Kiểm tra trạng thái khóa
      if (user.trang_thai === 0) {
        return { success: false, message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên.' };
      }

      // 2. Kiểm tra mật khẩu (hỗ trợ cả hash bcrypt và text trơn)
      let isMatch = false;
      const dbPassword = user.mat_khau || '';

      if (dbPassword.startsWith('$2a$') || dbPassword.startsWith('$2b$') || dbPassword.startsWith('$2y$')) {
        isMatch = await bcrypt.compare(matKhau, dbPassword);
      } else {
        isMatch = (matKhau === dbPassword);
      }
      
      if (!isMatch) {
        return { success: false, message: 'Sai tài khoản hoặc mật khẩu' };
      }

      const JWT_SECRET = process.env.JWT_SECRET || 'secret';
      const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

      // =================================================================
      // 3. MAPPING LẠI ID ĐỂ FIX LỖI FLUTTER (KHÚC NÀY LÀ QUAN TRỌNG NHẤT)
      // =================================================================
      let roleName = (user.ten_vai_tro || 'student').toLowerCase();
      let mappedRoleId = user.ma_vai_tro || user.vai_tro_id;
      
      // Dịch ID mới của Laravel Web về ID cũ của Flutter
      if (roleName === 'admin') {
          mappedRoleId = 1;
      } else if (roleName === 'student') {
          mappedRoleId = 2;
      } else if (roleName === 'teacher') {
          mappedRoleId = 3;
      }

      const payload = {
        id: user.id,
        email: user.email || user.tai_khoan || null,
        ho_ten: user.ho_ten || null,
        ma_vai_tro: mappedRoleId, // <- Đã faked ID chuẩn gửi cho Flutter
        role: roleName
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      return {
        success: true,
        message: 'Đăng nhập thành công',
        token,
        data: payload,
        role: roleName
      };
    }

    return { success: false, message: 'Sai tài khoản hoặc mật khẩu' };
  } catch (err) {
    throw err;
  }
};

module.exports = { login };