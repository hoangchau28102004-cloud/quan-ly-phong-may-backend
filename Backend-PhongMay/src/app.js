const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Khai báo các Routes
const authRoutes = require('./routes/authRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const categoryRoutes = require('./routes/categoryRoutes'); 
const roomRoutes = require('./routes/roomRoutes'); // <-- THÊM DÒNG NÀY

const app = express();

app.use(cors());
app.use(express.json());

// Gắn Routes vào hệ thống
app.use('/api', authRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api', categoryRoutes); 
app.use('/api', roomRoutes); // <-- THÊM DÒNG NÀY (/api/may-tinh)

// Middleware bắt lỗi chung
app.use((err, req, res, next) => {
  console.error('Lỗi hệ thống:', err.message);
  res.status(500).json({ success: false, message: 'Đã xảy ra lỗi hệ thống!', error: err.message });
});

module.exports = app;