const express = require('express');
const router = express.Router();
const db = require('../config/db');
const userController = require('../controllers/userController');

// Lấy danh sách và Tạo mới
router.get('/users', userController.listUsers);
router.post('/users', userController.createUser);
router.post('/users/bulk', userController.createUsersBulk);

// Các thao tác trên 1 người dùng cụ thể
router.put('/users/:id', userController.updateUser); // Chỉnh sửa
router.put('/users/:id/reset-password', userController.resetPassword); // Reset mật khẩu
router.put('/users/:id/status', userController.toggleStatus); // Khóa/Mở khóa

// --- ROUTE MỚI: Xóa mềm người dùng ---
router.delete('/users/:id', userController.deleteUser);

// Lấy danh sách vai trò
router.get('/roles', userController.getRoles);
router.get('/student-dashboard/:userId', userController.getStudentDashboard);

module.exports = router;