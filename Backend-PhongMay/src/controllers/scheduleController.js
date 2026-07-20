const scheduleService = require('../services/scheduleService');
const notificationService = require('../services/notificationService'); // 🚀 IMPORT SERVICE THÔNG BÁO
const db = require('../config/db'); // 🚀 IMPORT DB ĐỂ LẤY THÔNG TIN ĐỘNG

const handleResponse = async (res, next, action) => {
  try {
    const result = await action();
    res.json(result || { success: true, message: 'Thành công!' });
  } catch (err) {
    next(err);
  }
};

// LỊCH CHÍNH THỨC
const getSchedules = (req, res, next) => handleResponse(res, next, async () => ({ success: true, data: await scheduleService.getSchedules() }));

const createSchedule = async (req, res, next) => {
  try {
    const insertId = await scheduleService.createSchedule(req.body);

    if (req.body.ma_giang_vien) {
      try {
        const [teacherRows] = await db.promise().query(
          `SELECT nd.id AS nguoi_dung_id, nd.ho_ten, pm.ten_phong
           FROM giang_vien gv
           JOIN nguoi_dung nd ON gv.ma_nguoi_dung = nd.id
           LEFT JOIN phong_may pm ON pm.id = ?
           WHERE gv.id = ?`,
          [req.body.ma_phong, req.body.ma_giang_vien]
        );

        if (teacherRows.length > 0) {
          const { nguoi_dung_id, ho_ten, ten_phong } = teacherRows[0];
          const dateObj = new Date(req.body.ngay_hoc_cu_the);
          const formattedDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
          const content = `Admin đã tạo lịch cho bạn tại phòng ${ten_phong || 'không xác định'} vào ngày ${formattedDate}, tiết ${req.body.so_tiet_bat_dau}-${req.body.so_tiet_ket_thuc}.`;

          await notificationService.sendToSpecificUser(
            nguoi_dung_id,
            'Lịch giảng mới đã được tạo',
            content,
            'schedule_created'
          );
        }
      } catch (notifError) {
        console.error('Lỗi gửi thông báo tạo lịch cho giảng viên:', notifError);
      }
    }

    res.status(201).json({ success: true, message: 'Tạo lịch thành công', data: { id: insertId } });
  } catch (err) {
    next(err);
  }
};

const updateSchedule = async (req, res, next) => {
    try {
        const id = req.params.id;
        const data = req.body; // Giao diện sẽ gửi ngay_hoc_cu_the, ma_giang_vien... qua body

        // Gọi xuống tầng Service
        const affectedRows = await scheduleService.updateSchedule(id, data);

        if (affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Không tìm thấy lịch học cần cập nhật!' 
            });
        }

        return res.status(200).json({ 
            success: true, 
            message: 'Cập nhật lịch học thành công!' 
        });

    } catch (error) {
        console.error('Lỗi khi cập nhật lịch học:', error.message);
        next(error); // Bắn lỗi ra middleware xử lý lỗi chung trong app.js
    }
};

const deleteSchedule = (req, res, next) => handleResponse(res, next, () => scheduleService.deleteSchedule(req.params.id));

// ĐẶT PHÒNG
const getBookingRequests = (req, res, next) => handleResponse(res, next, async () => ({ success: true, data: await scheduleService.getBookingRequests() }));
const updateBookingStatus = (req, res, next) => handleResponse(res, next, () => scheduleService.updateBookingStatus(req.params.id, req.body.trang_thai_duyet));

