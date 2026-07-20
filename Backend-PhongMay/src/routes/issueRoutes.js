const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issueController');

router.get('/computers', issueController.getComputers);
router.post('/report', issueController.reportIssue);
router.patch('/:id/status', issueController.updateIssueStatus);

module.exports = router;