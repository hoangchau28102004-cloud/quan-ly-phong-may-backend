const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// router.get('/lop-hoc', categoryController.getLopHoc);
// router.post('/lop-hoc', categoryController.addLopHoc);
// router.put('/lop-hoc/:id', categoryController.updateLopHoc);
// router.delete('/lop-hoc/:id', categoryController.deleteLopHoc);

router.get('/thiet-bi', categoryController.getThietBi);
router.post('/thiet-bi', categoryController.addThietBi);


router.get('/nam-hoc', categoryController.getNamHoc);
router.post('/nam-hoc', categoryController.addNamHoc);

router.get('/tuan', categoryController.getTuan);
router.post('/tuan', categoryController.addTuan);
router.delete('/tuan/:id', categoryController.deleteTuan);

module.exports = router;