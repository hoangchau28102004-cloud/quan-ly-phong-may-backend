const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Khai báo các Routes
const authRoutes = require('./routes/authRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const categoryRoutes = require('./routes/categoryRoutes'); 
const roomRoutes = require('./routes/roomRoutes'); // <-- THÊM DÒNG NÀY
const userRoutes = require('./routes/userRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const assetsRoutes = require('./routes/assetsRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');

const app = express();

// Enable CORS and allow Authorization header for dev frontend
app.use(cors({
  origin: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With']
}));
app.use(express.json());

// Gắn Routes vào hệ thống
app.use('/api', authRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api', categoryRoutes); 
app.use('/api', roomRoutes); // <-- THÊM DÒNG NÀY (/api/may-tinh)
app.use('/api', userRoutes);
app.use('/api', bookingRoutes);
app.use('/api', assetsRoutes);
app.use('/api', maintenanceRoutes);

// Middleware bắt lỗi chung
app.use((err, req, res, next) => {
  console.error('Lỗi hệ thống:', err.message);
  res.status(500).json({ success: false, message: 'Đã xảy ra lỗi hệ thống!', error: err.message });
});

module.exports = app;