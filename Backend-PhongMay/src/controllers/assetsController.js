const assetsService = require('../services/assetsService');
const db = require('../config/db');

// ======================= PHÒNG MÁY =======================
const listRooms = async (req, res) => {
  try {
    const { page, limit, filter } = req.query;
    const rows = await assetsService.listRooms({ page, limit, filter });
    return res.json({ success: true, data: rows });
  } catch (err) { 
    return res.status(500).json({ success: false, message: err.message }); 
  }
};

const getRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const row = await assetsService.getRoomById(id);
    if (!row) return res.status(404).json({ success: false, message: 'Phòng không tồn tại' });
    return res.json({ success: true, data: row });
  } catch (err) { 
    return res.status(500).json({ success: false, message: err.message }); 
  }
};

const createRoom = async (req, res) => {
  try {
    const { ma_phong, ten_phong, suc_chua, mo_ta, trang_thai } = req.body;
    if (!ma_phong || !ten_phong) return res.status(400).json({ success: false, message: 'Thiếu ma_phong hoặc ten_phong' });
    const created = await assetsService.createRoom({ ma_phong, ten_phong, suc_chua, mo_ta, trang_thai });
    return res.status(201).json({ success: true, message: 'Tạo phòng thành công', id: created.id, data: created });
  } catch (err) { 
    return res.status(500).json({ success: false, message: err.message }); 
  }
};

const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const affected = await assetsService.updateRoom(id, req.body);
    if (affected === 0) return res.status(404).json({ success: false, message: 'Phòng không tồn tại hoặc không thay đổi' });
    return res.json({ success: true, message: 'Cập nhật phòng thành công' });
  } catch (err) { 
    return res.status(500).json({ success: false, message: err.message }); 
  }
};

const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const affected = await assetsService.deleteRoom(id);
    if (affected === 0) return res.status(404).json({ success: false, message: 'Phòng không tồn tại' });
    return res.json({ success: true, message: 'Xóa phòng thành công' });
  } catch (err) { 
    return res.status(500).json({ success: false, message: err.message }); 
  }
};

// ======================= MÁY TÍNH =======================
const listComputers = async (req, res) => {
  try {
    const { page, limit, filter } = req.query;
    const rows = await assetsService.listComputers({ page, limit, filter });
    return res.json({ success: true, data: rows });
  } catch (err) { 
    return res.status(500).json({ success: false, message: err.message }); 
  }
};

const getComputer = async (req, res) => {
  try {
    const { id } = req.params;
    const row = await assetsService.getComputerById(id);
    if (!row) return res.status(404).json({ success: false, message: 'Máy không tồn tại' });
    return res.json({ success: true, data: row });
  } catch (err) { 
    return res.status(500).json({ success: false, message: err.message }); 
  }
};

const createComputer = async (req, res) => {
  try {
    const created = await assetsService.createComputer(req.body);
    if (!created) return res.status(500).json({ success: false, message: 'Không thể tạo máy tính' });
    return res.status(201).json({ success: true, message: 'Tạo máy tính thành công', id: created.id, data: created });
  } catch (err) { 
    return res.status(500).json({ success: false, message: err.message }); 
  }
};

const updateComputer = async (req, res) => {
  try {
    const { id } = req.params;
    const affected = await assetsService.updateComputer(id, req.body);
    if (affected === 0) return res.status(404).json({ success: false, message: 'Máy không tồn tại hoặc không thay đổi' });
    return res.json({ success: true, message: 'Cập nhật máy thành công' });
  } catch (err) { 
    return res.status(500).json({ success: false, message: err.message }); 
  }
};

// 🚀 SỬA TRIỆT ĐỂ: TRẢ LỖI JSON KHI XÓA THẤT BẠI
const deleteComputer = async (req, res) => {
  try {
    const { id } = req.params;
    const affected = await assetsService.deleteComputer(id);
    if (affected === 0) return res.status(404).json({ success: false, message: 'Máy không tồn tại' });
    return res.json({ success: true, message: 'Đã xóa máy tính triệt để' });
  } catch (err) { 
    console.error("Lỗi API deleteComputer:", err.message);
    return res.status(500).json({ success: false, message: err.message }); 
  }
};

// ==========================================
// IMPORT RECEIPT (PHIẾU NHẬP MÁY) & ĐIỀU CHUYỂN
// ==========================================

const listImportReceipts = async (req, res) => {
  try {
    const rows = await assetsService.listImportReceipts();
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message }); 
  }
};

// 🚀 SỬA TRIỆT ĐỂ: CATCH LỖI TẠO PHIẾU
const createImportReceipt = async (req, res) => {
  try {
    console.log("=========================================");
    console.log("📦 DỮ LIỆU FLUTTER GỬI XUỐNG API CREATE IMPORT:");
    console.log(JSON.stringify(req.body, null, 2));
    console.log("=========================================");
    const result = await assetsService.createImportReceipt(req.body);
    return res.status(201).json(result);
  } catch (err) {
    
    console.error("Lỗi API createImportReceipt:", err.message);
    return res.status(400).json({
      success: false,
      message: err.message || 'Lỗi hệ thống khi tạo phiếu nhập'
    });
  }
};

