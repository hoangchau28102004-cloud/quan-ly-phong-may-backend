const db = require('../../config/db'); // Import kết nối MySQL (root config)

const CategoryController = {
  // Lấy danh sách Lớp học
  getLopHoc: async (req, res) => {
    try {
      const [rows] = await db.promise().query('SELECT * FROM lop_hoc');
      res.json({ success: true, data: rows });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Thêm Lớp học mới
  addLopHoc: async (req, res) => {
    const { ma_lop } = req.body;
    try {
      const [result] = await db.promise().query('INSERT INTO lop_hoc (ma_lop) VALUES (?)', [ma_lop]);
      res.json({ success: true, message: 'Thêm lớp thành công', id: result.insertId });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Cập nhật Lớp học (PUT /lop-hoc/:id)
  updateLopHoc: async (req, res) => {
    const { id } = req.params;
    const { ma_lop } = req.body;
    try {
      const [result] = await db.promise().query('UPDATE lop_hoc SET ma_lop = ? WHERE id = ?', [ma_lop, id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Lớp không tồn tại' });
      }
      res.json({ success: true, message: 'Cập nhật lớp thành công' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Xóa Lớp học (DELETE /lop-hoc/:id)
  deleteLopHoc: async (req, res) => {
    const { id } = req.params;
    try {
      const [result] = await db.promise().query('DELETE FROM lop_hoc WHERE id = ?', [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Lớp không tồn tại' });
      }
      res.json({ success: true, message: 'Xóa lớp thành công' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Lấy danh sách thiết bị
  getThietBi: async (req, res) => {
    try {
      const [rows] = await db.promise().query('SELECT * FROM thiet_bi');
      res.json({ success: true, data: rows });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Thêm thiết bị mới
  addThietBi: async (req, res) => {
    const { ten_tb, so_luong_tong } = req.body;
    try {
      const sql = 'INSERT INTO thiet_bi (ten_tb, so_luong_tong, so_luong_con) VALUES (?, ?, ?)';
      const [result] = await db.promise().query(sql, [ten_tb, so_luong_tong, so_luong_tong]);
      res.json({ success: true, message: 'Thêm thiết bị thành công', id: result.insertId });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
,
  // Lấy danh sách môn học
  getMonHoc: async (req, res) => {
    try {
      const [rows] = await db.promise().query('SELECT * FROM mon_hoc');
      res.json({ success: true, data: rows });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Lấy danh sách ca học
  getCaHoc: async (req, res) => {
    try {
      const [rows] = await db.promise().query('SELECT * FROM ca_hoc');
      res.json({ success: true, data: rows });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = CategoryController;