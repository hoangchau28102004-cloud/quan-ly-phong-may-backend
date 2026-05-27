const scheduleService = require('../services/scheduleService');

const getScheduleList = async (req, res, next) => {
  try {
    const { tuan_hoc, lop_hoc_id, nguoi_dung_id } = req.query;
    const results = await scheduleService.getSchedule(tuan_hoc, lop_hoc_id, nguoi_dung_id);
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

const bookRoom = async (req, res, next) => {
  try {
    const { ngay_yeu_cau, nguoi_dung_id, phong_may_id } = req.body;
    const result = await scheduleService.bookRoom({ ngay_yeu_cau, nguoi_dung_id, phong_may_id });
    res.status(201).json({ success: true, message: 'Đăng ký mượn phòng thành công, đang chờ duyệt!' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getScheduleList, bookRoom };