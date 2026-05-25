const ScheduleModel = require('../models/schedule.model');

const scheduleController = {
  // Controller lấy danh sách lịch học
  getScheduleList: (req, res) => {
    const { tuan_hoc, lop_hoc_id, nguoi_dung_id } = req.query;

    ScheduleModel.getSchedule(tuan_hoc, lop_hoc_id, nguoi_dung_id, (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Lỗi truy vấn CSDL', error: err.message });
      }
      res.status(200).json({ success: true, data: results });
    });
  },

  // Controller xử lý đăng ký phòng
  bookRoom: (req, res) => {
    const bookingData = {
      ngay_yeu_cau: req.body.ngay_yeu_cau,
      nguoi_dung_id: req.body.nguoi_dung_id,
      phong_may_id: req.body.phong_may_id
    };

    ScheduleModel.insertRoomBooking(bookingData, (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Lỗi khi đăng ký phòng', error: err.message });
      }
      res.status(201).json({ success: true, message: 'Đăng ký mượn phòng thành công, đang chờ duyệt!' });
    });
  }
};

module.exports = scheduleController;