const service = require('../services/maintenanceService');

const handleResponse = async (res, next, action) => {
    try { 
        const data = await action(); 
        res.json(data || { success: true, message: 'Thành công!' }); 
    } 
    catch (err) { next(err); }
};

// ================= BÁO CÁO SỰ CỐ =================
const getIncidents = (req, res, next) => handleResponse(res, next, async () => ({ success: true, data: await service.getIncidents() }));
const createIncident = async (req, res, next) => {
    try {
        await service.createIncident({ 
            ...req.body, 
            ma_nguoi_bao_cao: req.user?.id || req.body.ma_nguoi_bao_cao || 1 
        });
        res.status(200).json({ success: true, message: 'Báo cáo sự cố thành công!' });
    } catch (error) {
        // Bắt chính xác lỗi ném ra từ Service
        if (error.message === 'NOT_FOUND_MACHINE') {
            return res.status(404).json({ 
                success: false, 
                message: 'Mã quét không hợp lệ. Máy tính không tồn tại trong hệ thống!' 
            });
        }
        
        console.error("Lỗi backend:", error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ!' });
    }
};

// Đồng bộ hóa luôn endpoint reportIncident nhỡ Flutter gọi nhầm đường dẫn
const reportIncident = async (req, res, next) => {
    if (req.body.machineCode) {
        req.body.ma_may_tinh = req.body.machineCode;
    }
    return createIncident(req, res, next);
};
const updateIncident = (req, res, next) => handleResponse(res, next, () => service.updateIncident(req.params.id, req.body));
const deleteIncident = (req, res, next) => handleResponse(res, next, () => service.deleteIncident(req.params.id));

// ================= PHIẾU BẢO TRÌ =================
const getTickets = (req, res, next) => handleResponse(res, next, async () => ({ success: true, data: await service.getMaintenanceTickets() }));
const createTicket = (req, res, next) => handleResponse(res, next, () => service.createTicket(req.body));
const updateTicket = (req, res, next) => handleResponse(res, next, () => service.updateTicket(req.params.id, req.body));
const deleteTicket = (req, res, next) => handleResponse(res, next, () => service.deleteTicket(req.params.id));

const getLogs = (req, res, next) => handleResponse(res, next, async () => ({ success: true, data: await service.getMaintenanceLogs() }));
// QUAN TRỌNG NHẤT LÀ ĐÂY (XUẤT HÀM ĐỂ BÊN ROUTE NHẬN ĐƯỢC)
module.exports = { 
    getIncidents, 
    createIncident, 
    updateIncident, 
    deleteIncident, 
    getTickets, 
    createTicket, 
    updateTicket, 
    deleteTicket ,
    reportIncident ,
    getLogs
};