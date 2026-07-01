const service = require('../services/borrowReturnService');

const BorrowReturnController = {
  getBorrowRequests: async (req, res, next) => {
    try {
      const data = await service.getBorrowRequests();
      const formattedData = data.map(item => ({
        ...item,
        danh_sach_may: typeof item.danh_sach_may === 'string' ? JSON.parse(item.danh_sach_may || '[]') : (item.danh_sach_may || [])
      }));
      res.json({ success: true, data: formattedData });
    } catch (err) { next(err); }
  },

  getReturnRequests: async (req, res, next) => {
    try {
      const data = await service.getReturnRequests();
      const formattedData = data.map(item => ({
        ...item,
        danh_sach_may: typeof item.danh_sach_may === 'string' ? JSON.parse(item.danh_sach_may || '[]') : (item.danh_sach_may || [])
      }));
      res.json({ success: true, data: formattedData });
    } catch (err) { next(err); }
  },

  updateBorrow: async (req, res, next) => {
    try {
      await service.updateBorrowStatus(req.params.id, req.body.trang_thai);
      res.json({ success: true, message: 'Cập nhật trạng thái mượn thành công' });
    } catch (err) { next(err); }
  },

  updateReturn: async (req, res, next) => {
    try {
      // req.params.id ở đây ta nhận id của phieu_muon_may để cập nhật thành 'Đã trả'
      await service.confirmReturn(req.body.ma_phieu_muon_id);
      res.json({ success: true, message: 'Đã xác nhận trả máy thành công' });
    } catch (err) { next(err); }
  }
};

module.exports = BorrowReturnController;