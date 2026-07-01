const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issueController');

router.get('/computers', issueController.getComputers);
router.post('/report', issueController.reportIssue);

module.exports = router;