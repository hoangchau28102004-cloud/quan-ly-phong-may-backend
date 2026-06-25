const roomService = require('../services/roomService');

const RoomController = {
  addMayTinh: async (req, res, next) => {
    try {
      const { ma_may, dia_chi_ip, ma_phong, ma_cau_hinh } = req.body;
      const ma_qr = `QR-${ma_phong || 'unknown'}-${ma_may}-${Date.now()}`;
      const id = await roomService.addMayTinh({ ma_may, ip_may: dia_chi_ip, phong_may_id: ma_phong, cau_hinh_id: ma_cau_hinh, ma_qr });

      res.status(201).json({ success: true, message: 'Thêm máy tính thành công', id, data: { id, ma_may, ma_phong, ma_cau_hinh, dia_chi_ip, ma_qr }, qr_code: ma_qr });
    } catch (error) {
      next(error);
    }
  },

  // --- HÀM MỚI: GỌI SERVICE KIỂM TRA PHÒNG ---
  getAvailableRooms: async (req, res, next) => {
    try {
      const { date, start, end } = req.query;
      if (!date || !start || !end) {
        return res.status(400).json({ success: false, message: 'Thiếu tham số ngày hoặc tiết' });
      }
      
      const rooms = await roomService.getAvailableRooms(date, Number(start), Number(end));
      res.status(200).json({ success: true, data: rooms });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = RoomController;