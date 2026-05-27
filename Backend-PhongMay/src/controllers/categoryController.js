const categoryService = require('../services/categoryService');

const CategoryController = {
  // --- LỚP HỌC ---
  getLopHoc: async (req, res, next) => {
    try {
      const data = await categoryService.getLopHoc();
      res.json({ success: true, data });
    } catch (error) { next(error); }
  },
  addLopHoc: async (req, res, next) => {
    try {
      const { ma_lop } = req.body;
      const id = await categoryService.addLopHoc(ma_lop);
      res.json({ success: true, message: 'Thêm lớp thành công', id });
    } catch (error) { next(error); }
  },
  updateLopHoc: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { ma_lop } = req.body;
      const affectedRows = await categoryService.updateLopHoc(id, ma_lop);
      if (affectedRows === 0) return res.status(404).json({ success: false, message: 'Lớp không tồn tại' });
      res.json({ success: true, message: 'Cập nhật lớp thành công' });
    } catch (error) { next(error); }
  },
  deleteLopHoc: async (req, res, next) => {
    try {
      const { id } = req.params;
      const affectedRows = await categoryService.deleteLopHoc(id);
      if (affectedRows === 0) return res.status(404).json({ success: false, message: 'Lớp không tồn tại' });
      res.json({ success: true, message: 'Xóa lớp thành công' });
    } catch (error) { next(error); }
  },

  // --- THIẾT BỊ ---
  getThietBi: async (req, res, next) => {
    try {
      const data = await categoryService.getThietBi();
      res.json({ success: true, data });
    } catch (error) { next(error); }
  },
  addThietBi: async (req, res, next) => {
    try {
      const { ten_tb, so_luong_tong } = req.body;
      const id = await categoryService.addThietBi(ten_tb, so_luong_tong);
      res.json({ success: true, message: 'Thêm thiết bị thành công', id });
    } catch (error) { next(error); }
  },

  // --- MÔN HỌC & CA HỌC ---
  getMonHoc: async (req, res, next) => {
    try {
      const data = await categoryService.getMonHoc();
      res.json({ success: true, data });
    } catch (error) { next(error); }
  },
  getCaHoc: async (req, res, next) => {
    try {
      const data = await categoryService.getCaHoc();
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }
};

module.exports = CategoryController;