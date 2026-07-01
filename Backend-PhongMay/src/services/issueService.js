const db = require('../config/db');

// Lấy danh sách máy tính của một phòng để hiển thị lên Dropdown chọn máy lỗi
const getComputersByRoom = async (ma_phong) => {
  const conn = db.promise();
  const [rows] = await conn.query(
    'SELECT id, ma_may, ten_may FROM may_tinh WHERE ma_phong = ? AND trang_thai = "active"', 
    [ma_phong]
  );
  return rows;
};

// Lưu phiếu báo cáo lỗi vào bảng bao_cao_su_co
const createIssueReport = async (data) => {
  const conn = db.promise();
  const sql = `INSERT INTO bao_cao_su_co 
    (ma_nguoi_bao_cao, ma_may_tinh, loai_su_co, tieu_de, mo_ta, muc_do, trang_thai, created_at, updated_at) 
    VALUES (?, ?, ?, ?, ?, ?, 'open', NOW(), NOW())`;
  
  const [result] = await conn.query(sql, [
    data.ma_nguoi_bao_cao,
    data.ma_may_tinh,
    data.loai_su_co,
    data.tieu_de,
    data.mo_ta,
    data.muc_do || 'normal'
  ]);
  return result.insertId;
};

module.exports = { getComputersByRoom, createIssueReport };