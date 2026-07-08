const scheduleService = require('../services/scheduleService');

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
const createSchedule = (req, res, next) => handleResponse(res, next, () => scheduleService.createSchedule(req.body));
const updateSchedule = (req, res, next) => handleResponse(res, next, () => scheduleService.updateSchedule(req.params.id, req.body));
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
        // 🚀 FIX LỖI Ở ĐÂY: Lấy ID từ Query Param do Flutter gửi (VD: ?ma_nguoi_dung=3)
        // Nếu req.user có tồn tại thì xài, không thì fallback sang req.query
        const userId = req.query.ma_nguoi_dung || (req.user && req.user.id);
        
        // Chốt chặn an toàn: Lỡ Flutter quên gửi ID thì chửi khéo chứ không sập server
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