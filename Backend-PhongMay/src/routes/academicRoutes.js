const express = require('express');
const router = express.Router();
const controller = require('../controllers/academicController');

// Môn học
router.get('/mon-hoc', controller.getSubjects);
router.post('/mon-hoc', controller.createSubject);
router.put('/mon-hoc/:id', controller.updateSubject);
router.delete('/mon-hoc/:id', controller.deleteSubject);

// Lớp học
router.get('/lop-hoc', controller.getClasses);
router.post('/lop-hoc', controller.createClass);
router.put('/lop-hoc/:id', controller.updateClass);
router.delete('/lop-hoc/:id', controller.deleteClass);

// Lớp học phần
router.get('/lop-hoc-phan', controller.getModules);
router.post('/lop-hoc-phan', controller.createModule);
router.put('/lop-hoc-phan/:id', controller.updateModule);
router.delete('/lop-hoc-phan/:id', controller.deleteModule);

// Lấy danh sách giảng viên
router.get('/giang-vien', controller.getTeachers);

// ==========================================
// Quản lý NĂM HỌC & TUẦN (Mới thêm)
// ==========================================
router.get('/nam-hoc', controller.getAcademicYears);
router.post('/nam-hoc', controller.createAcademicYear);
router.delete('/nam-hoc/:id', controller.deleteAcademicYear);
router.get('/tuan/:yearId', controller.getWeeksByYear);

// ==========================================
// Quản lý sinh viên trong LỚP HỌC (Class)
// ==========================================
router.get('/lop-hoc/:classId/sinh-vien', controller.getStudentsByClass);
router.get('/sinh-vien-tu-do', controller.getAvailableStudents);
router.post('/lop-hoc/:classId/sinh-vien', controller.addStudentToClass);
router.delete('/sinh-vien/:studentId/khoi-lop', controller.removeStudentFromClass);
// Đổi lại đường dẫn cho chuẩn RESTful API của app
router.get('/lop-hoc-phan/:moduleId/sinh-vien-tu-do', controller.getAvailableStudentsForModule);
// ==========================================
// Quản lý sinh viên trong LỚP HỌC PHẦN 
// ==========================================
router.get('/lop-hoc-phan/:moduleId/sinh-vien', controller.getStudentsByModule);
router.post('/lop-hoc-phan/:moduleId/sinh-vien', controller.addStudentToModule);
router.delete('/lop-hoc-phan/:moduleId/sinh-vien/:studentId', controller.removeStudentFromModule);

module.exports = router;