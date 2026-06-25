const db = require('../config/db');

const RoomService = {
  addMayTinh: async (data) => {
    const { ma_may, ip_may, he_dieu_hanh, phong_may_id, cau_hinh_id, ma_qr } = data;
    // DB mới: cột `ma_may`, `ma_qr`, `dia_chi_ip`, `ma_phong`, `ma_cau_hinh`, `trang_thai`
    const sql = `INSERT INTO may_tinh (ma_may, ma_qr, dia_chi_ip, ma_phong, ma_cau_hinh, trang_thai)
                 VALUES (?, ?, ?, ?, ?, 'active')`;

    const [result] = await db.promise().query(sql, [ma_may, ma_qr, ip_may, phong_may_id, cau_hinh_id]);
    return result.insertId || null;
  },

  // --- HÀM MỚI: LẤY DANH SÁCH PHÒNG VÀ KIỂM TRA TRỐNG ---
  getAvailableRooms: async (date, start, end) => {
    const conn = db.promise();
    const sql = `
      SELECT pm.id, pm.ma_phong, pm.ten_phong, pm.suc_chua, pm.trang_thai,
             CASE
                 WHEN (
                     EXISTS (
                         SELECT 1 FROM lich_su_dung_phong_may ls
                         WHERE ls.ma_phong = pm.id
                           AND ls.ngay_hoc_cu_the = ?
                           AND ls.so_tiet_bat_dau <= ?
                           AND ls.so_tiet_ket_thuc >= ?
                     )
                     OR EXISTS (
                         SELECT 1 FROM dat_phong_may dp
                         WHERE dp.ma_phong = pm.id
                           AND dp.ngay_dat = ?
                           AND dp.tiet_bat_dau <= ?
                           AND dp.tiet_ket_thuc >= ?
                           AND dp.trang_thai_duyet IN ('pending', 'approved')
                     )
                 ) THEN 0 ELSE 1
             END AS is_available
      FROM phong_may pm
      WHERE pm.trang_thai = 'active'
      ORDER BY pm.ma_phong ASC
    `;
    
    // So sánh chéo thời gian để tìm trùng lặp
    const [rows] = await conn.query(sql, [date, end, start, date, end, start]);
    return rows;
  }
};

module.exports = RoomService;