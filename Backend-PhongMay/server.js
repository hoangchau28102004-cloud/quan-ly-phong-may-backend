require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const db = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/login', (req, res) => {
  const { tai_khoan, mat_khau } = req.body;
  const sql = `SELECT nd.*, vt.ten_vai_tro FROM nguoi_dung nd LEFT JOIN vai_tro vt ON nd.vai_tro_id = vt.id WHERE nd.tai_khoan = ? AND nd.mat_khau = ?`;
  db.query(sql, [tai_khoan, mat_khau], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Lỗi server' });
    }

    if (results.length > 0) {
      const user = results[0];
      const JWT_SECRET = process.env.JWT_SECRET || 'secret';
      const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

      const payload = {
        id: user.id,
        tai_khoan: user.tai_khoan,
        ho_ten: user.ho_ten,
        vai_tro_id: user.vai_tro_id,
        role: user.ten_vai_tro || null,
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      res.status(200).json({ 
        success: true, 
        message: 'Đăng nhập thành công',
        token,
        data: payload,
      });
    } else {
      res.status(401).json({ success: false, message: 'Sai tài khoản hoặc mật khẩu' });
    }
  });
});

const scheduleRoutes = require('./routes/schedule.routes');

app.use('/api/schedule', scheduleRoutes);

// Category endpoints (Lớp, Thiết bị)
const categoryController = require('./src/controllers/category.controller');
app.get('/api/lop-hoc', categoryController.getLopHoc);
app.post('/api/lop-hoc', categoryController.addLopHoc);
app.put('/api/lop-hoc/:id', categoryController.updateLopHoc);
app.delete('/api/lop-hoc/:id', categoryController.deleteLopHoc);

app.get('/api/thiet-bi', categoryController.getThietBi);
app.post('/api/thiet-bi', categoryController.addThietBi);

// Additional basic category endpoints
app.get('/api/mon-hoc', categoryController.getMonHoc);
app.get('/api/ca-hoc', categoryController.getCaHoc);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server API đang chạy tại http://localhost:${PORT}`);
});