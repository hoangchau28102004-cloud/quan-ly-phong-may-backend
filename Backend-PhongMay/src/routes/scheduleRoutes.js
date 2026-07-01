const express = require('express');
const router = express.Router();
const controller = require('../controllers/scheduleController');

// Quản lý Lịch phòng máy
router.get('/lich-phong', controller.getSchedules);
router.post('/lich-phong', controller.createSchedule);
router.put('/lich-phong/:id', controller.updateSchedule);
router.delete('/lich-phong/:id', controller.deleteSchedule);

// Quản lý Yêu cầu đặt phòng
router.get('/dat-phong', controller.getBookingRequests);
router.put('/dat-phong/:id', controller.updateBookingStatus);

// API mới
router.get('/list', controller.getScheduleList);
router.get('/', controller.getBookingsList);
router.post('/book', controller.bookRoom);

// Hủy phiếu chưa duyệt
router.delete('/:id', controller.deleteBooking);

// Duyệt phiếu (Admin)
router.patch('/:id/status', controller.updateBooking);

module.exports = router;