const transferMachines = async (req, res) => {
  try {
    const result = await assetsService.transferMachines(req.body);
    return res.status(200).json(result);
  } catch (err) { 
    return res.status(500).json({ success: false, message: err.message }); 
  }
};

const getTransferHistory = async (req, res) => {
  try {
    const data = await assetsService.getTransferHistory();
    return res.status(200).json({ success: true, data: data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message }); 
  }
};

const formatToMySQLDate = (date) => {
  return new Date(date).toISOString().slice(0, 19).replace('T', ' ');
};

const borrowMachine = async (req, res, next) => {
  try {
    const { nguoi_dung_id, so_luong, ly_do_muon, ghi_chu, ngay_muon } = req.body;
    const conn = db.promise();

    const [gv] = await conn.query('SELECT id, ma_phong_ban FROM giang_vien WHERE ma_nguoi_dung = ?', [nguoi_dung_id]);
    if (gv.length === 0) return res.status(400).json({ success: false, message: 'Tài khoản không hợp lệ!' });

    const ma_phieu_muon = 'PM-' + Date.now().toString().slice(-6);
    const formattedDate = formatToMySQLDate(ngay_muon || new Date());

    const sql = `INSERT INTO phieu_muon_may 
                 (ma_phieu_muon, ma_giang_vien, ma_phong_ban, ngay_muon, so_luong, ly_do_muon, trang_thai, ghi_chu)
                 VALUES (?, ?, ?, ?, ?, ?, 'Đang mượn', ?)`;
                 
    await conn.query(sql, [ma_phieu_muon, gv[0].id, gv[0].ma_phong_ban || 1, formattedDate, so_luong, ly_do_muon, ghi_chu]);

    res.status(201).json({ success: true, message: 'Gửi yêu cầu mượn thiết bị thành công!' });
  } catch (error) {
    console.error("LỖI MƯỢN MÁY:", error);
    next(error);
  }
};

const getBorrowHistory = async (req, res, next) => {
  try {
    const { nguoi_dung_id } = req.query;
    const conn = db.promise();
    const [gv] = await conn.query('SELECT id FROM giang_vien WHERE ma_nguoi_dung = ?', [nguoi_dung_id]);
    
    if (gv.length === 0) return res.json({ success: true, data: [] });

    const [rows] = await conn.query(
      'SELECT * FROM phieu_muon_may WHERE ma_giang_vien = ? ORDER BY ngay_muon DESC', 
      [gv[0].id] 
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};

const deleteBorrowRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const conn = db.promise();
    const sql = `DELETE FROM phieu_muon_may WHERE id = ? AND trang_thai = 'Chờ duyệt'`;
    const [result] = await conn.query(sql, [id]);

    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Đã hủy yêu cầu mượn thiết bị!' });
    } else {
      res.status(400).json({ success: false, message: 'Không thể hủy (đã được duyệt hoặc không tồn tại).' });
    }
  } catch (error) {
    next(error);
  }
};

// ======================= TRẢ MÁY =======================
const returnMachine = async (req, res, next) => {
  try {
    const { nguoi_dung_id, so_luong, ghi_chu, thoi_gian_tra, ma_phieu_muon_id } = req.body;
    const conn = db.promise();

    const [pm] = await conn.query('SELECT so_luong FROM phieu_muon_may WHERE id = ?', [ma_phieu_muon_id]);
    if (pm.length === 0) return res.status(404).json({ success: false, message: 'Phiếu mượn không tồn tại!' });
    
    const soLuongHienTai = pm[0].so_luong;

    const [gv] = await conn.query('SELECT id FROM giang_vien WHERE ma_nguoi_dung = ?', [nguoi_dung_id]);
    if (gv.length === 0) return res.status(400).json({ success: false, message: 'Giảng viên không tồn tại!' });

    const ma_phieu_tra = 'PT-' + Date.now().toString().slice(-6);
    const dateToSave = thoi_gian_tra ? new Date(thoi_gian_tra).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ');

    // 1. Insert phiếu trả
    const sql = `INSERT INTO phieu_tra_may 
                 (ma_phieu_tra, ma_phieu_muon, ma_giang_vien, thoi_gian_tra, so_luong, trang_thai, ghi_chu) 
                 VALUES (?, ?, ?, ?, ?, 'pending', ?)`;
    await conn.query(sql, [ma_phieu_tra, ma_phieu_muon_id, gv[0].id, dateToSave, so_luong, ghi_chu]);

    // 2. Cập nhật phiếu mượn
    const soLuongConLai = soLuongHienTai - so_luong;
    
    if (soLuongConLai <= 0) {
      // Nếu trả hết -> Đã trả
      await conn.query(`UPDATE phieu_muon_may SET so_luong = 0, trang_thai = 'Đã trả' WHERE id = ?`, [ma_phieu_muon_id]);
    } else {
      // Nếu còn nợ -> Chờ duyệt trả
      await conn.query(`UPDATE phieu_muon_may SET so_luong = ?, trang_thai = 'Chờ duyệt trả' WHERE id = ?`, [soLuongConLai, ma_phieu_muon_id]);
    }

    res.status(201).json({ success: true, message: 'Gửi yêu cầu trả thiết bị thành công!' });
  } catch (error) {
    console.error("LỖI TRẢ MÁY:", error);
    next(error);
  }
};

