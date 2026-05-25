const db = require('../config/db');

const RoomController = {
  /**
   * POST /may-tinh
   * Thêm máy tính mới vào phòng và sinh mã QR tự động.
   * Body: { ma_may, ip_may, he_dieu_hanh, phong_may_id, cau_hinh_id }
   * Response: { success: true, message, qr_code }
   */
  // Thêm máy tính và tự động tạo mã QR
  addMayTinh: async (req, res) => {
    const { ma_may, ip_may, he_dieu_hanh, phong_may_id, cau_hinh_id } = req.body;
    
    // Logic sinh mã QR: Ghép ID Phòng + Mã Máy (VD: PM01-PC01)
    const ma_qr = `QR-${phong_may_id}-${ma_may}-${Date.now()}`;

    try {
      const sql = `INSERT INTO may_tinh (ma_may, ma_qr, trang_thai, ip_may, he_dieu_hanh, phong_may_id, cau_hinh_id) 
                   VALUES (?, ?, 'BINH_THUONG', ?, ?, ?, ?)`;
      await db.query(sql, [ma_may, ma_qr, ip_may, he_dieu_hanh, phong_may_id, cau_hinh_id]);
      
      res.json({ success: true, message: 'Thêm máy tính thành công', qr_code: ma_qr });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
module.exports = RoomController;