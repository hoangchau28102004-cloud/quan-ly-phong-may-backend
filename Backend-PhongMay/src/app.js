const express = require('express');
const cors = require('cors');
require('dotenv').config();

// ================= Khai báo các Routes =================
const authRoutes = require('./routes/authRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const categoryRoutes = require('./routes/categoryRoutes'); 
const roomRoutes = require('./routes/roomRoutes');
const userRoutes = require('./routes/userRoutes');
const assetsRoutes = require('./routes/assetsRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const academicRoutes = require('./routes/academicRoutes'); 
const borrowReturnRoutes = require('./routes/borrowReturnRoutes');
const importRoutes = require('./routes/importRoutes');
const issueRoutes = require('./routes/issueRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const app = express();

// Enable CORS and allow Authorization header for dev frontend
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With']
}));
app.use(express.json());

// ================= Gắn Routes vào hệ thống =================
app.use('/api', authRoutes);
app.use('/api/schedule', scheduleRoutes); 

// ĐÃ SỬA: Kéo academicRoutes lên TRƯỚC categoryRoutes để lấy ưu tiên cao nhất!
app.use('/api/', academicRoutes);

app.use('/api', categoryRoutes); // Thằng này giờ bị rớt xuống ưu tiên thấp hơn
app.use('/api', roomRoutes); 
app.use('/api/phong-may', roomRoutes);
app.use('/api', userRoutes);
app.use('/api', assetsRoutes);
app.use('/api', maintenanceRoutes);
app.use('/api/borrow-return', borrowReturnRoutes); 
app.use('/api', importRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api', departmentRoutes);

// Middleware bắt lỗi chung
app.use((err, req, res, next) => {
  console.error('Lỗi hệ thống:', err.message);
  res.status(500).json({ success: false, message: 'Đã xảy ra lỗi hệ thống!', error: err.message });
});

module.exports = app;