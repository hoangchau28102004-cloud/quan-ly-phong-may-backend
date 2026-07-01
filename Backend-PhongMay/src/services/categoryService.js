const db = require('../config/db');

const CategoryService = {
  // 1. Lớp học
  getLopHoc: async () => {
    const [rows] = await db.promise().query('SELECT * FROM lop_hoc');
    return rows;
  },
  addLopHoc: async (ma_lop, nien_khoa, chuyen_nganh) => {
    const sql = 'INSERT INTO lop_hoc (ma_lop, nien_khoa, chuyen_nganh) VALUES (?, ?, ?)';
    const [result] = await db.promise().query(sql, [ma_lop, nien_khoa, chuyen_nganh]);
    return result.insertId;
  },
  updateLopHoc: async (id, data) => {
    const { ma_lop, nien_khoa, chuyen_nganh } = data;
    const [result] = await db.promise().query(
      'UPDATE lop_hoc SET ma_lop = ?, nien_khoa = ?, chuyen_nganh = ? WHERE id = ?', 
      [ma_lop, nien_khoa, chuyen_nganh, id]
    );
    return result.affectedRows;
  },
  deleteLopHoc: async (id) => {
    const [result] = await db.promise().query('DELETE FROM lop_hoc WHERE id = ?', [id]);
    return result.affectedRows;
  },

  // 2. Thiết bị
  getThietBi: async () => {
    const [rows] = await db.promise().query('SELECT * FROM thiet_bi');
    return rows;
  },
  addThietBi: async (ten_tb, so_luong) => {
    const sql = 'INSERT INTO thiet_bi (ten_thiet_bi, so_luong) VALUES (?, ?)';
    const [result] = await db.promise().query(sql, [ten_tb, so_luong]);
    return result.insertId;
  },

  

  // 4. Quản lý năm học
  getNamHoc: async () => {
    const [rows] = await db.promise().query('SELECT * FROM nam_hoc ORDER BY id DESC');
    return rows;
  },
  addNamHoc: async (nam_hoc, hoc_ky) => {
    const sql = 'INSERT INTO nam_hoc (nam_hoc, hoc_ky, created_at) VALUES (?, ?, NOW())';
    const [result] = await db.promise().query(sql, [nam_hoc, hoc_ky]);
    return result.insertId;
  },

  // 5. Quản lý tuần học
  getTuan: async (ma_nam_hoc) => {
    const sql = 'SELECT * FROM tuan WHERE ma_nam_hoc = ? ORDER BY so_tuan ASC';
    const [rows] = await db.promise().query(sql, [ma_nam_hoc]);
    return rows;
  },
  addTuan: async (data) => {
    const { ma_nam_hoc, so_tuan, ngay_bat_dau_tuan, ngay_ket_thuc_tuan } = data;
    const sql = `INSERT INTO tuan (ma_nam_hoc, so_tuan, ngay_bat_dau_tuan, ngay_ket_thuc_tuan, created_at) VALUES (?, ?, ?, ?, NOW())`;
    const [result] = await db.promise().query(sql, [ma_nam_hoc, so_tuan, ngay_bat_dau_tuan, ngay_ket_thuc_tuan]);
    return result.insertId;
  },
  deleteTuan: async (id) => {
    const [result] = await db.promise().query('DELETE FROM tuan WHERE id = ?', [id]);
    return result.affectedRows;
  }
};

module.exports = CategoryService;