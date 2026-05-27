const authService = require('../services/authService');

const login = async (req, res, next) => {
  try {
    const { tai_khoan, mat_khau } = req.body;
    if (!tai_khoan || !mat_khau) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tài khoản và mật khẩu' });
    }

    const result = await authService.login(tai_khoan, mat_khau);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(401).json(result);
    }
  } catch (error) {
    next(error); // Đẩy lỗi về cho app.js xử lý
  }
};

module.exports = { login };