// API mới
const getScheduleList = async (req, res, next) => {
  try {
    const { tuan_hoc, lop_hoc_id, ma_nguoi_dung, current_date } = req.query;
    const results = await scheduleService.getSchedule(tuan_hoc, lop_hoc_id, ma_nguoi_dung, current_date);
    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

const bookRoom = async (req, res, next) => {
  try {
    const { ngay_yeu_cau, ma_nguoi_dung, ma_phong, ma_ca, tiet_bat_dau, tiet_ket_thuc, muc_dich } = req.body;
    const created = await scheduleService.bookRoom({
      ngay_yeu_cau,
      nguoi_dung_id: ma_nguoi_dung,
      phong_may_id: ma_phong,
      ma_ca,
      tiet_bat_dau,
      tiet_ket_thuc,
      muc_dich
    });

    if (!created) return res.status(500).json({ success: false, message: 'Không thể tạo yêu cầu đặt phòng' });

    // ========================================================
    // 🚀 BẮN THÔNG BÁO CHO ADMIN KHI GV MƯỢN PHÒNG KHẨN CẤP
    // ========================================================
    try {
        const [roomInfo] = await db.promise().query('SELECT ten_phong FROM phong_may WHERE id=?', [ma_phong]);
        const [gvInfo] = await db.promise().query('SELECT ho_ten FROM nguoi_dung WHERE id=?', [ma_nguoi_dung]);

        const tenPhong = roomInfo.length > 0 ? roomInfo[0].ten_phong : 'Không xác định';
        const tenGV = gvInfo.length > 0 ? gvInfo[0].ho_ten : 'Không xác định';

        // Ép format ngày lại cho dễ đọc
        const dateObj = new Date(ngay_yeu_cau);
        const formattedDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;

        await notificationService.sendToAllAdmins(
            'Yêu cầu mượn phòng mới!',
            `Giảng viên ${tenGV} vừa yêu cầu mượn ${tenPhong} vào ngày ${formattedDate}. Vui lòng kiểm tra và duyệt.`,
            'booking_request'
        );
    } catch (notifErr) {
        console.error("Lỗi gửi thông báo mượn phòng:", notifErr);
    }

    res.status(201).json({ success: true, message: 'Đăng ký mượn phòng thành công, đang chờ duyệt!', id: created.id, data: created });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { trang_thai_duyet, ma_nguoi_duyet } = req.body;
    if (!trang_thai_duyet) return res.status(400).json({ success: false, message: 'Thiếu trang_thai_duyet' });

    const affected = await scheduleService.updateBookingStatus(id, trang_thai_duyet, ma_nguoi_duyet);
    if (affected === 0) return res.status(404).json({ success: false, message: 'Yêu cầu đặt phòng không tồn tại' });

    // ========================================================
    // 🚀 BẮN THÔNG BÁO CHO GIẢNG VIÊN KHI ADMIN DUYỆT
    // ========================================================
    try {
        if (trang_thai_duyet === 'approved' || trang_thai_duyet === 'rejected') {
            // Lấy ID người dùng (Giảng viên) và tên phòng từ phiếu mượn
            const [bookingInfo] = await db.promise().query(`
                SELECT dpm.ngay_dat, pm.ten_phong, gv.ma_nguoi_dung
                FROM dat_phong_may dpm
                JOIN phong_may pm ON dpm.ma_phong = pm.id
                JOIN giang_vien gv ON dpm.ma_giang_vien = gv.id
                WHERE dpm.id = ?
            `, [id]);

            if (bookingInfo.length > 0) {
                const { ngay_dat, ten_phong, ma_nguoi_dung } = bookingInfo[0];
                const statusText = trang_thai_duyet === 'approved' ? 'chấp thuận' : 'từ chối';
                
                const dateObj = new Date(ngay_dat);
                const formattedDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;

                await notificationService.sendToSpecificUser(
                    ma_nguoi_dung, 
                    `Yêu cầu mượn phòng đã bị ${statusText}`,
                    `Yêu cầu mượn ${ten_phong} ngày ${formattedDate} của bạn đã bị Admin ${statusText}.`,
                    'booking_status'
                );
            }
        }
    } catch (notifErr) {
        console.error("Lỗi gửi thông báo duyệt phòng:", notifErr);
    }

    res.json({ success: true, message: 'Cập nhật trạng thái đặt phòng thành công' });
  } catch (error) {
    next(error);
  }
};

const getBookingsList = async (req, res, next) => {
  try {
    const { trang_thai_duyet, ma_phong, ma_giang_vien, nguoi_dung_id, page, limit } = req.query;
    const opts = { trang_thai_duyet, ma_phong, ma_giang_vien, nguoi_dung_id, page, limit };
    const rows = await scheduleService.getBookings(opts);
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};

const deleteBooking = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const affectedRows = await scheduleService.deleteBooking(bookingId);

    if (affectedRows > 0) {
      res.json({ success: true, message: 'Đã hủy yêu cầu mượn phòng!' });
    } else {
      res.status(400).json({ success: false, message: 'Không thể hủy (yêu cầu đã được duyệt hoặc không tồn tại).' });
    }
  } catch (error) {
    next(error);
  }
};

const getStudentSchedule = async (req, res) => {
    try {
        const userId = req.query.ma_nguoi_dung || (req.user && req.user.id);
        
        if (!userId) {
            return res.status(400).json({ success: false, message: 'Thiếu tham số ma_nguoi_dung!' });
        }

        const schedules = await scheduleService.getStudentScheduleData(userId);
        
        res.status(200).json({ 
            success: true, 
            data: schedules 
        });
    } catch (error) {
        console.error("Lỗi getStudentSchedule:", error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
    }
};

const getScheduleDetail = async (req, res, next) => {
    try {
        const detail = await scheduleService.getScheduleDetail(req.params.id);
        res.status(200).json({ success: true, data: detail });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getBookingRequests,
  updateBookingStatus,
  getScheduleList,
  bookRoom,
  updateBooking,
  getBookingsList,
  deleteBooking,
  getStudentSchedule,
  getScheduleDetail
};