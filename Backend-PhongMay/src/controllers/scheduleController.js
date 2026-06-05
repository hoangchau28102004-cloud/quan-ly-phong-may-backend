const scheduleService = require('../services/scheduleService');

const getScheduleList = async (req, res, next) => {
  try {
    // Query params tên mới: `tuan_hoc`, `ma_lop`, `ma_nguoi_dung`
    const { tuan_hoc, ma_lop, ma_nguoi_dung } = req.query;
    const results = await scheduleService.getSchedule(tuan_hoc, ma_lop, ma_nguoi_dung);
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

const bookRoom = async (req, res, next) => {
  try {
    // Body tên mới: `ngay_yeu_cau`, `ma_nguoi_dung`, `ma_phong`
    const { ngay_yeu_cau, ma_nguoi_dung, ma_phong } = req.body;
    const created = await scheduleService.bookRoom({ ngay_yeu_cau, nguoi_dung_id: ma_nguoi_dung, phong_may_id: ma_phong });
    if (!created) return res.status(500).json({ success: false, message: 'Không thể tạo yêu cầu đặt phòng' });
    res.status(201).json({ success: true, message: 'Đăng ký mượn phòng thành công, đang chờ duyệt!', id: created.id, data: created });
  } catch (error) {
    next(error);
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
    const { trang_thai_duyet, ma_phong, ma_giang_vien, page, limit } = req.query;
    const opts = { trang_thai_duyet, ma_phong, ma_giang_vien, page, limit };
    const rows = await scheduleService.getBookings(opts);
    res.json({ success: true, data: rows });
  } catch (error) { next(error); }
};

module.exports = { getScheduleList, bookRoom, updateBooking, getBookingsList };