const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');

router.get('/list', scheduleController.getScheduleList);
router.post('/book', scheduleController.bookRoom);

module.exports = router;