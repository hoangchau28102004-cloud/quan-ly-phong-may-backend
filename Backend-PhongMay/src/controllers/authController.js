const authService = require('../services/authService');
const db = require('../config/db');
const bcrypt = require('bcrypt');

const login = async (req, res, next) => {
  try {
    const { email, mat_khau } = req.body;
    if (!email || !mat_khau) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu' });
    }

    const result = await authService.login(email, mat_khau);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(401).json(result);
    }
  } catch (error) {
    next(error); 
  }
};

const getProfile = async (req, res, next) => {
  try {
    const conn = db.promise();
    const [rows] = await conn.query(
      'SELECT ho_ten, email, so_dien_thoai, gioi_tinh, ngay_sinh FROM nguoi_dung WHERE id = ?', 
      [req.params.id]
    );
    if (rows.length > 0) {
      res.json({ success: true, data: rows[0] });
    } else {
      res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { ho_ten, so_dien_thoai, gioi_tinh, ngay_sinh } = req.body;
    
    const conn = db.promise();
    const sql = 'UPDATE nguoi_dung SET ho_ten = ?, so_dien_thoai = ?, gioi_tinh = ?, ngay_sinh = ?, updated_at = NOW() WHERE id = ?';
    const [result] = await conn.query(sql, [ho_ten, so_dien_thoai, gioi_tinh, ngay_sinh, id]);

    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Cập nhật thông tin thành công!' });
    } else {
      res.status(404).json({ success: false, message: 'Người dùng không tồn tại!' });
    }
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { mat_khau_cu, mat_khau_moi } = req.body;
    const conn = db.promise();

    // 1. Lấy user từ CSDL
    const [users] = await conn.query('SELECT mat_khau FROM nguoi_dung WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Tài khoản không tồn tại' });
    }

    const matKhauDB = users[0].mat_khau;
    let isMatch = false;

    // 2. SO SÁNH THÔNG MINH (Hỗ trợ cả nick cũ chưa mã hóa và nick mới đã mã hóa)
    if (matKhauDB.startsWith('$2b$') || matKhauDB.startsWith('$2a$')) {
      // Nếu mật khẩu trong DB bắt đầu bằng $2b$ -> Nó đã được mã hóa bằng bcrypt
      isMatch = await bcrypt.compare(mat_khau_cu, matKhauDB);
    } else {
      // Nếu không, so sánh dạng chữ thường (Dành cho các tài khoản test cũ)
      isMatch = (mat_khau_cu === matKhauDB);
    }

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mật khẩu cũ không chính xác!' });
    }

    // 3. MÃ HÓA MẬT KHẨU MỚI TRƯỚC KHI LƯU
    const salt = await bcrypt.genSalt(10); // Tạo chuỗi bảo vệ ngẫu nhiên
    const hashedNewPassword = await bcrypt.hash(mat_khau_moi, salt); // Băm mật khẩu

    // 4. Lưu mật khẩu đã mã hóa vào DB
    await conn.query('UPDATE nguoi_dung SET mat_khau = ?, updated_at = NOW() WHERE id = ?', [hashedNewPassword, id]);
    
    res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
  } catch (error) {
    console.log("Lỗi Change Password:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { login, getProfile, updateProfile, changePassword };