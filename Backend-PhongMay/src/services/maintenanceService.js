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
const createIncidentReport = async (userId, machineCode, issueType, title, description) => {
    // 1. Dò tìm ID thực của máy tính từ mã chuỗi quét được
    const [machines] = await db.promise().query(
        `SELECT id FROM may_tinh WHERE ma_may = ? OR ma_qr = ? LIMIT 1`,
        [machineCode, machineCode]
    );

    if (machines.length === 0) {
        throw new Error('Mã máy tính này không tồn tại trong hệ thống!');
    }

    const realMachineId = machines[0].id;

    // 2. Insert vào DB với ID thực (khóa ngoại chuẩn số nguyên)
    const [result] = await db.promise().query(
        `INSERT INTO bao_cao_su_co 
        (ma_nguoi_bao_cao, ma_may_tinh, loai_su_co, tieu_de, mo_ta, muc_do, trang_thai) 
        VALUES (?, ?, ?, ?, ?, 'normal', 'open')`,
        [userId, realMachineId, issueType, title, description]
    );

    return result.insertId; 
};

const createIncident = async (data) => {
    // Bẫy log số 1: Kiểm tra xem code mới đã được chạy chưa
    console.log("🚀 [DEBUG] ĐANG CHẠY CODE MỚI - Dữ liệu từ Flutter gửi lên:", data);

    const { ma_nguoi_bao_cao, ma_may_tinh, loai_su_co, tieu_de, mo_ta, muc_do, trang_thai } = data;
    
    let realMachineId = null;

    // Xử lý triệt để: Chặn các ID rác như 0, '0', chuỗi rỗng
    if (ma_may_tinh !== undefined && ma_may_tinh !== null && ma_may_tinh !== '' && ma_may_tinh !== 0 && ma_may_tinh !== '0') {
        
        // Kiểm tra xem mã gửi lên là số (ID) hay chữ (Mã QR)
        const isNumeric = !isNaN(ma_may_tinh) && !isNaN(parseFloat(ma_may_tinh));
        let query = "";
        let params = [];

        if (isNumeric) {
            query = `SELECT id FROM may_tinh WHERE id = ? LIMIT 1`;
            params = [parseInt(ma_may_tinh)];
        } else {
            query = `SELECT id FROM may_tinh WHERE ma_may = ? OR ma_qr = ? LIMIT 1`;
            params = [ma_may_tinh, ma_may_tinh];
        }

        const [machines] = await db.promise().query(query, params);

        if (machines.length > 0) {
            realMachineId = machines[0].id;
            console.log("✅ [DEBUG] Tìm thấy ID máy tính hợp lệ trong CSDL:", realMachineId);
        } else {
            console.log("❌ [DEBUG] Mã rác! Không tìm thấy máy tính trong CSDL. Chặn lệnh INSERT.");
            throw new Error('NOT_FOUND_MACHINE');
        }
    } else {
         console.log("⚠️ [DEBUG] Không có mã máy tính được gửi lên, tiến hành lưu NULL");
    }

    const sql = `INSERT INTO bao_cao_su_co (ma_nguoi_bao_cao, ma_may_tinh, loai_su_co, tieu_de, mo_ta, muc_do, trang_thai, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`;
    
    await db.promise().query(sql, [ma_nguoi_bao_cao, realMachineId, loai_su_co, tieu_de, mo_ta, muc_do || 'normal', trang_thai || 'open']);
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

// Cập nhật phiếu bảo trì & Tự động tạo nhật ký
const updateTicket = async (id, data) => {
    const { ma_nguoi_phu_trach, loai_bao_tri, ngay_bat_dau, ngay_ket_thuc, cach_xu_ly, chi_phi, trang_thai } = data;
    
    // 1. Cập nhật phiếu bảo trì
    const sqlUpdate = `UPDATE phieu_bao_tri SET ma_nguoi_phu_trach=?, loai_bao_tri=?, ngay_bat_dau=?, ngay_ket_thuc=?, cach_xu_ly=?, chi_phi=?, trang_thai=?, updated_at=NOW() WHERE id=?`;
    await db.promise().query(sqlUpdate, [ma_nguoi_phu_trach || null, loai_bao_tri, ngay_bat_dau || null, ngay_ket_thuc || null, cach_xu_ly, chi_phi || 0, trang_thai, id]);

    // 2. AUTO-TRIGGER: Nếu trạng thái là 'completed', tự động lưu vào bảng nhat_ky_sua_chua
    if (trang_thai === 'completed') {
        // Lấy ma_may_tinh từ báo cáo sự cố liên kết với phiếu này
        const [ticketInfo] = await db.promise().query(`
            SELECT bc.ma_may_tinh 
            FROM phieu_bao_tri pb 
            JOIN bao_cao_su_co bc ON pb.ma_bao_cao_su_co = bc.id 
            WHERE pb.id = ?`, [id]);

        const maMayTinh = ticketInfo.length > 0 ? ticketInfo[0].ma_may_tinh : null;

        // Insert dữ liệu thực tế vào bảng nhat_ky_sua_chua
        const sqlInsertLog = `
            INSERT INTO nhat_ky_sua_chua 
            (ma_phieu_bao_tri, ma_may_tinh, ma_nguoi_sua, thoi_gian_sua, noi_dung_sua, ket_qua, chi_phi, created_at) 
            VALUES (?, ?, ?, NOW(), ?, 'Đã xử lý', ?, NOW())
        `;
        await db.promise().query(sqlInsertLog, [
            id, 
            maMayTinh, 
            ma_nguoi_phu_trach, 
            cach_xu_ly || loai_bao_tri, 
            chi_phi || 0
        ]);
    }
};

// Hàm mới: Lấy danh sách nhật ký sửa chữa hiển thị cho app
const getMaintenanceLogs = async () => {
    const sql = `
        SELECT nk.*, pb.loai_bao_tri, mt.ma_may, mt.ten_may, nd.ho_ten as nguoi_sua
        FROM nhat_ky_sua_chua nk
        LEFT JOIN phieu_bao_tri pb ON nk.ma_phieu_bao_tri = pb.id
        LEFT JOIN may_tinh mt ON nk.ma_may_tinh = mt.id
        LEFT JOIN nguoi_dung nd ON nk.ma_nguoi_sua = nd.id
        ORDER BY nk.created_at DESC
    `;
    const [rows] = await db.promise().query(sql);
    return rows;
};



const deleteTicket = async (id) => {
    await db.promise().query('DELETE FROM phieu_bao_tri WHERE id=?', [id]);
};

module.exports = { getIncidents, createIncident, updateIncident, deleteIncident, getMaintenanceTickets, createTicket, updateTicket, deleteTicket, createIncidentReport,getMaintenanceLogs };