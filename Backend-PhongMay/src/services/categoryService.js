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
    const sql = 'INSERT INTO thiet_bi (ten_tb, so_luong_tong, so_luong_con) VALUES (?, ?, ?)';
    const [result] = await db.promise().query(sql, [ten_tb, so_luong_tong, so_luong_tong]);
    return result.insertId;
  },

  // Môn & Ca
  getMonHoc: async () => {
    const [rows] = await db.promise().query('SELECT * FROM mon_hoc');
    return rows;
  },
  getCaHoc: async () => {
    const [rows] = await db.promise().query('SELECT * FROM ca_hoc');
    return rows;
  }
};

module.exports = CategoryService;