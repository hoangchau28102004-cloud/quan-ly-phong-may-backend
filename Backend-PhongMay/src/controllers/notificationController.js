const notificationService = require('../services/notificationService');

const getNotifications = async (req, res, next) => {
  try {
    const userId = req.query.ma_nguoi_dung || (req.user && req.user.id);

    if (!userId) {
      return res.status(400).json({ success: false, message: 'Thiếu tham số ma_nguoi_dung' });
    }

    const notifications = await notificationService.getNotificationsByUser(userId);
    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const notificationId = req.params.id;
    const userId = req.body.ma_nguoi_dung || req.query.ma_nguoi_dung || (req.user && req.user.id);

    if (!userId) {
      return res.status(400).json({ success: false, message: 'Thiếu tham số ma_nguoi_dung' });
    }

    const result = await notificationService.markAsRead(notificationId, userId);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo hoặc không có quyền' });
    }

    res.json({ success: true, message: 'Đã đánh dấu thông báo đã đọc' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
};