const getReturnHistory = async (req, res, next) => {
  try {
    const { nguoi_dung_id } = req.query;
    const conn = db.promise();
    const [gv] = await conn.query('SELECT id FROM giang_vien WHERE ma_nguoi_dung = ?', [nguoi_dung_id]);
    if (gv.length === 0) return res.json({ success: true, data: [] });

    const sql = `
      SELECT pt.id, pt.ma_phieu_tra, pt.thoi_gian_tra, pt.so_luong, pt.trang_thai, pt.ghi_chu, 
             pm.ma_phieu_muon AS ma_phieu_muon_goc
      FROM phieu_tra_may pt
      LEFT JOIN phieu_muon_may pm ON pt.ma_phieu_muon = pm.id
      WHERE pt.ma_giang_vien = ? 
      ORDER BY pt.thoi_gian_tra DESC
    `;
    const [rows] = await conn.query(sql, [gv[0].id]);
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};

const confirmReturnRequest = async (req, res, next) => {
  try {
    const { id } = req.params; // ID của phiếu trả (phieu_tra_may)
    const conn = db.promise();

    // 1. Lấy thông tin phiếu trả và phiếu mượn gốc
    const [pt] = await conn.query('SELECT ma_phieu_muon, so_luong FROM phieu_tra_may WHERE id = ?', [id]);
    if (pt.length === 0) return res.status(404).json({ success: false, message: 'Phiếu không tồn tại' });

    const { ma_phieu_muon, so_luong } = pt[0];

    // 2. Trừ số lượng ở phiếu mượn gốc
    // UPDATE phieu_muon_may SET so_luong = so_luong - ? WHERE id = ?
    await conn.query('UPDATE phieu_muon_may SET so_luong = so_luong - ? WHERE id = ?', [so_luong, ma_phieu_muon]);

    // 3. Cập nhật trạng thái phiếu trả thành 'confirmed'
    await conn.query('UPDATE phieu_tra_may SET trang_thai = "confirmed" WHERE id = ?', [id]);

    // 4. Nếu phiếu mượn gốc về 0, cập nhật trạng thái phiếu mượn thành 'Đã trả hết'
    await conn.query('UPDATE phieu_muon_may SET trang_thai = "Đã trả" WHERE id = ? AND so_luong <= 0', [ma_phieu_muon]);

    res.json({ success: true, message: 'Đã duyệt trả máy thành công!' });
  } catch (error) {
    next(error);
  }
};

const cancelReturnRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const conn = db.promise();
    
    // 1. Lấy thông tin phiếu trả trước khi xóa để biết nó đã trừ bao nhiêu máy
    const [pt] = await conn.query('SELECT ma_phieu_muon, so_luong FROM phieu_tra_may WHERE id = ? AND trang_thai = "pending"', [id]);
    
    if (pt.length === 0) {
      return res.status(400).json({ success: false, message: 'Không thể hủy (đã được duyệt hoặc không tồn tại).' });
    }

    const { ma_phieu_muon, so_luong } = pt[0];

    // 2. Cộng ngược lại số lượng vào phiếu mượn gốc
    await conn.query('UPDATE phieu_muon_may SET so_luong = so_luong + ?, trang_thai = "Đang mượn" WHERE id = ?', [so_luong, ma_phieu_muon]);

    // 3. Xóa phiếu trả
    await conn.query('DELETE FROM phieu_tra_may WHERE id = ?', [id]);

    res.json({ success: true, message: 'Đã hủy yêu cầu và hoàn trả số lượng vào phiếu mượn!' });
  } catch (error) {
    next(error);
  }
};
const scanLecturerMachine = async (req, res, next) => {
    try {
        const { qrCode } = req.body;
        if (!qrCode) return res.status(400).json({ success: false, message: 'Thiếu mã QR' });

        const result = await assetsService.scanLecturerMachine(qrCode);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
  listRooms, getRoom, createRoom, updateRoom, deleteRoom,
  listComputers, getComputer, createComputer, updateComputer, deleteComputer,
  listImportReceipts, createImportReceipt,
  borrowMachine, getBorrowHistory, deleteBorrowRequest,
  transferMachines, getTransferHistory, scanLecturerMachine, returnMachine,getReturnHistory, cancelReturnRequest,confirmReturnRequest
};