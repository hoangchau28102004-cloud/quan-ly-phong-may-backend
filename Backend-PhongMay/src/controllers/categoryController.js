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
      res.status(201).json({ success: true, message: 'Thêm lớp thành công', id, data: { id, ma_lop } });
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
      // Request fields aligned với DB mới: `ten_thiet_bi`, `so_luong`
      const { ten_thiet_bi, so_luong } = req.body;
      const id = await categoryService.addThietBi(ten_thiet_bi, so_luong);
      res.status(201).json({ success: true, message: 'Thêm thiết bị thành công', id, data: { id, ten_thiet_bi, so_luong } });
    } catch (error) { next(error); }
  },

  // --- MÔN HỌC & CA HỌC ---
  getMonHoc: async (req, res, next) => {
    try {
      const data = await categoryService.getMonHoc();
      res.json({ success: true, data });
    } catch (error) { next(error); }
  },
  addMonHoc: async (req, res, next) => {
    try {
      const { ten_mon } = req.body;
      if (!ten_mon) return res.status(400).json({ success: false, message: 'Thiếu ten_mon' });
      const id = await categoryService.addMonHoc(ten_mon);
      res.status(201).json({ success: true, message: 'Thêm môn thành công', id, data: { id, ten_mon } });
    } catch (error) { next(error); }
  },
  updateMonHoc: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { ten_mon } = req.body;
      const affected = await categoryService.updateMonHoc(id, ten_mon);
      if (affected === 0) return res.status(404).json({ success: false, message: 'Môn học không tồn tại' });
      res.json({ success: true, message: 'Cập nhật môn học thành công' });
    } catch (error) { next(error); }
  },
  deleteMonHoc: async (req, res, next) => {
    try {
      const { id } = req.params;
      const affected = await categoryService.deleteMonHoc(id);
      if (affected === 0) return res.status(404).json({ success: false, message: 'Môn học không tồn tại' });
      res.json({ success: true, message: 'Xóa môn học thành công' });
    } catch (error) { next(error); }
  },
  getCaHoc: async (req, res, next) => {
    try {
      const data = await categoryService.getCaHoc();
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }
  ,
  addCaHoc: async (req, res, next) => {
    try {
      const { ten_ca, gio_bat_dau, gio_ket_thuc } = req.body;
      if (!ten_ca || !gio_bat_dau || !gio_ket_thuc) return res.status(400).json({ success: false, message: 'Thiếu trường ca hoc' });
      const id = await categoryService.addCaHoc(ten_ca, gio_bat_dau, gio_ket_thuc);
      res.status(201).json({ success: true, message: 'Thêm ca học thành công', id, data: { id, ten_ca, gio_bat_dau, gio_ket_thuc } });
    } catch (error) { next(error); }
  },
  updateCaHoc: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { ten_ca, gio_bat_dau, gio_ket_thuc } = req.body;
      const affected = await categoryService.updateCaHoc(id, ten_ca, gio_bat_dau, gio_ket_thuc);
      if (affected === 0) return res.status(404).json({ success: false, message: 'Ca học không tồn tại' });
      res.json({ success: true, message: 'Cập nhật ca học thành công' });
    } catch (error) { next(error); }
  },
  deleteCaHoc: async (req, res, next) => {
    try {
      const { id } = req.params;
      const affected = await categoryService.deleteCaHoc(id);
      if (affected === 0) return res.status(404).json({ success: false, message: 'Ca học không tồn tại' });
      res.json({ success: true, message: 'Xóa ca học thành công' });
    } catch (error) { next(error); }
  },
  // Cau truc
  listCauTruc: async (req, res, next) => {
    try {
      const rows = await categoryService.listCauTruc();
      res.json({ success: true, data: rows });
    } catch (error) { next(error); }
  },
  createCauTruc: async (req, res, next) => {
    try {
      const id = await categoryService.createCauTruc(req.body);
      res.status(201).json({ success: true, message: 'Tạo cấu trúc thời gian thành công', id });
    } catch (error) { next(error); }
  },
  updateCauTruc: async (req, res, next) => {
    try {
      const { id } = req.params;
      const affected = await categoryService.updateCauTruc(id, req.body);
      if (affected === 0) return res.status(404).json({ success: false, message: 'Cấu trúc không tồn tại hoặc không có thay đổi' });
      res.json({ success: true, message: 'Cập nhật cấu trúc thành công' });
    } catch (error) { next(error); }
  },
  deleteCauTruc: async (req, res, next) => {
    try {
      const { id } = req.params;
      const affected = await categoryService.deleteCauTruc(id);
      if (affected === 0) return res.status(404).json({ success: false, message: 'Cấu trúc không tồn tại' });
      res.json({ success: true, message: 'Xóa cấu trúc thành công' });
    } catch (error) { next(error); }
  }
};

module.exports = CategoryController;