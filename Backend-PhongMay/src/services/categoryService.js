const db = require('../config/db');

const CategoryService = {
  // Lớp học
  getLopHoc: async () => {
    const [rows] = await db.promise().query('SELECT * FROM lop_hoc');
    return rows;
  },
  addLopHoc: async (ma_lop) => {
    const [result] = await db.promise().query('INSERT INTO lop_hoc (ma_lop) VALUES (?)', [ma_lop]);
    return result.insertId;
  },
  updateLopHoc: async (id, ma_lop) => {
    const [result] = await db.promise().query('UPDATE lop_hoc SET ma_lop = ? WHERE id = ?', [ma_lop, id]);
    return result.affectedRows;
  },
  deleteLopHoc: async (id) => {
    const [result] = await db.promise().query('DELETE FROM lop_hoc WHERE id = ?', [id]);
    return result.affectedRows;
  },

  // Thiết bị
  getThietBi: async () => {
    const [rows] = await db.promise().query('SELECT * FROM thiet_bi');
    return rows;
  },
  addThietBi: async (ten_tb, so_luong_tong) => {
    // DB mới: cột `ten_thiet_bi`, `so_luong`
    const sql = 'INSERT INTO thiet_bi (ten_thiet_bi, so_luong) VALUES (?, ?)';
    const [result] = await db.promise().query(sql, [ten_tb, so_luong_tong]);
    return result.insertId;
  },

  // Môn & Ca
  getMonHoc: async () => {
    const [rows] = await db.promise().query('SELECT * FROM mon_hoc');
    return rows;
  },
  addMonHoc: async (ten_mon) => {
    const [result] = await db.promise().query('INSERT INTO mon_hoc (ten_mon) VALUES (?)', [ten_mon]);
    return result.insertId;
  },
  updateMonHoc: async (id, ten_mon) => {
    const [result] = await db.promise().query('UPDATE mon_hoc SET ten_mon = ? WHERE id = ?', [ten_mon, id]);
    return result.affectedRows;
  },
  deleteMonHoc: async (id) => {
    const [result] = await db.promise().query('DELETE FROM mon_hoc WHERE id = ?', [id]);
    return result.affectedRows;
  },
  getCaHoc: async () => {
    const [rows] = await db.promise().query('SELECT * FROM ca_hoc');
    return rows;
  }
,
  addCaHoc: async (ten_ca, gio_bat_dau, gio_ket_thuc) => {
    const sql = 'INSERT INTO ca_hoc (ten_ca, gio_bat_dau, gio_ket_thuc, created_at) VALUES (?, ?, ?, NOW())';
    const [result] = await db.promise().query(sql, [ten_ca, gio_bat_dau, gio_ket_thuc]);
    return result.insertId;
  },
  updateCaHoc: async (id, ten_ca, gio_bat_dau, gio_ket_thuc) => {
    const sql = 'UPDATE ca_hoc SET ten_ca = ?, gio_bat_dau = ?, gio_ket_thuc = ?, updated_at = NOW() WHERE id = ?';
    const [result] = await db.promise().query(sql, [ten_ca, gio_bat_dau, gio_ket_thuc, id]);
    return result.affectedRows;
  },
  deleteCaHoc: async (id) => {
    const [result] = await db.promise().query('DELETE FROM ca_hoc WHERE id = ?', [id]);
    return result.affectedRows;
  },
  // Cau truc cai dat thoi gian
  listCauTruc: async () => {
    const [rows] = await db.promise().query('SELECT * FROM cau_truc_cai_dat_thoi_gian ORDER BY id DESC');
    return rows;
  },
  createCauTruc: async (data) => {
    const { nam_hoc, hoc_ky, so_tuan, ngay_bat_dau_tuan, ngay_ket_thuc_tuan } = data;
    const sql = `INSERT INTO cau_truc_cai_dat_thoi_gian (nam_hoc, hoc_ky, so_tuan, ngay_bat_dau_tuan, ngay_ket_thuc_tuan, created_at)
                 VALUES (?, ?, ?, ?, ?, NOW())`;
    const [result] = await db.promise().query(sql, [nam_hoc, hoc_ky, so_tuan, ngay_bat_dau_tuan, ngay_ket_thuc_tuan]);
    return result.insertId;
  },
  updateCauTruc: async (id, data) => {
    const sets = [];
    const params = [];
    ['nam_hoc','hoc_ky','so_tuan','ngay_bat_dau_tuan','ngay_ket_thuc_tuan'].forEach(k => {
      if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); }
    });
    if (sets.length === 0) return 0;
    params.push(id);
    const sql = `UPDATE cau_truc_cai_dat_thoi_gian SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`;
    const [result] = await db.promise().query(sql, params);
    return result.affectedRows || 0;
  },
  deleteCauTruc: async (id) => {
    const [result] = await db.promise().query('DELETE FROM cau_truc_cai_dat_thoi_gian WHERE id = ?', [id]);
    return result.affectedRows || 0;
  }
};

module.exports = CategoryService;