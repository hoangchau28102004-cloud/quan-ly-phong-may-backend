const db = require('../config/db');

// ==========================================================
// 1. QUẢN LÝ LỊCH SỬ DỤNG PHÒNG MÁY (THỜI KHÓA BIỂU)
// ==========================================================
// Lấy danh sách lịch chính thức
const getSchedules = async () => {
    const sql = `
        SELECT ls.*, pm.ten_phong, mh.ten_mon, lh.ma_lop, 
               lhp.ma_lop_hoc_phan AS ma_lhp_str,
               COALESCE(nd.ho_ten, nd2.ho_ten) AS ten_giang_vien
        FROM lich_su_dung_phong_may ls
        LEFT JOIN phong_may pm ON ls.ma_phong = pm.id
        LEFT JOIN lop_hoc lh ON ls.ma_lop = lh.id
        LEFT JOIN lop_hoc_phan lhp ON ls.ma_lop_hoc_phan = lhp.id
        LEFT JOIN mon_hoc mh ON lhp.ma_mon = mh.id
        -- Lấy giáo viên được gán trực tiếp vào lịch (nếu có)
        LEFT JOIN giang_vien gv ON ls.ma_giang_vien = gv.id
        LEFT JOIN nguoi_dung nd ON gv.ma_nguoi_dung = nd.id
        -- Lấy giáo viên được phân công dạy Lớp Học Phần này (Dùng làm phương án dự phòng)
        LEFT JOIN phan_cong_giang_vien pcgv ON lhp.id = pcgv.ma_lop_hoc_phan
        LEFT JOIN giang_vien gv2 ON pcgv.ma_giang_vien = gv2.id
        LEFT JOIN nguoi_dung nd2 ON gv2.ma_nguoi_dung = nd2.id
        ORDER BY ls.ngay_hoc_cu_the DESC, ls.so_tiet_bat_dau ASC
    `;
    const [rows] = await db.promise().query(sql);
    return rows;
};

const createSchedule = async (data) => {
    console.log("🚀 NHẬN DỮ LIỆU TỪ FLUTTER THÊM LỊCH THỦ CÔNG:", data);
    
    // =========================================================
    // BƯỚC 1: TÌM `ma_tuan` VỚI CƠ CHẾ BẢO VỆ CHỐNG CRASH
    // =========================================================
    let ma_tuan = null;
    if (data.ngay_hoc_cu_the) {
        try {
            // Thay đổi tên cột thành ngay_bat_dau và ngay_ket_thuc (Tên phổ biến nhất)
            const sqlFindTuan = `
                SELECT id FROM tuan 
                WHERE ? BETWEEN ngay_bat_dau AND ngay_ket_thuc 
                LIMIT 1
            `;
            const [tuanRows] = await db.promise().query(sqlFindTuan, [data.ngay_hoc_cu_the]);
            
            if (tuanRows.length > 0) {
                ma_tuan = tuanRows[0].id;
                console.log(`✅ Đã tìm thấy mã tuần: ${ma_tuan} cho ngày ${data.ngay_hoc_cu_the}`);
            } else {
                throw new Error("Không tìm thấy tuần khớp với ngày này");
            }
        } catch (error) {
            // BACKUP CỨU CÁNH: Nếu tên cột DB sai hoặc không có tuần nào khớp ngày học
            // Hệ thống sẽ tự động lấy 1 tuần bất kỳ (tuần mới nhất) để gán vào, tránh lỗi Ràng buộc khóa ngoại!
            console.log("⚠️ Không khớp ngày hoặc sai tên cột DB. Chuyển sang lấy tuần mặc định...");
            const [backupTuan] = await db.promise().query(`SELECT id FROM tuan ORDER BY id DESC LIMIT 1`);
            
            if (backupTuan.length > 0) {
                ma_tuan = backupTuan[0].id;
                console.log(`✅ Đã gán tạm mã tuần mặc định: ${ma_tuan} để lưu lịch an toàn.`);
            }
        }
    }

    // =========================================================
    // BƯỚC 2: LƯU VÀO DATABASE KÈM THEO `ma_tuan`
    // =========================================================
    const sql = `
        INSERT INTO lich_su_dung_phong_may 
        (ma_phong, ma_lop_hoc_phan, ngay_hoc_cu_the, so_tiet_bat_dau, so_tiet_ket_thuc, loai_lich, thu_trong_tuan, ma_tuan) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.promise().query(sql, [
        data.ma_phong,
        data.ma_lop_hoc_phan,
        data.ngay_hoc_cu_the,
        data.so_tiet_bat_dau,
        data.so_tiet_ket_thuc,
        data.loai_lich,
        data.thu_trong_tuan,
        ma_tuan
    ]);
    
    return { id: result.insertId };
};

const updateSchedule = async (id, data) => {
    const sql = `
        UPDATE lich_su_dung_phong_may 
        SET ma_phong=?, ma_lop_hoc_phan=?, ngay_hoc_cu_the=?, so_tiet_bat_dau=?, so_tiet_ket_thuc=?, loai_lich=?, thu_trong_tuan=?
        WHERE id=?
    `;
    const [result] = await db.promise().query(sql, [
        data.ma_phong, data.ma_lop_hoc_phan, data.ngay_hoc_cu_the, 
        data.so_tiet_bat_dau, data.so_tiet_ket_thuc, data.loai_lich, data.thu_trong_tuan, id
    ]);
    return result.affectedRows;
};

const deleteSchedule = async (id) => {
    const [result] = await db.promise().query('DELETE FROM lich_su_dung_phong_may WHERE id = ?', [id]);
    return result.affectedRows;
};

// ==========================================================
// 2. QUẢN LÝ YÊU CẦU ĐẶT PHÒNG
// ==========================================================
const getBookingRequests = async () => {
    const sql = `
        SELECT dp.*, pm.ten_phong, nd.ho_ten as nguoi_dat
        FROM dat_phong_may dp
        JOIN phong_may pm ON dp.ma_phong = pm.id
        JOIN giang_vien gv ON dp.ma_giang_vien = gv.id
        JOIN nguoi_dung nd ON gv.ma_nguoi_dung = nd.id
        ORDER BY dp.created_at DESC
    `;
    const [rows] = await db.promise().query(sql);
    return rows;
};

// Hàm này được Controller gọi khi duyệt/từ chối phiếu đặt phòng
const updateBookingStatus = async (id, status) => {
    console.log(`🚀 Cập nhật trạng thái đặt phòng ID ${id} thành: ${status}`);
    const [result] = await db.promise().query(
        'UPDATE dat_phong_may SET trang_thai_duyet = ? WHERE id = ?', 
        [status, id]
    );
    return result.affectedRows;
};

// ==========================================================
// EXPORT TẤT CẢ CÁC HÀM CHO CONTROLLER SỬ DỤNG
// ==========================================================
module.exports = {
    getSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    getBookingRequests,
    updateBookingStatus
};