const express = require('express');
const router = express.Router();
const controller = require('../controllers/borrowReturnController');

router.get('/muon-may/history', controller.getBorrowHistoryByNguoiMuon);
router.get('/muon-may', controller.getBorrowRequests);
router.post('/muon-may', controller.createBorrowTicket);
router.put('/muon-may/:id', controller.updateBorrow);

router.get('/tra-may', controller.getReturnRequests);
router.put('/tra-may/:id', controller.updateReturn);
router.post('/tra-may', controller.processReturn);
module.exports = router;