const db = require('../config/db');

// Incidents - bao_cao_su_co
const listIncidents = async (opts = {}) => {
  const conn = db.promise();
  const { page, limit, filter, trang_thai } = opts;
  // Đã xóa bc.ma_phong khỏi SELECT và sửa JOIN để lấy phòng qua mt.ma_phong
  let sql = `SELECT bc.id, bc.tieu_de, bc.mo_ta, bc.loai_su_co, bc.muc_do, bc.trang_thai, bc.ma_may_tinh, bc.ma_thiet_bi, bc.created_at,
                    pm.ten_phong, mt.ma_may, tb.ten_thiet_bi
             FROM bao_cao_su_co bc
             LEFT JOIN may_tinh mt ON bc.ma_may_tinh = mt.id
             LEFT JOIN phong_may pm ON mt.ma_phong = pm.id
             LEFT JOIN thiet_bi tb ON bc.ma_thiet_bi = tb.id
             WHERE 1=1`;
             
  const params = [];
  if (trang_thai) { sql += ' AND bc.trang_thai = ?'; params.push(trang_thai); }
  if (filter) { sql += ' AND (bc.tieu_de LIKE ? OR bc.mo_ta LIKE ?)'; params.push(`%${filter}%`, `%${filter}%`); }
  sql += ' ORDER BY bc.created_at DESC';
  
  if (limit && Number(limit) > 0) {
    const l = Number(limit);
    const p = page && Number(page) > 0 ? Number(page) : 1;
    const offset = (p - 1) * l;
    sql += ' LIMIT ? OFFSET ?'; params.push(l, offset);
  }
  const [rows] = await conn.query(sql, params);
  return rows;
};

const getIncidentById = async (id) => {
  const [rows] = await db.promise().query('SELECT * FROM bao_cao_su_co WHERE id = ?', [id]);
  return rows[0] || null;
};

const createIncident = async (data) => {
  const conn = db.promise();
  // Đã xóa ma_phong vì bảng không còn cột này
  const { ma_nguoi_bao_cao, ma_may_tinh, ma_thiet_bi, loai_su_co, tieu_de, mo_ta, muc_do = 'normal', trang_thai = 'open' } = data;
  const sql = `INSERT INTO bao_cao_su_co (ma_nguoi_bao_cao, ma_may_tinh, ma_thiet_bi, loai_su_co, tieu_de, mo_ta, muc_do, trang_thai, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
  const [result] = await conn.query(sql, [ma_nguoi_bao_cao, ma_may_tinh || null, ma_thiet_bi || null, loai_su_co, tieu_de, mo_ta, muc_do, trang_thai]);
  const insertId = result.insertId || null;
  if (insertId) return getIncidentById(insertId);
  return null;
};

const updateIncident = async (id, data) => {
  const conn = db.promise();
  const sets = [];
  const params = [];
  // Đã xóa ma_phong khỏi danh sách update
  ['ma_nguoi_bao_cao','ma_may_tinh','ma_thiet_bi','loai_su_co','tieu_de','mo_ta','muc_do','trang_thai'].forEach(k => {
    if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); }
  });
  if (sets.length === 0) return 0;
  params.push(id);
  const sql = `UPDATE bao_cao_su_co SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`;
  const [result] = await conn.query(sql, params);
  return result.affectedRows || 0;
};

const deleteIncident = async (id) => {
  const [result] = await db.promise().query('DELETE FROM bao_cao_su_co WHERE id = ?', [id]);
  return result.affectedRows || 0;
};

// Tickets - phieu_bao_tri (Giữ nguyên vì đã khớp)
const listTickets = async (opts = {}) => {
  const conn = db.promise();
  const { page, limit, filter, trang_thai } = opts;
  let sql = `SELECT pb.id, pb.ma_bao_cao_su_co, pb.ma_nguoi_phu_trach, pb.loai_bao_tri, pb.ngay_bat_dau, pb.ngay_ket_thuc, pb.chi_phi, pb.trang_thai, pb.created_at,
                    bc.tieu_de as tieu_de_bao_cao, nd.ho_ten as nguoi_phu_trach
             FROM phieu_bao_tri pb
             LEFT JOIN bao_cao_su_co bc ON pb.ma_bao_cao_su_co = bc.id
             LEFT JOIN nguoi_dung nd ON pb.ma_nguoi_phu_trach = nd.id
             WHERE 1=1`;
  const params = [];
  if (trang_thai) { sql += ' AND pb.trang_thai = ?'; params.push(trang_thai); }
  if (filter) { sql += ' AND (pb.loai_bao_tri LIKE ? OR bc.tieu_de LIKE ?)'; params.push(`%${filter}%`, `%${filter}%`); }
  sql += ' ORDER BY pb.created_at DESC';
  if (limit && Number(limit) > 0) {
    const l = Number(limit);
    const p = page && Number(page) > 0 ? Number(page) : 1;
    const offset = (p - 1) * l;
    sql += ' LIMIT ? OFFSET ?'; params.push(l, offset);
  }
  const [rows] = await conn.query(sql, params);
  return rows;
};

const getTicketById = async (id) => {
  const [rows] = await db.promise().query('SELECT * FROM phieu_bao_tri WHERE id = ?', [id]);
  return rows[0] || null;
};

const createTicket = async (data) => {
  const conn = db.promise();
  const { ma_bao_cao_su_co, ma_nguoi_phu_trach, loai_bao_tri, ngay_bat_dau, ngay_ket_thuc, cach_xu_ly, chi_phi = 0, trang_thai = 'pending' } = data;
  const sql = `INSERT INTO phieu_bao_tri (ma_bao_cao_su_co, ma_nguoi_phu_trach, loai_bao_tri, ngay_bat_dau, ngay_ket_thuc, cach_xu_ly, chi_phi, trang_thai, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
  const [result] = await conn.query(sql, [ma_bao_cao_su_co, ma_nguoi_phu_trach || null, loai_bao_tri, ngay_bat_dau || null, ngay_ket_thuc || null, cach_xu_ly || null, chi_phi, trang_thai]);
  const insertId = result.insertId || null;
  if (insertId) return getTicketById(insertId);
  return null;
};

const updateTicket = async (id, data) => {
  const conn = db.promise();
  const sets = [];
  const params = [];
  ['ma_bao_cao_su_co','ma_nguoi_phu_trach','loai_bao_tri','ngay_bat_dau','ngay_ket_thuc','cach_xu_ly','chi_phi','trang_thai'].forEach(k => {
    if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); }
  });
  if (sets.length === 0) return 0;
  params.push(id);
  const sql = `UPDATE phieu_bao_tri SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`;
  const [result] = await conn.query(sql, params);
  return result.affectedRows || 0;
};

const deleteTicket = async (id) => {
  const [result] = await db.promise().query('DELETE FROM phieu_bao_tri WHERE id = ?', [id]);
  return result.affectedRows || 0;
};

module.exports = {
  listIncidents, getIncidentById, createIncident, updateIncident, deleteIncident,
  listTickets, getTicketById, createTicket, updateTicket, deleteTicket
};