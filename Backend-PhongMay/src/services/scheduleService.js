const db = require('../config/db');

const getSchedule = async (tuan_id, lop_hoc_id, nguoi_dung_id, current_date) => {
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
        CASE
            WHEN lpm.so_tiet_bat_dau >= 11 THEN 'Tối'
            WHEN lpm.so_tiet_bat_dau >= 6 THEN 'Chiều'
            ELSE 'Sáng'
        END AS ma_ca,
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

    if (tuan_id) {
      sql += ` AND lpm.ma_tuan = ?`;
      params.push(tuan_id);
    } else if (current_date) {
      sql += ` AND lpm.ma_tuan = (SELECT id FROM tuan WHERE ? BETWEEN ngay_bat_dau AND ngay_ket_thuc LIMIT 1)`;
      params.push(current_date);
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
        sql += ` AND lpm.ma_giang_vien = ?`;
        params.push(nguoi_dung_id);
      }
    }

    sql += ` ORDER BY lpm.ngay_hoc_cu_the ASC, lpm.so_tiet_bat_dau ASC`;

    const [rows] = await conn.query(sql, params);
    
    return rows.map(r => {
      let thuInt = 2;
      if (r.thu === 'Thứ 2') thuInt = 2;
      else if (r.thu === 'Thứ 3') thuInt = 3;
      else if (r.thu === 'Thứ 4') thuInt = 4;
      else if (r.thu === 'Thứ 5') thuInt = 5;
      else if (r.thu === 'Thứ 6') thuInt = 6;
      else if (r.thu === 'Thứ 7') thuInt = 7;
      else if (r.thu === 'Chủ Nhật' || r.thu === 'CN') thuInt = 8;

      return { 
        ...r, 
        thu: thuInt,
        gio_bat_dau: r.tiet_bat_dau ? 'Tiết ' + r.tiet_bat_dau : 'Tiết 1',
        gio_ket_thuc: r.tiet_ket_thuc ? 'Tiết ' + r.tiet_ket_thuc : 'Tiết 3',
        ma_lop: r.ma_lop || 'Lớp chung',
        ten_giang_vien: r.ten_giang_vien || 'Đang cập nhật'
      };
    });
  } catch (err) {
    throw err;
  }
};

const bookRoom = async (data) => {
  const conn = db.promise();
  try {
    let [gvRows] = await conn.query('SELECT id FROM giang_vien WHERE ma_nguoi_dung = ?', [data.nguoi_dung_id]);
    let ma_giang_vien;

    if (gvRows.length === 0) {
      const ma_gv_tam = 'GV' + data.nguoi_dung_id + '_' + Date.now().toString().slice(-4);
      const [insertGv] = await conn.query(
        'INSERT INTO giang_vien (ma_nguoi_dung, ma_giang_vien, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
        [data.nguoi_dung_id, ma_gv_tam]
      );
      ma_giang_vien = insertGv.insertId;
    } else {
      ma_giang_vien = gvRows[0].id;
    }

    const sql = `INSERT INTO dat_phong_may 
                 (ma_giang_vien, ma_phong, ngay_dat, tiet_bat_dau, tiet_ket_thuc, muc_dich, trang_thai_duyet, created_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`;
    
    const [result] = await conn.query(sql, [
      ma_giang_vien, 
      data.phong_may_id, 
      data.ngay_yeu_cau, 
      data.tiet_bat_dau || 1,
      data.tiet_ket_thuc || 1,
      data.muc_dich || '', 
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
  const sql = 'UPDATE dat_phong_may SET trang_thai_duyet = ?, updated_at = NOW() WHERE id = ?';
  const [result] = await conn.query(sql, [status, id]);
  return result.affectedRows || 0;
};

const getBookings = async (opts = {}) => {
  const conn = db.promise();
  const { trang_thai_duyet, ma_phong, ma_giang_vien, nguoi_dung_id, page, limit } = opts;
  
  let sql = `SELECT dp.id, dp.ma_giang_vien, dp.ma_phong, 
             DATE_FORMAT(dp.ngay_dat, '%Y-%m-%d') as ngay_dat, 
             CASE
                WHEN dp.tiet_bat_dau >= 11 THEN 'Tối'
                WHEN dp.tiet_bat_dau >= 6 THEN 'Chiều'
                ELSE 'Sáng'
             END AS ma_ca,
             dp.tiet_bat_dau, dp.tiet_ket_thuc, dp.muc_dich, dp.trang_thai_duyet, dp.created_at, pm.ten_phong, nd.ho_ten as nguoi_dat
             FROM dat_phong_may dp
             LEFT JOIN phong_may pm ON dp.ma_phong = pm.id
             LEFT JOIN giang_vien gv ON dp.ma_giang_vien = gv.id
             LEFT JOIN nguoi_dung nd ON gv.ma_nguoi_dung = nd.id
             WHERE 1=1`;
  const params = [];
  
  if (trang_thai_duyet) { sql += ' AND dp.trang_thai_duyet = ?'; params.push(trang_thai_duyet); }
  if (ma_phong) { sql += ' AND dp.ma_phong = ?'; params.push(ma_phong); }
  if (ma_giang_vien) { sql += ' AND dp.ma_giang_vien = ?'; params.push(ma_giang_vien); }
  if (nguoi_dung_id) { sql += ' AND gv.ma_nguoi_dung = ?'; params.push(nguoi_dung_id); }

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

// HÀM MỚI: Xóa phiếu mượn phòng chưa duyệt
const deleteBooking = async (id) => {
  const conn = db.promise();
  const sql = `DELETE FROM dat_phong_may WHERE id = ? AND trang_thai_duyet = 'pending'`;
  const [result] = await conn.query(sql, [id]);
  return result.affectedRows || 0;
};

module.exports = { getSchedule, bookRoom, updateBookingStatus, getBookings, deleteBooking };