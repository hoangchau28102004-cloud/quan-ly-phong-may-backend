const db = require('../config/db');

const RoomService = {
  addMayTinh: async (data) => {
    const { ma_may, ip_may, he_dieu_hanh, phong_may_id, cau_hinh_id, ma_qr } = data;
    const sql = `INSERT INTO may_tinh (ma_may, ma_qr, trang_thai, ip_may, he_dieu_hanh, phong_may_id, cau_hinh_id) 
                 VALUES (?, ?, 'BINH_THUONG', ?, ?, ?, ?)`;
    
    const [result] = await db.promise().query(sql, [ma_may, ma_qr, ip_may, he_dieu_hanh, phong_may_id, cau_hinh_id]);
    return result;
  }
};

module.exports = RoomService;