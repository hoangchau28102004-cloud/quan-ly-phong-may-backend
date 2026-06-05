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
router.post('/mon-hoc', categoryController.addMonHoc);
router.put('/mon-hoc/:id', categoryController.updateMonHoc);
router.delete('/mon-hoc/:id', categoryController.deleteMonHoc);
router.get('/ca-hoc', categoryController.getCaHoc);
router.post('/ca-hoc', categoryController.addCaHoc);
router.put('/ca-hoc/:id', categoryController.updateCaHoc);
router.delete('/ca-hoc/:id', categoryController.deleteCaHoc);

// Cau truc
router.get('/cau-truc-cai-dat-thoi-gian', categoryController.listCauTruc);
router.post('/cau-truc-cai-dat-thoi-gian', categoryController.createCauTruc);
router.put('/cau-truc-cai-dat-thoi-gian/:id', categoryController.updateCauTruc);
router.delete('/cau-truc-cai-dat-thoi-gian/:id', categoryController.deleteCauTruc);

module.exports = router;