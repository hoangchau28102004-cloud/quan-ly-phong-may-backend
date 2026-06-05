const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');

// Incidents
router.get('/bao-cao-su-co', maintenanceController.listIncidents);
router.get('/bao-cao-su-co/:id', maintenanceController.getIncident);
router.post('/bao-cao-su-co', maintenanceController.createIncident);
router.put('/bao-cao-su-co/:id', maintenanceController.updateIncident);
router.delete('/bao-cao-su-co/:id', maintenanceController.deleteIncident);

// Tickets
router.get('/phieu-bao-tri', maintenanceController.listTickets);
router.get('/phieu-bao-tri/:id', maintenanceController.getTicket);
router.post('/phieu-bao-tri', maintenanceController.createTicket);
router.put('/phieu-bao-tri/:id', maintenanceController.updateTicket);
router.delete('/phieu-bao-tri/:id', maintenanceController.deleteTicket);

module.exports = router;
