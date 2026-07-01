const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

router.post('/may-tinh', roomController.addMayTinh);
router.get('/scan/:serial', roomController.scanMachine);

module.exports = router;