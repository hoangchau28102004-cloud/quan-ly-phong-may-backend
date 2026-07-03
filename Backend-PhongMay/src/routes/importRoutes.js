const express = require('express');
const router = express.Router();
const importController = require('../controllers/importController');

router.post('/phieu-nhap-may', importController.createImportReceipt);
router.get('/phieu-nhap-may', importController.getImportReceipts);

module.exports = router;
