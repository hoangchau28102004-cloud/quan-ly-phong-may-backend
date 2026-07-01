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
  }
};


module.exports = RoomService;