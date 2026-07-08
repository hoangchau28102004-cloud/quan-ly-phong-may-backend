const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController'); 


router.post('/check-in-qr',  attendanceController.scanQRCheckIn);

module.exports = router;