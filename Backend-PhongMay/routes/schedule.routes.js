const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/schedule.controller');

// API: GET /api/schedule/list?tuan_hoc=...
router.get('/list', scheduleController.getScheduleList);

// API: POST /api/schedule/book
router.post('/book', scheduleController.bookRoom);

module.exports = router;