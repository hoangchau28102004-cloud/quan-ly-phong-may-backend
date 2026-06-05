const db = require('../config/db');

// Rooms (phong_may)
const listRooms = async (opts = {}) => {
  const conn = db.promise();
  const { page, limit, filter } = opts;
  let sql = 'SELECT id, ma_phong, ten_phong, suc_chua, trang_thai, mo_ta, created_at FROM phong_may WHERE 1=1';
  const params = [];
  if (filter) { sql += ' AND (ten_phong LIKE ? OR ma_phong LIKE ?)'; params.push(`%${filter}%`, `%${filter}%`); }
  sql += ' ORDER BY created_at DESC';
  if (limit && Number(limit) > 0) {
    const l = Number(limit);
    const p = page && Number(page) > 0 ? Number(page) : 1;
    const offset = (p - 1) * l;
    sql += ' LIMIT ? OFFSET ?'; params.push(l, offset);
  }
  const [rows] = await conn.query(sql, params);
  return rows;
};

const getRoomById = async (id) => {
  const conn = db.promise();
  const [rows] = await conn.query('SELECT id, ma_phong, ten_phong, suc_chua, trang_thai, mo_ta, created_at FROM phong_may WHERE id = ?', [id]);
  return rows[0] || null;
};

const createRoom = async (data) => {
  const conn = db.promise();
  const { ma_phong, ten_phong, suc_chua = 0, mo_ta = null, trang_thai = 'active' } = data;
  const sql = 'INSERT INTO phong_may (ma_phong, ten_phong, suc_chua, mo_ta, trang_thai, created_at) VALUES (?, ?, ?, ?, ?, NOW())';
  const [result] = await conn.query(sql, [ma_phong, ten_phong, suc_chua, mo_ta, trang_thai]);
  const insertId = result.insertId || result.insert_id || null;
  if (insertId) return getRoomById(insertId);
  return null;
};

const updateRoom = async (id, data) => {
  const conn = db.promise();
  const sets = [];
  const params = [];
  if (data.ma_phong !== undefined) { sets.push('ma_phong = ?'); params.push(data.ma_phong); }
  if (data.ten_phong !== undefined) { sets.push('ten_phong = ?'); params.push(data.ten_phong); }
  if (data.suc_chua !== undefined) { sets.push('suc_chua = ?'); params.push(data.suc_chua); }
  if (data.trang_thai !== undefined) { sets.push('trang_thai = ?'); params.push(data.trang_thai); }
  if (data.mo_ta !== undefined) { sets.push('mo_ta = ?'); params.push(data.mo_ta); }
  if (sets.length === 0) return 0;
  params.push(id);
  const sql = `UPDATE phong_may SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`;
  const [result] = await conn.query(sql, params);
  return result.affectedRows || 0;
};

const deleteRoom = async (id) => {
  const conn = db.promise();
  const [result] = await conn.query('DELETE FROM phong_may WHERE id = ?', [id]);
  return result.affectedRows || 0;
};

// Configs (cau_hinh_may_tinh)
const listConfigs = async () => {
  const [rows] = await db.promise().query('SELECT * FROM cau_hinh_may_tinh ORDER BY id');
  return rows;
};

const getConfigById = async (id) => {
  const [rows] = await db.promise().query('SELECT * FROM cau_hinh_may_tinh WHERE id = ?', [id]);
  return rows[0] || null;
};

const createConfig = async (data) => {
  const { bo_xu_ly, ram, o_cung, card_do_hoa, man_hinh, he_dieu_hanh, ghi_chu } = data;
  const sql = `INSERT INTO cau_hinh_may_tinh (bo_xu_ly, ram, o_cung, card_do_hoa, man_hinh, he_dieu_hanh, ghi_chu, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`;
  const [result] = await db.promise().query(sql, [bo_xu_ly, ram, o_cung, card_do_hoa, man_hinh, he_dieu_hanh, ghi_chu]);
  const insertId = result.insertId || null;
  if (insertId) return getConfigById(insertId);
  return null;
};

const updateConfig = async (id, data) => {
  const conn = db.promise();
  const sets = [];
  const params = [];
  ['bo_xu_ly','ram','o_cung','card_do_hoa','man_hinh','he_dieu_hanh','ghi_chu'].forEach(k => {
    if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); }
  });
  if (sets.length === 0) return 0;
  params.push(id);
  const sql = `UPDATE cau_hinh_may_tinh SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`;
  const [result] = await conn.query(sql, params);
  return result.affectedRows || 0;
};

