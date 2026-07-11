const express = require('express');
const router = express.Router();
const controller = require('../controllers/departmentController');

router.get('/phong-ban', controller.getAllDepartments);

module.exports = router;