const db = require('../config/db');

const RoomService = {
  addMayTinh: async (data) => {
    const { ma_may, ip_may, he_dieu_hanh, phong_may_id, cau_hinh_id, ma_qr } = data;
    // DB mới: cột `ma_may`, `ma_qr`, `dia_chi_ip`, `ma_phong`, `ma_cau_hinh`, `trang_thai`
    const sql = `INSERT INTO may_tinh (ma_may, ma_qr, dia_chi_ip, ma_phong, ma_cau_hinh, trang_thai)
                 VALUES (?, ?, ?, ?, ?, 'active')`;

    const [result] = await db.promise().query(sql, [ma_may, ma_qr, ip_may, phong_may_id, cau_hinh_id]);
    return result.insertId || null;
  }
};

module.exports = RoomService;