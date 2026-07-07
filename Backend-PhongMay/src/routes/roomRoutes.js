const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

// --- ROUTE MỚI DÀNH CHO APP FLUTTER LẤY PHÒNG TRỐNG ---
router.get('/available', roomController.getAvailableRooms);
router.get('/', roomController.getAllRooms);

// Route cũ của bạn
router.post('/may-tinh', roomController.addMayTinh);
router.get('/scan/:serial', roomController.scanMachine);
router.get('/:id/may-tinh', roomController.getComputersByRoom);


module.exports = router;