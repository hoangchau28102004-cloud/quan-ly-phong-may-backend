const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);

router.get('/profile/:id', authController.getProfile); 

router.put('/profile/:id', authController.updateProfile);
router.put('/change-password/:id', authController.changePassword);

module.exports = router;