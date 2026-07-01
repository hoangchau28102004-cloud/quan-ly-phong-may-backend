const db = require('../config/db');

// ================= BÁO CÁO SỰ CỐ =================
const getIncidents = async () => {
    const sql = `
        SELECT bc.*, nd.ho_ten as nguoi_bao_cao, mt.ten_may, pm.ten_phong
        FROM bao_cao_su_co bc
        LEFT JOIN nguoi_dung nd ON bc.ma_nguoi_bao_cao = nd.id
        LEFT JOIN may_tinh mt ON bc.ma_may_tinh = mt.id
        LEFT JOIN phong_may pm ON mt.ma_phong = pm.id
        ORDER BY bc.created_at DESC
    `;
    const [rows] = await db.promise().query(sql);
    return rows;
};

const createIncident = async (data) => {
    const { ma_nguoi_bao_cao, ma_may_tinh, loai_su_co, tieu_de, mo_ta, muc_do, trang_thai } = data;
    const sql = `INSERT INTO bao_cao_su_co (ma_nguoi_bao_cao, ma_may_tinh, loai_su_co, tieu_de, mo_ta, muc_do, trang_thai, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`;
    await db.promise().query(sql, [ma_nguoi_bao_cao, ma_may_tinh || null, loai_su_co, tieu_de, mo_ta, muc_do || 'normal', trang_thai || 'open']);
};

const updateIncident = async (id, data) => {
    const { ma_may_tinh, loai_su_co, tieu_de, mo_ta, muc_do, trang_thai } = data;
    const sql = `UPDATE bao_cao_su_co SET ma_may_tinh=?, loai_su_co=?, tieu_de=?, mo_ta=?, muc_do=?, trang_thai=?, updated_at=NOW() WHERE id=?`;
    await db.promise().query(sql, [ma_may_tinh || null, loai_su_co, tieu_de, mo_ta, muc_do, trang_thai, id]);
};

const deleteIncident = async (id) => {
    await db.promise().query('DELETE FROM bao_cao_su_co WHERE id=?', [id]);
};

// ================= PHIẾU BẢO TRÌ =================
const getMaintenanceTickets = async () => {
    const sql = `
        SELECT p.*, bc.tieu_de as ten_su_co, nd.ho_ten as nguoi_phu_trach
        FROM phieu_bao_tri p
        LEFT JOIN bao_cao_su_co bc ON p.ma_bao_cao_su_co = bc.id
        LEFT JOIN nguoi_dung nd ON p.ma_nguoi_phu_trach = nd.id
        ORDER BY p.created_at DESC
    `;
    const [rows] = await db.promise().query(sql);
    return rows;
};

const createTicket = async (data) => {
    const { ma_bao_cao_su_co, ma_nguoi_phu_trach, loai_bao_tri, ngay_bat_dau, ngay_ket_thuc, cach_xu_ly, chi_phi, trang_thai } = data;
    const sql = `INSERT INTO phieu_bao_tri (ma_bao_cao_su_co, ma_nguoi_phu_trach, loai_bao_tri, ngay_bat_dau, ngay_ket_thuc, cach_xu_ly, chi_phi, trang_thai, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
    await db.promise().query(sql, [ma_bao_cao_su_co, ma_nguoi_phu_trach || null, loai_bao_tri, ngay_bat_dau || null, ngay_ket_thuc || null, cach_xu_ly, chi_phi || 0, trang_thai || 'pending']);
};

const updateTicket = async (id, data) => {
    const { ma_nguoi_phu_trach, loai_bao_tri, ngay_bat_dau, ngay_ket_thuc, cach_xu_ly, chi_phi, trang_thai } = data;
    const sql = `UPDATE phieu_bao_tri SET ma_nguoi_phu_trach=?, loai_bao_tri=?, ngay_bat_dau=?, ngay_ket_thuc=?, cach_xu_ly=?, chi_phi=?, trang_thai=?, updated_at=NOW() WHERE id=?`;
    await db.promise().query(sql, [ma_nguoi_phu_trach || null, loai_bao_tri, ngay_bat_dau || null, ngay_ket_thuc || null, cach_xu_ly, chi_phi || 0, trang_thai, id]);
};

const deleteTicket = async (id) => {
    await db.promise().query('DELETE FROM phieu_bao_tri WHERE id=?', [id]);
};

module.exports = { getIncidents, createIncident, updateIncident, deleteIncident, getMaintenanceTickets, createTicket, updateTicket, deleteTicket };