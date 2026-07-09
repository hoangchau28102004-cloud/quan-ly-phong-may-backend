const express = require('express');
const router = express.Router();
const assetsController = require('../controllers/assetsController');

// Rooms
router.get('/phong-may', assetsController.listRooms);
router.get('/phong-may/:id', assetsController.getRoom);
router.post('/phong-may', assetsController.createRoom);
router.put('/phong-may/:id', assetsController.updateRoom);
router.delete('/phong-may/:id', assetsController.deleteRoom);

// Computers (Đã gỡ bỏ API cấu hình riêng, gom hết vào Máy tính)
router.get('/may-tinh', assetsController.listComputers);
router.get('/may-tinh/:id', assetsController.getComputer);
router.post('/may-tinh', assetsController.createComputer); // Bổ sung API tạo máy tính
router.put('/may-tinh/:id', assetsController.updateComputer);
router.delete('/may-tinh/:id', assetsController.deleteComputer);
router.post('/borrow-machine', assetsController.borrowMachine);
router.get('/borrow-machine/history', assetsController.getBorrowHistory);
router.delete('/borrow-machine/:id', assetsController.deleteBorrowRequest);
// Chú ý đường dẫn phải khớp chính xác với Flutter đang gọi
router.get('/muon-thiet-bi/history', assetsController.getBorrowHistory);
router.get('/tra-thiet-bi/history', assetsController.getReturnHistory);
router.post('/tra-thiet-bi', assetsController.returnMachine);
router.delete('/tra-thiet-bi/:id', assetsController.cancelReturnRequest);

// ==========================================
// IMPORT RECEIPT (PHIẾU NHẬP MÁY)
// ==========================================

// 1. Lấy danh sách phiếu nhập
router.get('/phieu-nhap-may', assetsController.listImportReceipts);

// 2. Tạo phiếu nhập mới
router.post('/phieu-nhap-may', assetsController.createImportReceipt);

// 3. Chuyển máy tính giữa các phòng
router.post('/transfer', assetsController.transferMachines);

// 4. Lấy danh sách lịch sử chuyển máy
router.get('/transfer-history', assetsController.getTransferHistory);

// 5. Quét mã QR máy tính của giảng viên
router.post('/scan-lecturer', assetsController.scanLecturerMachine);
module.exports = router;