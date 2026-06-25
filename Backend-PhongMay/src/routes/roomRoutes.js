const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

// --- ROUTE MỚI DÀNH CHO APP FLUTTER LẤY PHÒNG TRỐNG ---
router.get('/available', roomController.getAvailableRooms);

// Route cũ của bạn
router.post('/may-tinh', roomController.addMayTinh);

// NẾU TRONG APP BẠN CÓ GỌI API LẤY TOÀN BỘ PHÒNG BÌNH THƯỜNG MÀ CHƯA CÓ ROUTE Ở ĐÂY,
// BẠN NÊN THÊM ROUTE NHƯ SAU ĐỂ APP KHÔNG BỊ LỖI LÚC VỪA MỞ LÊN (Tuỳ chọn):
// router.get('/', roomController.getAllRooms);

module.exports = router;