const deleteConfig = async (id) => {
  const [result] = await db.promise().query('DELETE FROM cau_hinh_may_tinh WHERE id = ?', [id]);
  return result.affectedRows || 0;
};

// Computers (may_tinh)
const listComputers = async (opts = {}) => {
  const conn = db.promise();
  const { page, limit, filter } = opts;
  let sql = `SELECT mt.id, mt.ma_may, mt.ma_phong as phong_id, mt.ma_cau_hinh as cau_hinh_id, mt.ma_qr, mt.dia_chi_ip, mt.dia_chi_mac, mt.trang_thai, mt.created_at,
                      pm.ten_phong, pm.ma_phong as phong_code,
                      ch.bo_xu_ly, ch.ram, ch.o_cung, ch.card_do_hoa, ch.he_dieu_hanh
             FROM may_tinh mt
             LEFT JOIN phong_may pm ON mt.ma_phong = pm.id
             LEFT JOIN cau_hinh_may_tinh ch ON mt.ma_cau_hinh = ch.id
             WHERE 1=1`;
  const params = [];
  if (filter) { sql += ' AND (mt.ma_may LIKE ? OR pm.ten_phong LIKE ?)'; params.push(`%${filter}%`, `%${filter}%`); }
  sql += ' ORDER BY mt.created_at DESC';
  if (limit && Number(limit) > 0) {
    const l = Number(limit);
    const p = page && Number(page) > 0 ? Number(page) : 1;
    const offset = (p - 1) * l;
    sql += ' LIMIT ? OFFSET ?'; params.push(l, offset);
  }
  const [rows] = await conn.query(sql, params);
  return rows;
};

const getComputerById = async (id) => {
  const [rows] = await db.promise().query('SELECT * FROM may_tinh WHERE id = ?', [id]);
  return rows[0] || null;
};

const createComputer = async (data) => {
  const conn = db.promise();
  // Accept aliases: phong_id | phong_may_id | ma_phong
  const ma_phong = data.phong_id || data.phong_may_id || data.ma_phong || data.ma_phong_id || null;
  const ma_cau_hinh = data.cau_hinh_id || data.ma_cau_hinh || null;
  const { ma_may, ma_qr = null, dia_chi_ip = null, dia_chi_mac = null, trang_thai = 'active', ghi_chu = null } = data;
  const sql = `INSERT INTO may_tinh (ma_phong, ma_cau_hinh, ma_may, ma_qr, dia_chi_ip, dia_chi_mac, trang_thai, ghi_chu, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
  const [result] = await conn.query(sql, [ma_phong, ma_cau_hinh, ma_may, ma_qr, dia_chi_ip, dia_chi_mac, trang_thai, ghi_chu]);
  const insertId = result.insertId || null;
  if (insertId) return getComputerById(insertId);
  return null;
};

const updateComputer = async (id, data) => {
  const conn = db.promise();
  const sets = [];
  const params = [];
  if (data.ma_may !== undefined) { sets.push('ma_may = ?'); params.push(data.ma_may); }
  if (data.ma_phong !== undefined) { sets.push('ma_phong = ?'); params.push(data.ma_phong); }
  if (data.ma_cau_hinh !== undefined) { sets.push('ma_cau_hinh = ?'); params.push(data.ma_cau_hinh); }
  if (data.dia_chi_ip !== undefined) { sets.push('dia_chi_ip = ?'); params.push(data.dia_chi_ip); }
  if (data.dia_chi_mac !== undefined) { sets.push('dia_chi_mac = ?'); params.push(data.dia_chi_mac); }
  if (data.trang_thai !== undefined) { sets.push('trang_thai = ?'); params.push(data.trang_thai); }
  if (data.ghi_chu !== undefined) { sets.push('ghi_chu = ?'); params.push(data.ghi_chu); }
  if (sets.length === 0) return 0;
  params.push(id);
  const sql = `UPDATE may_tinh SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`;
  const [result] = await conn.query(sql, params);
  return result.affectedRows || 0;
};

const deleteComputer = async (id) => {
  const [result] = await db.promise().query('DELETE FROM may_tinh WHERE id = ?', [id]);
  return result.affectedRows || 0;
};

module.exports = {
  // rooms
  listRooms, getRoomById, createRoom, updateRoom, deleteRoom,
  // configs
  listConfigs, getConfigById, createConfig, updateConfig, deleteConfig,
  // computers
  listComputers, getComputerById, createComputer, updateComputer, deleteComputer
};
