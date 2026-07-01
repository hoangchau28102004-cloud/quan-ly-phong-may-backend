const service = require('../services/scheduleService');

const handleResponse = async (res, next, action) => {
    try {
        const result = await action();
        res.json(result || { success: true, message: 'Thành công!' });
    } catch (err) { next(err); }
};

// LỊCH CHÍNH THỨC
const getSchedules = (req, res, next) => handleResponse(res, next, async () => ({ success: true, data: await service.getSchedules() }));
const createSchedule = (req, res, next) => handleResponse(res, next, () => service.createSchedule(req.body));
const updateSchedule = (req, res, next) => handleResponse(res, next, () => service.updateSchedule(req.params.id, req.body));
const deleteSchedule = (req, res, next) => handleResponse(res, next, () => service.deleteSchedule(req.params.id));

// ĐẶT PHÒNG
const getBookingRequests = (req, res, next) => handleResponse(res, next, async () => ({ success: true, data: await service.getBookingRequests() }));
const updateBookingStatus = (req, res, next) => handleResponse(res, next, () => service.updateBookingStatus(req.params.id, req.body.trang_thai_duyet));

// QUAN TRỌNG NHẤT LÀ ĐOẠN NÀY ĐỂ TRÁNH LỖI "UNDEFINED":
module.exports = {
    getSchedules, 
    createSchedule, 
    updateSchedule, 
    deleteSchedule,
    getBookingRequests, 
    updateBookingStatus
};