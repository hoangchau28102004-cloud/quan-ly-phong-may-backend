const maintenanceService = require('../services/maintenanceService');

// Incidents
const listIncidents = async (req, res, next) => {
  try {
    const { page, limit, filter, trang_thai } = req.query;
    const rows = await maintenanceService.listIncidents({ page, limit, filter, trang_thai });
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

const getIncident = async (req, res, next) => {
  try {
    const { id } = req.params;
    const row = await maintenanceService.getIncidentById(id);
    if (!row) return res.status(404).json({ success: false, message: 'Báo cáo không tồn tại' });
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
};

const createIncident = async (req, res, next) => {
  try {
    const created = await maintenanceService.createIncident(req.body);
    if (!created) return res.status(500).json({ success: false, message: 'Không thể tạo báo cáo' });
    res.status(201).json({ success: true, message: 'Tạo báo cáo thành công', id: created.id, data: created });
  } catch (err) { next(err); }
};

const updateIncident = async (req, res, next) => {
  try {
    const { id } = req.params;
    const affected = await maintenanceService.updateIncident(id, req.body);
    if (affected === 0) return res.status(404).json({ success: false, message: 'Báo cáo không tồn tại hoặc không có thay đổi' });
    res.json({ success: true, message: 'Cập nhật báo cáo thành công' });
  } catch (err) { next(err); }
};

const deleteIncident = async (req, res, next) => {
  try {
    const { id } = req.params;
    const affected = await maintenanceService.deleteIncident(id);
    if (affected === 0) return res.status(404).json({ success: false, message: 'Báo cáo không tồn tại' });
    res.json({ success: true, message: 'Xóa báo cáo thành công' });
  } catch (err) { next(err); }
};

// Tickets
const listTickets = async (req, res, next) => {
  try {
    const { page, limit, filter, trang_thai } = req.query;
    const rows = await maintenanceService.listTickets({ page, limit, filter, trang_thai });
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

const getTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const row = await maintenanceService.getTicketById(id);
    if (!row) return res.status(404).json({ success: false, message: 'Phiếu không tồn tại' });
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
};

const createTicket = async (req, res, next) => {
  try {
    const created = await maintenanceService.createTicket(req.body);
    if (!created) return res.status(500).json({ success: false, message: 'Không thể tạo phiếu bảo trì' });
    res.status(201).json({ success: true, message: 'Tạo phiếu bảo trì thành công', id: created.id, data: created });
  } catch (err) { next(err); }
};

const updateTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const affected = await maintenanceService.updateTicket(id, req.body);
    if (affected === 0) return res.status(404).json({ success: false, message: 'Phiếu không tồn tại hoặc không có thay đổi' });
    res.json({ success: true, message: 'Cập nhật phiếu thành công' });
  } catch (err) { next(err); }
};

const deleteTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const affected = await maintenanceService.deleteTicket(id);
    if (affected === 0) return res.status(404).json({ success: false, message: 'Phiếu không tồn tại' });
    res.json({ success: true, message: 'Xóa phiếu thành công' });
  } catch (err) { next(err); }
};

module.exports = {
  listIncidents, getIncident, createIncident, updateIncident, deleteIncident,
  listTickets, getTicket, createTicket, updateTicket, deleteTicket
};
