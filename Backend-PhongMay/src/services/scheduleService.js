const db = require('../config/db');

const getSchedule = (tuan_hoc, lop_hoc_id, nguoi_dung_id) => {
  return new Promise((resolve, reject) => {
    let sql = `
      SELECT 
        lpm.id, lpm.ngay_hoc, lpm.thu, lpm.tiet_bat_dau, lpm.tiet_ket_thuc, lpm.tuan_hoc,
        pm.ten_phong, pm.id as phong_may_id,
        lh.ma_lop, 
        mh.ten_mon, 
        ch.gio_bat_dau, ch.gio_ket_thuc,
        nd.ho_ten as ten_giang_vien
      FROM lich_phong_may lpm
      JOIN phong_may pm ON lpm.phong_may_id = pm.id
      JOIN lop_hoc lh ON lpm.lop_hoc_id = lh.id
      JOIN mon_hoc mh ON lpm.mon_hoc_id = mh.id
      JOIN ca_hoc ch ON lpm.ca_hoc_id = ch.id
      JOIN nguoi_dung nd ON lpm.nguoi_dung_id = nd.id
      WHERE lpm.tuan_hoc = ?
    `;
    let queryParams = [tuan_hoc];

    if (lop_hoc_id) {
      sql += ` AND lpm.lop_hoc_id = ?`;
      queryParams.push(lop_hoc_id);
    } else if (nguoi_dung_id) {
      sql += ` AND lpm.nguoi_dung_id = ?`;
      queryParams.push(nguoi_dung_id);
    }

    sql += ` ORDER BY lpm.ngay_hoc ASC, lpm.tiet_bat_dau ASC`;

    db.query(sql, queryParams, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

const bookRoom = (data) => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO dk_phong_may (ngay_yeu_cau, nguoi_dung_id, phong_may_id, trang_thai) 
      VALUES (?, ?, ?, 'CHO_DUYET')
    `;
    db.query(sql, [data.ngay_yeu_cau, data.nguoi_dung_id, data.phong_may_id], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

module.exports = { getSchedule, bookRoom };