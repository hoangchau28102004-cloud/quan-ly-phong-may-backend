const db = require('../config/db');
// 🚀 IMPORT SERVICE THÔNG BÁO TUI VỪA CHỈ ÔNG TẠO LÚC NÃY
const notificationService = require('../services/notificationService'); 

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
        `SELECT id, ten_may, ma_phong FROM may_tinh WHERE ma_may = ? OR ma_qr = ? LIMIT 1`,
        [machineCode, machineCode]
    );

    if (machines.length === 0) {
        throw new Error('Mã máy tính này không tồn tại trong hệ thống!');
    }

    const realMachineId = machines[0].id;

    // 2. Insert vào DB với ID thực
    const [result] = await db.promise().query(
        `INSERT INTO bao_cao_su_co 
        (ma_nguoi_bao_cao, ma_may_tinh, loai_su_co, tieu_de, mo_ta, muc_do, trang_thai, created_at) 
        VALUES (?, ?, ?, ?, ?, 'normal', 'open', NOW())`,
        [userId, realMachineId, issueType, title, description]
    );

    // 🚀 3. TỰ ĐỘNG BÁO CHO ADMIN KHI SINH VIÊN/GIẢNG VIÊN TẠO SỰ CỐ TRÊN APP MOBILE
    const [info] = await db.promise().query(`
        SELECT mt.ten_may, pm.ten_phong, nd.ho_ten 
        FROM may_tinh mt 
        JOIN phong_may pm ON mt.ma_phong = pm.id 
        JOIN nguoi_dung nd ON nd.id = ?
        WHERE mt.id = ?
    `, [userId, realMachineId]);

    if (info.length > 0) {
        await notificationService.sendToAllAdmins(
            'Sự cố phòng máy mới!',
            `Tài khoản ${info[0].ho_ten} vừa báo lỗi (${issueType}) trên máy [${info[0].ten_may}] tại [${info[0].ten_phong}].`,
            'incident'
        );
    }

    return result.insertId; 
};

