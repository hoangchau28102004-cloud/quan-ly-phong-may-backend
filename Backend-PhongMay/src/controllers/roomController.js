const roomService = require('../services/roomService');

const RoomController = {
  addMayTinh: async (req, res, next) => {
    try {
      const { ma_may, ip_may, he_dieu_hanh, phong_may_id, cau_hinh_id } = req.body;
      
      // Logic sinh mã QR vẫn giữ ở Controller hoặc đẩy xuống Service đều được
      // Ở đây ta tạo xong đẩy xuống Service lưu
      const ma_qr = `QR-${phong_may_id}-${ma_may}-${Date.now()}`;

      await roomService.addMayTinh({ ma_may, ip_may, he_dieu_hanh, phong_may_id, cau_hinh_id, ma_qr });
      
      res.status(201).json({ success: true, message: 'Thêm máy tính thành công', qr_code: ma_qr });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = RoomController;