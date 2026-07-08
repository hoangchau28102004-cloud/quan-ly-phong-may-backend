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

const borrowMachine = async (req, res, next) => {
  try {
    const { nguoi_dung_id, so_luong, ly_do_muon, ghi_chu } = req.body;
    const conn = db.promise();

    // 1. Tìm thông tin giảng viên
    const [gv] = await conn.query('SELECT id, ma_phong_ban FROM giang_vien WHERE ma_nguoi_dung = ?', [nguoi_dung_id]);
    if (gv.length === 0) {
      return res.status(400).json({ success: false, message: 'Tài khoản không phải là Giảng viên!' });
    }

    const ma_giang_vien = gv[0].id;
    const ma_phong_ban = gv[0].ma_phong_ban || 1; 

    // 2. Sinh mã phiếu mượn tự động
    const ma_phieu_muon = 'PM-' + Date.now().toString().slice(-6);

    // 3. Thêm vào database
    const sql = `INSERT INTO phieu_muon_may 
                 (ma_phieu_muon, ma_giang_vien, ma_phong_ban, ngay_muon, so_luong, ly_do_muon, trang_thai, ghi_chu)
                 VALUES (?, ?, ?, NOW(), ?, ?, 'Chờ duyệt', ?)`;
                 
    await conn.query(sql, [ma_phieu_muon, ma_giang_vien, ma_phong_ban, so_luong, ly_do_muon, ghi_chu]);

    res.status(201).json({ success: true, message: 'Gửi yêu cầu mượn thiết bị thành công!' });
  } catch (error) {
    next(error);
  }
};

const getBorrowHistory = async (req, res, next) => {
  try {
    const { nguoi_dung_id } = req.query;
    const conn = db.promise();

    // Tìm mã giảng viên
    const [gv] = await conn.query('SELECT id FROM giang_vien WHERE ma_nguoi_dung = ?', [nguoi_dung_id]);
    if (gv.length === 0) return res.json({ success: true, data: [] });

    // Lấy danh sách phiếu mượn của giảng viên này
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
    
    // Chỉ cho phép xóa khi trạng thái là 'Chờ duyệt'
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
  transferMachines, getTransferHistory,scanLecturerMachine
};