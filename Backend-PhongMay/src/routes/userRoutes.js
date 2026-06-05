const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/users', userController.listUsers);
router.post('/users', userController.createUser);
router.post('/users/bulk', userController.createUsersBulk);
router.put('/users/:id', userController.updateUser);
router.put('/users/:id/reset-password', userController.resetPassword);
router.put('/users/:id/status', userController.toggleStatus);
router.get('/roles', userController.getRoles);

module.exports = router;
