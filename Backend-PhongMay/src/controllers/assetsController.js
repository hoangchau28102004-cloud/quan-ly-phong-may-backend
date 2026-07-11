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

const createImportReceipt = async (req, res) => {
  try {
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

// ======================= LỊCH SỬ MƯỢN MÁY =======================
const borrowMachine = async (req, res, next) => {
  try {
    res.status(400).json({ success: false, message: 'Vui lòng dùng API mới /muon-may' });
  } catch (error) {
    next(error);
  }
};

const getBorrowHistory = async (req, res, next) => {
  try {
    const conn = db.promise();
    // 🚀 SỬA LỖI: Lấy thẳng danh sách toàn bộ phiếu mượn cho Admin quản lý
    const sql = `
      SELECT pm.*, pb.ten_phong_ban 
      FROM phieu_muon_may pm
      LEFT JOIN phong_ban pb ON pm.ma_phong_ban = pb.id
      ORDER BY pm.ngay_muon DESC
    `;
    const [rows] = await conn.query(sql);
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
    // Đón lõng thêm biến machine_ids từ Flutter gửi lên
    const { so_luong, ghi_chu, thoi_gian_tra, ma_phieu_muon_id, machine_ids } = req.body; 
    const conn = db.promise();

    const [pm] = await conn.query('SELECT so_luong FROM phieu_muon_may WHERE id = ?', [ma_phieu_muon_id]);
    if (pm.length === 0) return res.status(404).json({ success: false, message: 'Phiếu mượn không tồn tại!' });
    
    const soLuongHienTai = pm[0].so_luong;
    const ma_phieu_tra = 'PT-' + Date.now().toString().slice(-6);
    const dateToSave = thoi_gian_tra ? new Date(thoi_gian_tra).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ');

    // 1. Lưu phiếu trả tổng
    const sql = `INSERT INTO phieu_tra_may 
                 (ma_phieu_tra, ma_phieu_muon, ma_giang_vien, thoi_gian_tra, so_luong, trang_thai, ghi_chu) 
                 VALUES (?, ?, NULL, ?, ?, 'confirmed', ?)`;
    const [resultPt] = await conn.query(sql, [ma_phieu_tra, ma_phieu_muon_id, dateToSave, so_luong, ghi_chu]);
    const idPhieuTra = resultPt.insertId;

    // 2. LƯU CHI TIẾT TỪNG MÁY TRẢ
    if (machine_ids && machine_ids.length > 0) {
      for (const mId of machine_ids) {
        await conn.query(
          `INSERT INTO chi_tiet_phieu_tra_may (ma_phieu_tra, ma_may_tinh, tinh_trang_khi_tra, created_at, updated_at) 
           VALUES (?, ?, 'Bình thường', NOW(), NOW())`,
          [idPhieuTra, mId]
        );
      }
    }

    // 3. Trừ nợ số lượng
    const soLuongConLai = soLuongHienTai - so_luong;
    if (soLuongConLai <= 0) {
      await conn.query(`UPDATE phieu_muon_may SET so_luong = 0, trang_thai = 'Đã trả' WHERE id = ?`, [ma_phieu_muon_id]);
    } else {
      await conn.query(`UPDATE phieu_muon_may SET so_luong = ?, trang_thai = 'Đang mượn' WHERE id = ?`, [soLuongConLai, ma_phieu_muon_id]);
    }

    res.status(201).json({ success: true, message: 'Tạo phiếu trả máy thành công!' });
  } catch (error) {
    console.error("LỖI TRẢ MÁY:", error);
    next(error);
  }
};

const getReturnHistory = async (req, res, next) => {
  try {
    const conn = db.promise();
    // 🚀 SỬA LỖI: Lấy danh sách lịch sử trả cho Admin (Không kiểm tra tài khoản nữa)
    const sql = `
      SELECT pt.id, pt.ma_phieu_tra, pt.thoi_gian_tra, pt.so_luong, pt.trang_thai, pt.ghi_chu, 
             pm.ma_phieu_muon AS ma_phieu_muon_goc
      FROM phieu_tra_may pt
      LEFT JOIN phieu_muon_may pm ON pt.ma_phieu_muon = pm.id
      ORDER BY pt.thoi_gian_tra DESC
    `;
    const [rows] = await conn.query(sql);
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};

const confirmReturnRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const conn = db.promise();

    const [pt] = await conn.query('SELECT ma_phieu_muon, so_luong FROM phieu_tra_may WHERE id = ?', [id]);
    if (pt.length === 0) return res.status(404).json({ success: false, message: 'Phiếu không tồn tại' });

    const { ma_phieu_muon, so_luong } = pt[0];

    await conn.query('UPDATE phieu_muon_may SET so_luong = so_luong - ? WHERE id = ?', [so_luong, ma_phieu_muon]);
    await conn.query('UPDATE phieu_tra_may SET trang_thai = "confirmed" WHERE id = ?', [id]);
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
    
    const [pt] = await conn.query('SELECT ma_phieu_muon, so_luong FROM phieu_tra_may WHERE id = ? AND trang_thai = "pending"', [id]);
    
    if (pt.length === 0) {
      return res.status(400).json({ success: false, message: 'Không thể hủy (đã được duyệt hoặc không tồn tại).' });
    }

    const { ma_phieu_muon, so_luong } = pt[0];

    await conn.query('UPDATE phieu_muon_may SET so_luong = so_luong + ?, trang_thai = "Đang mượn" WHERE id = ?', [so_luong, ma_phieu_muon]);
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

const getAvailableMachines = async (req, res) => {
    try {
        const machines = await assetsService.getAvailableMachinesForBorrow();
        res.status(200).json({ success: true, data: machines });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const approveBorrow = async (req, res) => {
    const { id } = req.params;
    const { machineIds } = req.body;

    try {
        if (!machineIds || machineIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Phải chọn ít nhất 1 máy để cấp phát!' });
        }
        await assetsService.approveBorrowRequest(id, machineIds);
        res.status(200).json({ success: true, message: 'Đã duyệt và cấp phát máy thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
const getBorrowTicketDetails = async (req, res, next) => {
  try {
    const { id } = req.params; 
    const conn = db.promise();
    
    // Chỉ lấy những máy ĐÃ MƯỢN nhưng CHƯA TRẢ (not in chi_tiet_phieu_tra_may)
    const sql = `
      SELECT ct.id, ct.ma_may_tinh, mt.ma_may, mt.ten_may, ct.tinh_trang_khi_muon 
      FROM chi_tiet_phieu_muon_may ct
      JOIN may_tinh mt ON ct.ma_may_tinh = mt.id
      WHERE ct.ma_phieu_muon = ?
      AND ct.ma_may_tinh NOT IN (
          SELECT ctp.ma_may_tinh
          FROM chi_tiet_phieu_tra_may ctp
          JOIN phieu_tra_may pt ON ctp.ma_phieu_tra = pt.id
          WHERE pt.ma_phieu_muon = ?
      )
    `;
    
    // Truyền tham số id 2 lần cho 2 dấu chấm hỏi
    const [rows] = await conn.query(sql, [id, id]); 
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Lỗi lấy chi tiết phiếu mượn:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// THÊM HÀM NÀY VÀO CONTROLLER
const getMachineAllHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // TẬN DỤNG 100% CÁC HÀM SERVICE ĐÃ CÓ SẴN CỦA BÁC
    const transferHistory = await assetsService.getMachineTransferHistory(id);
    const borrowHistory = await assetsService.getMachineBorrowHistory(id);
    const returnHistory = await assetsService.getMachineReturnHistory(id);
    const maintenanceHistory = await assetsService.getMachineMaintenanceHistory(id);

    res.status(200).json({
      success: true,
      data: {
        dieu_chuyen: transferHistory,
        muon_may: borrowHistory,
        tra_may: returnHistory,
        sua_chua: maintenanceHistory
      }
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  listRooms, getRoom, createRoom, updateRoom, deleteRoom,
  listComputers, getComputer, createComputer, updateComputer, deleteComputer,
  listImportReceipts, createImportReceipt,
  borrowMachine, getBorrowHistory, deleteBorrowRequest,
  transferMachines, getTransferHistory, scanLecturerMachine, returnMachine,
  getReturnHistory, cancelReturnRequest,confirmReturnRequest, getAvailableMachines, 
  approveBorrow, getBorrowTicketDetails, getMachineAllHistory
};