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
const createIncident = (req, res, next) => handleResponse(res, next, () => service.createIncident({ ...req.body, ma_nguoi_bao_cao: req.user?.id || 1 })); 
const updateIncident = (req, res, next) => handleResponse(res, next, () => service.updateIncident(req.params.id, req.body));
const deleteIncident = (req, res, next) => handleResponse(res, next, () => service.deleteIncident(req.params.id));

// ================= PHIẾU BẢO TRÌ =================
const getTickets = (req, res, next) => handleResponse(res, next, async () => ({ success: true, data: await service.getMaintenanceTickets() }));
const createTicket = (req, res, next) => handleResponse(res, next, () => service.createTicket(req.body));
const updateTicket = (req, res, next) => handleResponse(res, next, () => service.updateTicket(req.params.id, req.body));
const deleteTicket = (req, res, next) => handleResponse(res, next, () => service.deleteTicket(req.params.id));

// QUAN TRỌNG NHẤT LÀ ĐÂY (XUẤT HÀM ĐỂ BÊN ROUTE NHẬN ĐƯỢC)
module.exports = { 
    getIncidents, 
    createIncident, 
    updateIncident, 
    deleteIncident, 
    getTickets, 
    createTicket, 
    updateTicket, 
    deleteTicket 
};