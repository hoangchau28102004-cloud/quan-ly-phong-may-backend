const db = require('../config/db');

const BorrowReturnService = {
  // Lấy danh sách phiếu MƯỢN (Sử dụng GROUP_CONCAT thay cho JSON_ARRAYAGG)
  getBorrowRequests: async () => {
    const sql = `
      SELECT pm.*, 
             nd.ho_ten AS ten_nguoi_muon, 
             pb.ten_phong_ban,
             (SELECT CONCAT('[', GROUP_CONCAT(JSON_OBJECT(
                'ma_may', mt.ma_may, 
                'ten_may', mt.ten_may, 
                'tinh_trang', IFNULL(ct.tinh_trang_khi_muon, 'Không có'),
                'ghi_chu_ct', IFNULL(ct.ghi_chu, '')
              )), ']')
              FROM chi_tiet_phieu_muon_may ct
              JOIN may_tinh mt ON ct.ma_may_tinh = mt.id
              WHERE ct.ma_phieu_muon = pm.id) AS danh_sach_may
      FROM phieu_muon_may pm
      LEFT JOIN giang_vien gv ON pm.ma_giang_vien = gv.id
      LEFT JOIN nguoi_dung nd ON gv.ma_nguoi_dung = nd.id
      LEFT JOIN phong_ban pb ON pm.ma_phong_ban = pb.id
      ORDER BY pm.id DESC
    `;
    const [rows] = await db.promise().query(sql);
    return rows;
  },

  // Lấy danh sách phiếu TRẢ (Sử dụng GROUP_CONCAT thay cho JSON_ARRAYAGG)
  getReturnRequests: async () => {
    const sql = `
      SELECT pt.*, 
             pm.ma_phieu_muon AS ma_phieu_goc,
             nd.ho_ten AS ten_nguoi_tra,
             (SELECT CONCAT('[', GROUP_CONCAT(JSON_OBJECT(
                'ma_may', mt.ma_may, 
                'ten_may', mt.ten_may, 
                'tinh_trang', IFNULL(ct.tinh_trang_khi_tra, 'Không có'),
                'ghi_chu_ct', IFNULL(ct.ghi_chu, '')
              )), ']')
              FROM chi_tiet_phieu_tra_may ct
              JOIN may_tinh mt ON ct.ma_may_tinh = mt.id
              WHERE ct.ma_phieu_tra = pt.id) AS danh_sach_may
      FROM phieu_tra_may pt
      LEFT JOIN phieu_muon_may pm ON pt.ma_phieu_muon = pm.id
      LEFT JOIN giang_vien gv ON pt.ma_giang_vien = gv.id
      LEFT JOIN nguoi_dung nd ON gv.ma_nguoi_dung = nd.id
      ORDER BY pt.id DESC
    `;
    const [rows] = await db.promise().query(sql);
    return rows;
  },

  // Cập nhật trạng thái phiếu mượn
  updateBorrowStatus: async (id, trang_thai) => {
    const [result] = await db.promise().query('UPDATE phieu_muon_may SET trang_thai = ? WHERE id = ?', [trang_thai, id]);
    return result.affectedRows;
  },

  // Xác nhận trả máy (Cập nhật phiếu mượn liên quan thành 'Đã trả')
  confirmReturn: async (ma_phieu_muon_id) => {
    if (!ma_phieu_muon_id) return 0;
    const [result] = await db.promise().query('UPDATE phieu_muon_may SET trang_thai = ? WHERE id = ?', ['Đã trả', ma_phieu_muon_id]);
    return result.affectedRows;
  }
};

module.exports = BorrowReturnService;