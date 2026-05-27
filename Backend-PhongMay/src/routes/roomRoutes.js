const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

router.post('/may-tinh', roomController.addMayTinh);

module.exports = router;