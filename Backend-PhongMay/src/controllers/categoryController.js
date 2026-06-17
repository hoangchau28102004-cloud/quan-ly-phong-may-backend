const categoryService = require('../services/categoryService');

const CategoryController = {
  // LỚP HỌC
  getLopHoc: async (req, res, next) => { try { const data = await categoryService.getLopHoc(); res.json({ success: true, data }); } catch (error) { next(error); } },
  addLopHoc: async (req, res, next) => { try { const { ma_lop, nien_khoa, chuyen_nganh } = req.body; const id = await categoryService.addLopHoc(ma_lop, nien_khoa, chuyen_nganh); res.status(201).json({ success: true, message: 'Thành công', id }); } catch (error) { next(error); } },
  updateLopHoc: async (req, res, next) => { try { const { id } = req.params; const affectedRows = await categoryService.updateLopHoc(id, req.body); if (affectedRows === 0) return res.status(404).json({ success: false, message: 'Lỗi' }); res.json({ success: true, message: 'Thành công' }); } catch (error) { next(error); } },
  deleteLopHoc: async (req, res, next) => { try { const { id } = req.params; const affectedRows = await categoryService.deleteLopHoc(id); if (affectedRows === 0) return res.status(404).json({ success: false, message: 'Lỗi' }); res.json({ success: true, message: 'Thành công' }); } catch (error) { next(error); } },

  // THIẾT BỊ
  getThietBi: async (req, res, next) => { try { const data = await categoryService.getThietBi(); res.json({ success: true, data }); } catch (error) { next(error); } },
  addThietBi: async (req, res, next) => { try { const { ten_thiet_bi, so_luong } = req.body; const id = await categoryService.addThietBi(ten_thiet_bi, so_luong); res.status(201).json({ success: true, message: 'Thành công', id }); } catch (error) { next(error); } },

  // MÔN HỌC
  getMonHoc: async (req, res, next) => { try { const data = await categoryService.getMonHoc(); res.json({ success: true, data }); } catch (error) { next(error); } },
  addMonHoc: async (req, res, next) => { try { const { ten_mon } = req.body; const id = await categoryService.addMonHoc(ten_mon); res.status(201).json({ success: true, message: 'Thành công', id }); } catch (error) { next(error); } },
  updateMonHoc: async (req, res, next) => { try { const { id } = req.params; const affected = await categoryService.updateMonHoc(id, req.body.ten_mon); if (affected === 0) return res.status(404).json({ success: false }); res.json({ success: true }); } catch (error) { next(error); } },
  deleteMonHoc: async (req, res, next) => { try { const { id } = req.params; const affected = await categoryService.deleteMonHoc(id); if (affected === 0) return res.status(404).json({ success: false }); res.json({ success: true }); } catch (error) { next(error); } },

  // NĂM HỌC
  getNamHoc: async (req, res, next) => { try { const data = await categoryService.getNamHoc(); res.json({ success: true, data }); } catch (error) { next(error); } },
  addNamHoc: async (req, res, next) => { try { const { nam_hoc, hoc_ky } = req.body; const id = await categoryService.addNamHoc(nam_hoc, hoc_ky); res.status(201).json({ success: true, message: 'Thành công', id }); } catch (error) { next(error); } },

  // TUẦN HỌC
  getTuan: async (req, res, next) => { try { const { ma_nam_hoc } = req.query; const data = await categoryService.getTuan(ma_nam_hoc); res.json({ success: true, data }); } catch (error) { next(error); } },
  addTuan: async (req, res, next) => { try { const id = await categoryService.addTuan(req.body); res.status(201).json({ success: true, message: 'Thành công', id }); } catch (error) { next(error); } },
  deleteTuan: async (req, res, next) => { try { const { id } = req.params; await categoryService.deleteTuan(id); res.json({ success: true, message: 'Thành công' }); } catch (error) { next(error); } }
};

module.exports = CategoryController;