const createIncident = async (data) => {
    console.log("🚀 [DEBUG] ĐANG CHẠY CODE MỚI - Dữ liệu từ Flutter gửi lên:", data);

    const { ma_nguoi_bao_cao, ma_may_tinh, loai_su_co, tieu_de, mo_ta, muc_do, trang_thai } = data;
    let realMachineId = null;

    if (ma_may_tinh !== undefined && ma_may_tinh !== null && ma_may_tinh !== '' && ma_may_tinh !== 0 && ma_may_tinh !== '0') {
        const isNumeric = !isNaN(ma_may_tinh) && !isNaN(parseFloat(ma_may_tinh));
        let query = isNumeric ? `SELECT id FROM may_tinh WHERE id = ? LIMIT 1` : `SELECT id FROM may_tinh WHERE ma_may = ? OR ma_qr = ? LIMIT 1`;
        let params = isNumeric ? [parseInt(ma_may_tinh)] : [ma_may_tinh, ma_may_tinh];

        const [machines] = await db.promise().query(query, params);

        if (machines.length > 0) {
            realMachineId = machines[0].id;
        } else {
            throw new Error('NOT_FOUND_MACHINE');
        }
    }

    const sql = `INSERT INTO bao_cao_su_co (ma_nguoi_bao_cao, ma_may_tinh, loai_su_co, tieu_de, mo_ta, muc_do, trang_thai, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`;
    await db.promise().query(sql, [ma_nguoi_bao_cao, realMachineId, loai_su_co, tieu_de, mo_ta, muc_do || 'normal', trang_thai || 'open']);
console.log("🚀 [BẮT ĐẦU] Tiến trình gửi thông báo cho Admin...");
    try {
        console.log("👉 Bước 1: Đang tìm người báo cáo ID:", ma_nguoi_bao_cao);
        const [userRows] = await db.promise().query('SELECT ho_ten FROM nguoi_dung WHERE id = ?', [ma_nguoi_bao_cao]);
        const tenNguoiBao = userRows.length > 0 ? userRows[0].ho_ten : 'Người dùng hệ thống';
        console.log("✅ Thành công Bước 1 - Tên người báo:", tenNguoiBao);

        let noiDungThongBao = `Tài khoản ${tenNguoiBao} vừa báo cáo lỗi: ${tieu_de || 'Không xác định'} (${loai_su_co || 'Khác'}).`;

        if (realMachineId) {
            console.log("👉 Bước 2: Đang tìm thông tin máy tính ID:", realMachineId);
            const [machineRows] = await db.promise().query(`
                SELECT mt.ten_may, pm.ten_phong 
                FROM may_tinh mt 
                LEFT JOIN phong_may pm ON mt.ma_phong = pm.id 
                WHERE mt.id = ?
            `, [realMachineId]);

            if (machineRows.length > 0) {
                noiDungThongBao = `Tài khoản ${tenNguoiBao} vừa báo lỗi (${loai_su_co}) trên máy [${machineRows[0].ten_may}] tại phòng [${machineRows[0].ten_phong || 'Chưa xếp phòng'}].`;
                console.log("✅ Thành công Bước 2 - Đã có thông tin máy.");
            }
        }

        console.log("👉 Bước 3: Đang tìm danh sách Admin...");
        const [adminRows] = await db.promise().query("SELECT id FROM nguoi_dung WHERE ma_vai_tro = 1 OR id = 33");
        console.log("✅ Thành công Bước 3 - Tìm thấy các Admin ID:", adminRows.map(a => a.id));

        for (const admin of adminRows) {
            console.log(`👉 Bước 4: Đang INSERT thông báo cho Admin ID [${admin.id}]...`);
            // Giống hệt câu SQL bạn vừa chạy thành công trên phpMyAdmin
            await db.promise().query(
                `INSERT INTO thong_bao (ma_nguoi_dung, tieu_de, noi_dung, loai_thong_bao, da_doc) 
                 VALUES (?, ?, ?, ?, ?)`,
                [admin.id, 'Sự cố phòng máy mới!', noiDungThongBao, 'incident', 0]
            );
        }
        console.log("🎉🎉🎉 XONG! Đã lưu toàn bộ thông báo thành công!");

    } catch (error) {
        // Nếu có lỗi, nó sẽ in ĐỎ CHÓT ra màn hình Terminal
        console.error("❌❌❌ LỖI SẬP MẠNG TẠI KHỐI THÔNG BÁO:", error);
    }
};
const updateIncident = async (id, data) => {
    const { ma_may_tinh, loai_su_co, tieu_de, mo_ta, muc_do, trang_thai } = data;

    // 🚀 1. Lấy trạng thái CŨ trước khi update để so sánh
    const [oldData] = await db.promise().query('SELECT trang_thai, ma_nguoi_bao_cao, ma_may_tinh FROM bao_cao_su_co WHERE id=?', [id]);

    // 2. Thực hiện Update
    const sql = `UPDATE bao_cao_su_co SET ma_may_tinh=?, loai_su_co=?, tieu_de=?, mo_ta=?, muc_do=?, trang_thai=?, updated_at=NOW() WHERE id=?`;
    await db.promise().query(sql, [ma_may_tinh || null, loai_su_co, tieu_de, mo_ta, muc_do, trang_thai, id]);

    // 🚀 3. BÁO LẠI CHO SINH VIÊN / GIẢNG VIÊN KHI ADMIN DUYỆT HOẶC XỬ LÝ XONG
    if (oldData.length > 0 && oldData[0].trang_thai !== trang_thai) {
        const idNguoiBaoCao = oldData[0].ma_nguoi_bao_cao;
        const idMay = ma_may_tinh || oldData[0].ma_may_tinh;

        // Truy xuất tên máy
        const [machineInfo] = await db.promise().query('SELECT ten_may FROM may_tinh WHERE id=?', [idMay]);
        const tenMay = machineInfo.length > 0 ? machineInfo[0].ten_may : 'máy tính của bạn';

        let notifTitle = '';
        let notifMessage = '';

        if (trang_thai === 'in_progress') {
            notifTitle = 'Sự cố đã được duyệt';
            notifMessage = `Báo cáo lỗi trên [${tenMay}] của bạn đã được Admin xác nhận và đang tiến hành xử lý.`;
        } else if (trang_thai === 'resolved') {
            notifTitle = 'Sự cố đã khắc phục xong';
            notifMessage = `Tuyệt vời! Sự cố trên [${tenMay}] do bạn báo cáo đã được khắc phục hoàn tất.`;
        }

        if (notifTitle !== '') {
            await notificationService.sendToSpecificUser(idNguoiBaoCao, notifTitle, notifMessage, 'incident_update');
        }
    }
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
    
    const sqlUpdate = `UPDATE phieu_bao_tri SET ma_nguoi_phu_trach=?, loai_bao_tri=?, ngay_bat_dau=?, ngay_ket_thuc=?, cach_xu_ly=?, chi_phi=?, trang_thai=?, updated_at=NOW() WHERE id=?`;
    await db.promise().query(sqlUpdate, [ma_nguoi_phu_trach || null, loai_bao_tri, ngay_bat_dau || null, ngay_ket_thuc || null, cach_xu_ly, chi_phi || 0, trang_thai, id]);

    if (trang_thai === 'completed') {
        const [ticketInfo] = await db.promise().query(`
            SELECT bc.ma_may_tinh 
            FROM phieu_bao_tri pb 
            JOIN bao_cao_su_co bc ON pb.ma_bao_cao_su_co = bc.id 
            WHERE pb.id = ?`, [id]);

        const maMayTinh = ticketInfo.length > 0 ? ticketInfo[0].ma_may_tinh : null;

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

module.exports = { getIncidents, createIncident, updateIncident, deleteIncident, getMaintenanceTickets, createTicket, updateTicket, deleteTicket, createIncidentReport, getMaintenanceLogs };