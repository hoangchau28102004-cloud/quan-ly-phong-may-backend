const express = require('express');
const router = express.Router();
const assetsController = require('../controllers/assetsController');

// ==========================================
// 1. QUẢN LÝ PHÒNG MÁY & MÁY TÍNH
// ==========================================
router.get('/phong-may', assetsController.listRooms);
router.get('/phong-may/:id', assetsController.getRoom);
router.post('/phong-may', assetsController.createRoom);
router.put('/phong-may/:id', assetsController.updateRoom);
router.delete('/phong-may/:id', assetsController.deleteRoom);

router.get('/may-tinh', assetsController.listComputers);
router.get('/may-tinh/:id', assetsController.getComputer);
router.post('/may-tinh', assetsController.createComputer); 
router.put('/may-tinh/:id', assetsController.updateComputer);
router.delete('/may-tinh/:id', assetsController.deleteComputer);

// ==========================================
// 2. NGHIỆP VỤ MƯỢN MÁY
// ==========================================
router.post('/borrow-machine', assetsController.borrowMachine);
router.get('/borrow-machine/history', assetsController.getBorrowHistory);
router.delete('/borrow-machine/:id', assetsController.deleteBorrowRequest);

// QUẢN LÝ DUYỆT MƯỢN MÁY CỦA ADMIN
router.get('/borrow/available-machines', assetsController.getAvailableMachines);
router.post('/borrow/approve/:id', assetsController.approveBorrow);

// ==========================================
// 3. NGHIỆP VỤ TRẢ MÁY (ADMIN & GIẢNG VIÊN)
// ==========================================
router.post('/tra-thiet-bi', assetsController.returnMachine);
router.get('/tra-thiet-bi/history', assetsController.getReturnHistory);
router.delete('/tra-thiet-bi/:id', assetsController.cancelReturnRequest);

// ==========================================
// 4. PHIẾU NHẬP MÁY & ĐIỀU CHUYỂN
// ==========================================
router.get('/phieu-nhap-may', assetsController.listImportReceipts);
router.post('/phieu-nhap-may', assetsController.createImportReceipt);

router.post('/transfer', assetsController.transferMachines);
router.get('/transfer-history', assetsController.getTransferHistory);

// ==========================================
// 5. TIỆN ÍCH QR CODE
// ==========================================
router.post('/scan-lecturer', assetsController.scanLecturerMachine);

// ==========================================
// 6. CHI TIẾT PHIẾU MƯỢN MÁY
// ==========================================
router.get('/borrow-machine/:id/details', assetsController.getBorrowTicketDetails);


router.get('/may-tinh/:id/history', assetsController.getMachineAllHistory);
module.exports = router;