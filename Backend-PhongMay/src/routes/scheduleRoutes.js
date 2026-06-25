const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');

router.get('/list', scheduleController.getScheduleList);

router.get('/', scheduleController.getBookingsList);

router.post('/book', scheduleController.bookRoom);

router.put('/:id', scheduleController.editBooking);

router.patch('/:id/status', scheduleController.updateBooking);

module.exports = router;