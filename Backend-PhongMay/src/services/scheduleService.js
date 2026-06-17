const db = require('../config/db');

const getSchedule = async (tuan_id, lop_hoc_id, nguoi_dung_id) => {
  const conn = db.promise();
  try {
    let sql = `
      SELECT
        lpm.id,
        lpm.ngay_hoc_cu_the AS ngay_hoc,
        lpm.thu_trong_tuan AS thu,
        lpm.so_tiet_bat_dau AS tiet_bat_dau,
        lpm.so_tiet_ket_thuc AS tiet_ket_thuc,
        lpm.ma_tuan AS tuan_id,
        lpm.ma_ca,
        pm.ten_phong, pm.id AS phong_may_id,
        lh.ma_lop,
        mh.ten_mon,
        nd.ho_ten AS ten_giang_vien
      FROM lich_su_dung_phong_may lpm
      JOIN phong_may pm ON lpm.ma_phong = pm.id
      LEFT JOIN lop_hoc lh ON lpm.ma_lop = lh.id
      LEFT JOIN lop_hoc_phan lhp ON lpm.ma_lop_hoc_phan = lhp.id
      LEFT JOIN mon_hoc mh ON lhp.ma_mon = mh.id
      LEFT JOIN giang_vien gv ON lpm.ma_giang_vien = gv.id
      LEFT JOIN nguoi_dung nd ON gv.ma_nguoi_dung = nd.id
      WHERE 1=1
    `;

    const params = [];

    // Lọc theo tuần (tuan_id là bigint của bảng tuan)
    if (tuan_id) {
      sql += ` AND lpm.ma_tuan = ?`;
      params.push(tuan_id);
    }

    if (lop_hoc_id) {
      sql += ` AND lpm.ma_lop = ?`;
      params.push(lop_hoc_id);
    }

    if (nguoi_dung_id) {
      const [gvRows] = await conn.query('SELECT id FROM giang_vien WHERE ma_nguoi_dung = ?', [nguoi_dung_id]);
      if (gvRows.length > 0) {
        sql += ` AND lpm.ma_giang_vien = ?`;
        params.push(gvRows[0].id);
      } else {
        // Fallback nếu không phải giảng viên
        sql += ` AND lpm.ma_giang_vien = ?`;
        params.push(nguoi_dung_id);
      }
    }

    sql += ` ORDER BY lpm.ngay_hoc_cu_the ASC, lpm.so_tiet_bat_dau ASC`;

    const [rows] = await conn.query(sql, params);
    return rows;
  } catch (err) {
    throw err;
  }
};

const bookRoom = async (data) => {
  const conn = db.promise();
  try {
    const [gvRows] = await conn.query('SELECT id FROM giang_vien WHERE ma_nguoi_dung = ?', [data.nguoi_dung_id]);
    let ma_giang_vien = data.nguoi_dung_id;
    if (gvRows.length > 0) ma_giang_vien = gvRows[0].id;

    // Lưu ý: đảm bảo dữ liệu truyền vào khớp với các cột: 
    // ma_giang_vien, ma_phong, ngay_dat, ma_ca, muc_dich, trang_thai_duyet
    const sql = `INSERT INTO dat_phong_may (ma_giang_vien, ma_phong, ngay_dat, ma_ca, muc_dich, trang_thai_duyet, created_at) 
                 VALUES (?, ?, ?, ?, ?, ?, NOW())`;
    
    const [result] = await conn.query(sql, [
      ma_giang_vien, 
      data.phong_may_id, 
      data.ngay_yeu_cau, 
      data.ma_ca || null, 
      data.muc_dich || null, 
      data.trang_thai_duyet || 'pending'
    ]);
    
    const insertId = result.insertId || null;
    if (insertId) {
      const [rows] = await conn.query('SELECT * FROM dat_phong_may WHERE id = ?', [insertId]);
      return rows[0] || { id: insertId };
    }
    return null;
  } catch (err) {
    throw err;
  }
};

const updateBookingStatus = async (id, status, reviewerId) => {
  const conn = db.promise();
  // Bảng dat_phong_may có cột ma_nguoi_duyet không? 
  // Nếu schema cũ có ma_nguoi_duyet thì dùng, nếu không phải đổi tên cột cho khớp
  const sql = 'UPDATE dat_phong_may SET trang_thai_duyet = ?, ma_nguoi_duyet = ?, updated_at = NOW() WHERE id = ?';
  const [result] = await conn.query(sql, [status, reviewerId || null, id]);
  return result.affectedRows || 0;
};

const getBookings = async (opts = {}) => {
  const conn = db.promise();
  const { trang_thai_duyet, ma_phong, ma_giang_vien, page, limit } = opts;
  let sql = `SELECT dp.id, dp.ma_giang_vien, dp.ma_phong, dp.ngay_dat, dp.ma_ca, dp.muc_dich, dp.trang_thai_duyet, dp.ma_nguoi_duyet, dp.created_at, pm.ten_phong, nd.ho_ten as nguoi_dat
             FROM dat_phong_may dp
             LEFT JOIN phong_may pm ON dp.ma_phong = pm.id
             LEFT JOIN giang_vien gv ON dp.ma_giang_vien = gv.id
             LEFT JOIN nguoi_dung nd ON gv.ma_nguoi_dung = nd.id
             WHERE 1=1`;
  const params = [];
  if (trang_thai_duyet) { sql += ' AND dp.trang_thai_duyet = ?'; params.push(trang_thai_duyet); }
  if (ma_phong) { sql += ' AND dp.ma_phong = ?'; params.push(ma_phong); }
  if (ma_giang_vien) { sql += ' AND dp.ma_giang_vien = ?'; params.push(ma_giang_vien); }

  sql += ' ORDER BY dp.ngay_dat DESC, dp.created_at DESC';
  if (limit && Number(limit) > 0) {
    const l = Number(limit);
    const p = page && Number(page) > 0 ? Number(page) : 1;
    const offset = (p - 1) * l;
    sql += ' LIMIT ? OFFSET ?';
    params.push(l, offset);
  }

  const [rows] = await conn.query(sql, params);
  return rows;
};

module.exports = { getSchedule, bookRoom, updateBookingStatus, getBookings };