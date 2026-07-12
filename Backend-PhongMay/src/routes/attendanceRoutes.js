const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController'); 


router.post('/check-in-qr',  attendanceController.scanQRCheckIn);
router.get('/students/:scheduleId', attendanceController.getStudentsBySchedule);
router.post('/save', attendanceController.saveAttendance);

module.exports = router;