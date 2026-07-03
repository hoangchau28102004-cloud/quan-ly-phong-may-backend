const db = require('../config/db');

const RoomService = {
  addMayTinh: async (data) => {
    const {
      ma_phong, ma_may, ten_may, vi_tri, ma_qr,
      bo_xu_ly, ram, card_do_hoa, bo_mach_chu, man_hinh,
      ban_phim, chuot, hdd, ssd, trang_thai = 'active', ghi_chu
    } = data;

    const sql = `INSERT INTO may_tinh (
      ma_phong, ma_may, ten_may, vi_tri, ma_qr,
      bo_xu_ly, ram, card_do_hoa, bo_mach_chu, man_hinh,
      ban_phim, chuot, hdd, ssd, trang_thai, ghi_chu, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;

    const [result] = await db.promise().query(sql, [
      ma_phong || null,
      ma_may,
      ten_may || null,
      vi_tri || null,
      ma_qr || null,
      bo_xu_ly || null,
      ram || null,
      card_do_hoa || null,
      bo_mach_chu || null,
      man_hinh || null,
      ban_phim || null,
      chuot || null,
      hdd || null,
      ssd || null,
      trang_thai,
      ghi_chu || null
    ]);
    
    return result.insertId || null;
  },

  getMachineBySerial: async (serial) => {
    const sql = `
        SELECT mt.*, pm.ten_phong 
        FROM may_tinh mt 
        LEFT JOIN phong_may pm ON mt.ma_phong = pm.id 
        WHERE mt.ma_qr = ?
    `;
    const [rows] = await db.promise().query(sql, [serial]);
    return rows[0];
  },

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
  },

  getAllRooms: async () => {
    const [rows] = await db.promise().query(
      'SELECT id, ma_phong, ten_phong, suc_chua, trang_thai FROM phong_may WHERE trang_thai = "active" ORDER BY ma_phong ASC'
    );
    return rows;
  }
};


module.exports = RoomService;