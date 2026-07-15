const userService = require('../services/userService');
const bcrypt = require('bcryptjs'); // Thêm thư viện mã hóa mật khẩu
const academicService = require('../services/academicService');

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

  // ==========================================
  // 1. TẠO MỚI NGƯỜI DÙNG
  // ==========================================
  // 1. TẠO MỚI NGƯỜI DÙNG
  createUser: async (req, res, next) => {
    try {
      // 🚀 ĐÃ FIX: Lấy ĐẦY ĐỦ các trường như bên Laravel
      const { 
        ho_ten, email, tai_khoan, ma_vai_tro, vai_tro_id, 
        lop_hoc_id, ma_lop, mat_khau, so_dien_thoai, soDienThoai, 
        gioi_tinh, ngay_sinh, ma_sinh_vien, nien_khoa, 
        ma_giang_vien, ma_phong_ban 
      } = req.body;
      
      if (!ho_ten || !mat_khau) return res.status(400).json({ success: false, message: 'Thiếu trường bắt buộc' });
      
      const rawRole = (vai_tro_id !== undefined) ? vai_tro_id : ma_vai_tro;
      const roleValue = Number(rawRole);
      const phone = (so_dien_thoai !== undefined) ? so_dien_thoai : soDienThoai;
      const classId = (lop_hoc_id !== undefined) ? lop_hoc_id : ma_lop;
      
      const hashedPassword = await bcrypt.hash(mat_khau, 12);

      const created = await userService.createUser({ 
        ho_ten, email, tai_khoan, roleValue, lop_hoc_id: classId, 
        mat_khau: hashedPassword, so_dien_thoai: phone,
        gioi_tinh, ngay_sinh, 
        ma_sinh_vien, nien_khoa, // Truyền xuống Service
        ma_giang_vien, ma_phong_ban
      });
      
      res.status(201).json({ success: true, message: 'Tạo người dùng thành công', id: created.id, data: created });
    } catch (err) { next(err); }
  },

  // ==========================================
  // 2. CẬP NHẬT NGƯỜI DÙNG
  // ==========================================
  updateUser: async (req, res, next) => {
    try {
      const { id } = req.params;
      // ĐÃ SỬA: Lấy thêm gioi_tinh và ngay_sinh từ req.body
      const { 
        ho_ten, ma_vai_tro, vai_tro_id, lop_hoc_id, 
        so_dien_thoai, soDienThoai, gioi_tinh, ngay_sinh,
        ma_sinh_vien, nien_khoa
      } = req.body;
      
      const roleValue = (vai_tro_id !== undefined) ? vai_tro_id : ma_vai_tro;
      const phone = (so_dien_thoai !== undefined) ? so_dien_thoai : soDienThoai;

      const affected = await userService.updateUser(id, { 
        ho_ten, 
        roleValue, 
        lop_hoc_id,
        ma_sinh_vien,
        nien_khoa,
        so_dien_thoai: phone,
        gioi_tinh: gioi_tinh, // Gắn vào payload truyền xuống DB
        ngay_sinh: ngay_sinh  // Gắn vào payload truyền xuống DB
      });
      
      if (affected === 0) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại hoặc không có thay đổi' });
      res.json({ success: true, message: 'Cập nhật người dùng thành công' });
    } catch (err) { next(err); }
  },

  createUsersBulk: async (req, res, next) => {
    try {
      const users = req.body;
      if (!Array.isArray(users) || users.length === 0) return res.status(400).json({ success: false, message: 'Yêu cầu phải là mảng người dùng' });
      
      // Mã hóa mật khẩu cho toàn bộ user import
      for (let u of users) {
        if (u.mat_khau) {
          u.mat_khau = await bcrypt.hash(u.mat_khau, 12);
        }
      }

      const created = await userService.createUsersBulk(users);
      res.status(201).json({ success: true, message: 'Import hoàn tất', data: created });
    } catch (err) { next(err); }
  },

 

  resetPassword: async (req, res, next) => {
    try {
      const { id } = req.params;
      let { mat_khau } = req.body;
      
      // Nếu không gửi mật khẩu lên, mặc định sẽ set thành '123'
      if (!mat_khau) mat_khau = '123'; 
      
      // Phải mã hóa (hash) trước khi lưu vào database
      const hashedPassword = await bcrypt.hash(mat_khau, 12);
      
      const affected = await userService.resetPassword(id, hashedPassword);
      if (affected === 0) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
      res.json({ success: true, message: 'Đã reset mật khẩu thành công' });
    } catch (err) { next(err); }
  },

  toggleStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      let { active, trang_thai } = req.body;
      if (active === undefined && trang_thai === undefined) return res.status(400).json({ success: false, message: 'Thiếu active hoặc trang_thai' });
      
      const activeBool = (active !== undefined) ? !!active : (Number(trang_thai) === 1);
      const affected = await userService.toggleStatus(id, activeBool);
      
      if (affected === 0) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
      res.json({ success: true, message: 'Cập nhật trạng thái thành công' });
    } catch (err) { next(err); }
  },

  // --- HÀM MỚI: XÓA NGƯỜI DÙNG ---
  deleteUser: async (req, res, next) => {
    try {
      const { id } = req.params;
      const affected = await userService.deleteUser(id);
      
      if (affected === 0) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
      res.json({ success: true, message: 'Đã xóa tài khoản thành công' });
    } catch (err) { next(err); }
  },
   getStudentDashboard : async (req, res) => {
    try {
        // 🚀 SỬA 1: Lấy đúng tên tham số là userId (khớp với router)
        const userId = req.params.userId;
        
        // 🚀 SỬA 2: Gọi đúng tên userService đã khai báo ở đầu file
        const dashboardData = await userService.getStudentDashboardData(userId);
        
        res.status(200).json({ 
            success: true, 
            data: dashboardData 
        });
    } catch (error) {
        console.error("🔥 ERROR CHI TIẾT:", error); 
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
  },

  getRoles: async (req, res, next) => {
    try {
      const data = await userService.getRoles();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }
};

module.exports = UserController;
