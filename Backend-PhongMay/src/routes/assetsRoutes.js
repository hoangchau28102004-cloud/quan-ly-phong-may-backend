const express = require('express');
const router = express.Router();
const assetsController = require('../controllers/assetsController');

// Rooms
router.get('/phong-may', assetsController.listRooms);
router.get('/phong-may/:id', assetsController.getRoom);
router.post('/phong-may', assetsController.createRoom);
router.put('/phong-may/:id', assetsController.updateRoom);
router.delete('/phong-may/:id', assetsController.deleteRoom);

// Configs
router.get('/cau-hinh-may-tinh', assetsController.listConfigs);
router.post('/cau-hinh-may-tinh', assetsController.createConfig);
router.put('/cau-hinh-may-tinh/:id', assetsController.updateConfig);
router.delete('/cau-hinh-may-tinh/:id', assetsController.deleteConfig);

// Computers
router.get('/may-tinh', assetsController.listComputers);
router.get('/may-tinh/:id', assetsController.getComputer);
router.put('/may-tinh/:id', assetsController.updateComputer);
router.delete('/may-tinh/:id', assetsController.deleteComputer);

// ==========================================
// IMPORT RECEIPT (PHIẾU NHẬP MÁY)
// ==========================================

// 1. Lấy danh sách phiếu nhập
router.get('/phieu-nhap-may', assetsController.listImportReceipts);

// 2. Tạo phiếu nhập mới
router.post('/phieu-nhap-may', assetsController.createImportReceipt);

module.exports = router;