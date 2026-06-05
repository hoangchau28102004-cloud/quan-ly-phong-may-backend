const roomService = require('../services/roomService');

const RoomController = {
  addMayTinh: async (req, res, next) => {
    try {
      // Sử dụng tên trường mới khớp schema: `dia_chi_ip`, `ma_phong`, `ma_cau_hinh`
      const { ma_may, dia_chi_ip, ma_phong, ma_cau_hinh } = req.body;

      // Sinh mã QR dựa trên mã phòng
      const ma_qr = `QR-${ma_phong || 'unknown'}-${ma_may}-${Date.now()}`;

      // Gọi service (service nhận các tham số cũ nội bộ -> map tương ứng)
      const id = await roomService.addMayTinh({ ma_may, ip_may: dia_chi_ip, phong_may_id: ma_phong, cau_hinh_id: ma_cau_hinh, ma_qr });

      res.status(201).json({ success: true, message: 'Thêm máy tính thành công', id, data: { id, ma_may, ma_phong, ma_cau_hinh, dia_chi_ip, ma_qr }, qr_code: ma_qr });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = RoomController;