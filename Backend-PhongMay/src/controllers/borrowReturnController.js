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
      await service.confirmReturn(req.body.ma_phieu_muon_id);
      res.json({ success: true, message: 'Đã xác nhận trả máy thành công' });
    } catch (err) { next(err); }
  },

  // ==========================================
  // HÀM MỚI: XỬ LÝ TẠO PHIẾU MƯỢN TỪ FLUTTER
  // ==========================================
    createBorrowTicket : async (req, res, next) => {
    try {
      // 1. Nhặt đúng tên các biến mà Flutter gửi lên
      const { nguoi_muon, ma_phong_ban, so_luong, ly_do_muon, ghi_chu, ngay_muon, may_tinh_ids } = req.body;
      
      // 2. Validate bảo vệ Backend
      if (!nguoi_muon || !ma_phong_ban) {
          return res.status(400).json({ success: false, message: 'Thiếu thông tin người mượn hoặc phòng ban!' });
      }
      if (!may_tinh_ids || may_tinh_ids.length === 0) {
          return res.status(400).json({ success: false, message: 'Vui lòng chọn ít nhất 1 thiết bị để mượn!' });
      }

      // 3. Đẩy xuống Service xử lý Transaction
      // SỬA Ở ĐÂY: Đổi 'borrowReturnService' thành 'service' 
      const result = await service.createBorrowTicket({
          nguoi_muon, 
          ma_phong_ban, 
          so_luong, 
          ly_do_muon, 
          ghi_chu, 
          ngay_muon, 
          may_tinh_ids
      });
      
      res.status(201).json(result);
    } catch (error) {
      console.error("LỖI TẠO PHIẾU MƯỢN:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  getBorrowHistoryByNguoiMuon: async (req, res, next) => {
    try {
      const { nguoi_muon } = req.query;
      if (!nguoi_muon) return res.status(400).json({ success: false, message: 'Thiếu thông tin người mượn' });

      const data = await service.getBorrowHistoryByNguoiMuon(nguoi_muon);
      res.json({ success: true, data: data });
    } catch (err) { 
      next(err); 
    }
  },
  // THÊM HÀM NÀY VÀO TRONG CONTROLLER
  processReturn: async (req, res, next) => {
    try {
      const result = await service.processReturnMachines(req.body);
      res.status(200).json(result);
    } catch (err) { 
      next(err); 
    }
  }
};

module.exports = BorrowReturnController;