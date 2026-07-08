const express = require('express');
const router = express.Router();
const controller = require('../controllers/maintenanceController');

// Quản lý Báo cáo sự cố
router.get('/bao-cao-su-co', controller.getIncidents);
router.post('/bao-cao-su-co', controller.createIncident);
router.put('/bao-cao-su-co/:id', controller.updateIncident);
router.delete('/bao-cao-su-co/:id', controller.deleteIncident);
router.post('/report', controller.reportIncident);

// Quản lý Phiếu bảo trì
router.get('/phieu-bao-tri', controller.getTickets);
router.post('/phieu-bao-tri', controller.createTicket);
router.put('/phieu-bao-tri/:id', controller.updateTicket);
router.delete('/phieu-bao-tri/:id', controller.deleteTicket);

// Nhật ký phiếu bảo trì 
router.get('/nhat-ky-sua-chua', controller.getLogs);
module.exports = router;