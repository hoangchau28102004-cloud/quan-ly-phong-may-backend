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
const notificationRoutes = require('./routes/notificationRoutes');
const app = express();

// Enable CORS and allow Authorization header for dev frontend
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With']
}));
app.use(express.json());

// ================= Gắn Routes vào hệ thống =================
const routeMappings = [
  { prefix: '/api', router: authRoutes },
  { prefix: '/api/schedule', router: scheduleRoutes },
  { prefix: '/api/notifications', router: notificationRoutes },

  // Academic routes cần ưu tiên trước categoryRoutes để tránh xung đột đường dẫn
  { prefix: '/api/', router: academicRoutes },

  { prefix: '/api', router: categoryRoutes },
  { prefix: '/api', router: roomRoutes },
  { prefix: '/api/phong-may', router: roomRoutes },
  { prefix: '/api', router: userRoutes },
  { prefix: '/api', router: assetsRoutes },
  { prefix: '/api', router: maintenanceRoutes },
  { prefix: '/api/borrow-return', router: borrowReturnRoutes },
  { prefix: '/api', router: importRoutes },
  { prefix: '/api/attendance', router: attendanceRoutes },
  { prefix: '/api/issues', router: issueRoutes },
  { prefix: '/api', router: departmentRoutes },
];

for (const mapping of routeMappings) {
  app.use(mapping.prefix, mapping.router);
}

app.get('/api/_debug/routes', (req, res) => {
  const routeList = routeMappings.map((mapping) => ({
    prefix: mapping.prefix,
    routes: mapping.router.stack
      .filter((layer) => layer.route)
      .map((layer) => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods),
      })),
  }));
  res.json({ success: true, routes: routeList });
});

// Middleware bắt lỗi chung
app.use((err, req, res, next) => {
  console.error('Lỗi hệ thống:', err.message);
  res.status(500).json({ success: false, message: 'Đã xảy ra lỗi hệ thống!', error: err.message });
});

module.exports = app;