const userService = require('../services/userService');

const UserController = {
  listUsers: async (req, res, next) => {
    try {
      const { orderBy, descending, page, limit, filter } = req.query;
      const opts = {
        orderBy,
        descending: descending === 'true' || descending === '1',
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        filter
      };

      const data = await userService.getUsers(opts);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  createUser: async (req, res, next) => {
    try {
      const { ho_ten, email, tai_khoan, ma_vai_tro, vai_tro_id, lop_hoc_id, mat_khau } = req.body;
      if (!ho_ten || !mat_khau) return res.status(400).json({ success: false, message: 'Thiếu trường bắt buộc' });
      const roleValue = (vai_tro_id !== undefined) ? vai_tro_id : ma_vai_tro;
      const created = await userService.createUser({ ho_ten, email, tai_khoan, roleValue, lop_hoc_id, mat_khau });
      // Return id and created resource to frontend
      res.status(201).json({ success: true, message: 'Tạo người dùng thành công', id: created.id, data: created });
    } catch (err) { next(err); }
  },

  createUsersBulk: async (req, res, next) => {
    try {
      const users = req.body;
      if (!Array.isArray(users) || users.length === 0) return res.status(400).json({ success: false, message: 'Yêu cầu phải là mảng người dùng' });
      const created = await userService.createUsersBulk(users);
      res.status(201).json({ success: true, message: 'Import hoàn tất', data: created });
    } catch (err) { next(err); }
  },

  updateUser: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { ho_ten, email, tai_khoan, ma_vai_tro, vai_tro_id, lop_hoc_id } = req.body;
      const roleValue = (vai_tro_id !== undefined) ? vai_tro_id : ma_vai_tro;
      const affected = await userService.updateUser(id, { ho_ten, email, tai_khoan, roleValue, lop_hoc_id });
      if (affected === 0) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại hoặc không có thay đổi' });
      res.json({ success: true, message: 'Cập nhật người dùng thành công' });
    } catch (err) { next(err); }
  },

  resetPassword: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { mat_khau } = req.body;
      if (!mat_khau) return res.status(400).json({ success: false, message: 'Thiếu mat_khau' });
      const affected = await userService.resetPassword(id, mat_khau);
      if (affected === 0) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
      res.json({ success: true, message: 'Đã reset mật khẩu' });
    } catch (err) { next(err); }
  },

  toggleStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      // Accept either `{ active: true }` or `{ trang_thai: 1/0 }`
      let { active, trang_thai } = req.body;
      if (active === undefined && trang_thai === undefined) return res.status(400).json({ success: false, message: 'Thiếu active hoặc trang_thai' });
      const activeBool = (active !== undefined) ? !!active : (Number(trang_thai) === 1);
      const affected = await userService.toggleStatus(id, activeBool);
      if (affected === 0) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
      res.json({ success: true, message: 'Cập nhật trạng thái thành công' });
    } catch (err) { next(err); }
  },

  getRoles: async (req, res, next) => {
    try {
      const data = await userService.getRoles();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }
};

module.exports = UserController;
