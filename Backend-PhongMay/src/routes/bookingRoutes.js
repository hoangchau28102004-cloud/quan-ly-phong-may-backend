const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');

// Booking endpoints at /api/dat-phong-may
router.get('/dat-phong-may', scheduleController.getBookingsList);
router.post('/dat-phong-may', scheduleController.bookRoom);
router.put('/dat-phong-may/:id', scheduleController.updateBooking);

module.exports = router;
