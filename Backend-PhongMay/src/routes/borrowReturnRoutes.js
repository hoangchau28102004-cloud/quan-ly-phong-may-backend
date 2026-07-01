const express = require('express');
const router = express.Router();
const controller = require('../controllers/borrowReturnController');

router.get('/muon-may', controller.getBorrowRequests);
router.put('/muon-may/:id', controller.updateBorrow);

router.get('/tra-may', controller.getReturnRequests);
router.put('/tra-may/:id', controller.updateReturn);

module.exports = router;