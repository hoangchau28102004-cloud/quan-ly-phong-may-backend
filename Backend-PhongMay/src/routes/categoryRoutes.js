const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// Lớp học
router.get('/lop-hoc', categoryController.getLopHoc);
router.post('/lop-hoc', categoryController.addLopHoc);
router.put('/lop-hoc/:id', categoryController.updateLopHoc);
router.delete('/lop-hoc/:id', categoryController.deleteLopHoc);

// Thiết bị
router.get('/thiet-bi', categoryController.getThietBi);
router.post('/thiet-bi', categoryController.addThietBi);

// Môn học & Ca học
router.get('/mon-hoc', categoryController.getMonHoc);
router.get('/ca-hoc', categoryController.getCaHoc);

module.exports = router;