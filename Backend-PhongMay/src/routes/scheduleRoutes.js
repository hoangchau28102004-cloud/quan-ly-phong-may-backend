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

module.exports = router;