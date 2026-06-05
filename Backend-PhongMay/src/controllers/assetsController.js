const assetsService = require('../services/assetsService');

// Rooms
const listRooms = async (req, res, next) => {
  try {
    const { page, limit, filter } = req.query;
    const rows = await assetsService.listRooms({ page, limit, filter });
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

const getRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const row = await assetsService.getRoomById(id);
    if (!row) return res.status(404).json({ success: false, message: 'Phòng không tồn tại' });
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
};

const createRoom = async (req, res, next) => {
  try {
    const { ma_phong, ten_phong, suc_chua, mo_ta, trang_thai } = req.body;
    if (!ma_phong || !ten_phong) return res.status(400).json({ success: false, message: 'Thiếu ma_phong hoặc ten_phong' });
    const created = await assetsService.createRoom({ ma_phong, ten_phong, suc_chua, mo_ta, trang_thai });
    res.status(201).json({ success: true, message: 'Tạo phòng thành công', id: created.id, data: created });
  } catch (err) { next(err); }
};

const updateRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const affected = await assetsService.updateRoom(id, req.body);
    if (affected === 0) return res.status(404).json({ success: false, message: 'Phòng không tồn tại hoặc không có thay đổi' });
    res.json({ success: true, message: 'Cập nhật phòng thành công' });
  } catch (err) { next(err); }
};

const deleteRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const affected = await assetsService.deleteRoom(id);
    if (affected === 0) return res.status(404).json({ success: false, message: 'Phòng không tồn tại' });
    res.json({ success: true, message: 'Xóa phòng thành công' });
  } catch (err) { next(err); }
};

// Configs
const listConfigs = async (req, res, next) => {
  try {
    const rows = await assetsService.listConfigs();
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

const createConfig = async (req, res, next) => {
  try {
    const created = await assetsService.createConfig(req.body);
    res.status(201).json({ success: true, message: 'Tạo cấu hình thành công', id: created.id, data: created });
  } catch (err) { next(err); }
};

const updateConfig = async (req, res, next) => {
  try {
    const { id } = req.params;
    const affected = await assetsService.updateConfig(id, req.body);
    if (affected === 0) return res.status(404).json({ success: false, message: 'Cấu hình không tồn tại hoặc không có thay đổi' });
    res.json({ success: true, message: 'Cập nhật cấu hình thành công' });
  } catch (err) { next(err); }
};

const deleteConfig = async (req, res, next) => {
  try {
    const { id } = req.params;
    const affected = await assetsService.deleteConfig(id);
    if (affected === 0) return res.status(404).json({ success: false, message: 'Cấu hình không tồn tại' });
    res.json({ success: true, message: 'Xóa cấu hình thành công' });
  } catch (err) { next(err); }
};

// Computers
const listComputers = async (req, res, next) => {
  try {
    const { page, limit, filter } = req.query;
    const rows = await assetsService.listComputers({ page, limit, filter });
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

const getComputer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const row = await assetsService.getComputerById(id);
    if (!row) return res.status(404).json({ success: false, message: 'Máy không tồn tại' });
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
};

const createComputer = async (req, res, next) => {
  try {
    const created = await assetsService.createComputer(req.body);
    if (!created) return res.status(500).json({ success: false, message: 'Không thể tạo máy tính' });
    res.status(201).json({ success: true, message: 'Tạo máy tính thành công', id: created.id, data: created });
  } catch (err) { next(err); }
};

const updateComputer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const affected = await assetsService.updateComputer(id, req.body);
    if (affected === 0) return res.status(404).json({ success: false, message: 'Máy không tồn tại hoặc không có thay đổi' });
    res.json({ success: true, message: 'Cập nhật máy thành công' });
  } catch (err) { next(err); }
};

const deleteComputer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const affected = await assetsService.deleteComputer(id);
    if (affected === 0) return res.status(404).json({ success: false, message: 'Máy không tồn tại' });
    res.json({ success: true, message: 'Xóa máy thành công' });
  } catch (err) { next(err); }
};

module.exports = {
  listRooms, getRoom, createRoom, updateRoom, deleteRoom,
  listConfigs, createConfig, updateConfig, deleteConfig,
  listComputers, getComputer, createComputer, updateComputer, deleteComputer
};
