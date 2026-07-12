const db = require('../config/db');

// 1. Xử lý logic điểm danh bằng QR Code (Code cũ của bạn)
const checkInWithQR = async (userId, scheduleId, qrCode) => {
    // 1. Lấy sinh_vien_id từ ma_nguoi_dung (của token)
    const [students] = await db.promise().query('SELECT id FROM sinh_vien WHERE ma_nguoi_dung = ?', [userId]);
    if (students.length === 0) {
        throw new Error('Không tìm thấy hồ sơ sinh viên hợp lệ trong hệ thống.');
    }
    const studentId = students[0].id;

    // 2. Tìm máy tính từ mã QR do client gửi lên
    const [computers] = await db.promise().query(
        'SELECT id, ma_phong, ten_may, vi_tri, bo_xu_ly, ram, man_hinh, ban_phim, chuot FROM may_tinh WHERE ma_qr = ? AND trang_thai = "active"', 
        [qrCode]
    );
    if (computers.length === 0) {
        throw new Error('Mã QR không hợp lệ hoặc máy tính này đang bảo trì/ngưng hoạt động.');
    }
    const computer = computers[0];

    // 3. Lấy thông tin lịch sử dụng phòng máy (buổi thực hành)
    const [schedules] = await db.promise().query(
        'SELECT ma_phong, ma_lop_hoc_phan FROM lich_su_dung_phong_may WHERE id = ?', 
        [scheduleId]
    );
    if (schedules.length === 0) {
        throw new Error('Ca thực hành này không tồn tại hoặc đã bị hủy.');
    }
    const schedule = schedules[0];

    // 4. Validate: Máy tính có nằm đúng phòng máy của ca học không?
    if (computer.ma_phong !== schedule.ma_phong) {
        throw new Error(`Gian lận! Máy ${computer.ten_may} không thuộc phòng máy của ca học này.`);
    }

    // 5. Validate: Sinh viên đã điểm danh ca này chưa?
    const [existingChecks] = await db.promise().query(
        'SELECT id, ma_may_tinh FROM diem_danh WHERE ma_lich_su_dung = ? AND ma_sinh_vien = ?', 
        [scheduleId, studentId]
    );

    if (existingChecks.length > 0) {
        const currentRecord = existingChecks[0];

        // Nếu quét lại đúng cái máy cũ -> Báo cho sinh viên an tâm
        if (currentRecord.ma_may_tinh === computer.id) {
             throw new Error(`Bạn đã điểm danh ở máy ${computer.ten_may} rồi. Chúc bạn học tốt!`);
        }

        // Nếu quét sang máy khác -> Cập nhật vị trí máy và thời gian
        await db.promise().query(
            'UPDATE diem_danh SET ma_may_tinh = ?, thoi_gian_check_in = CURRENT_TIMESTAMP WHERE id = ?',
            [computer.id, currentRecord.id]
        );

        return {
            id: computer.id,
            diem_danh_id: currentRecord.id,
            ten_may: computer.ten_may,
            vi_tri: computer.vi_tri,
            bo_xu_ly: computer.bo_xu_ly,
            ram: computer.ram,
            man_hinh: computer.man_hinh,
            ban_phim: computer.ban_phim,
            chuot: computer.chuot,
            thoi_gian: new Date(),
            is_update: true 
        };
    }

    // 6. Chưa điểm danh bao giờ -> Ghi nhận INSERT mới
    const [result] = await db.promise().query(
        `INSERT INTO diem_danh (ma_lich_su_dung, ma_sinh_vien, ma_lop_hoc_phan, ma_may_tinh, trang_thai) 
         VALUES (?, ?, ?, ?, 'present')`,
        [scheduleId, studentId, schedule.ma_lop_hoc_phan, computer.id]
    );

    return {
        id: computer.id,
        diem_danh_id: result.insertId,
        ten_may: computer.ten_may,
        vi_tri: computer.vi_tri,
        bo_xu_ly: computer.bo_xu_ly,
        ram: computer.ram,
        man_hinh: computer.man_hinh,
        ban_phim: computer.ban_phim,
        chuot: computer.chuot,
        thoi_gian: new Date(),
        is_update: false
    };
};


// 2. LẤY DANH SÁCH ĐIỂM DANH (CÓ KIỂM TRA ĐÃ QUÉT QR HAY CHƯA & TRẠNG THÁI KHÓA)
const getStudentsBySchedule = async (scheduleId) => {
    const conn = await db.promise().getConnection();
    try {
        // Lấy thông tin buổi học xem đã chốt (completed) chưa
        const [lichRows] = await conn.query(
            `SELECT ma_lop_hoc_phan, trang_thai FROM lich_su_dung_phong_may WHERE id = ?`, 
            [scheduleId]
        );
        if (lichRows.length === 0) throw new Error('Không tìm thấy lịch học');
        
        const lichHoc = lichRows[0];
        const isLocked = lichHoc.trang_thai === 'completed'; // Đã lưu là khóa

        // Lấy danh sách SV + check bảng diem_danh xem ai đã quét
        const sql = `
            SELECT 
                sv.id AS ma_sinh_vien, 
                sv.ma_sinh_vien AS mssv, 
                nd.ho_ten,
                IFNULL(dd.trang_thai, 'absent') AS trang_thai
            FROM chi_tiet_lop_hoc_phan ct
            JOIN sinh_vien sv ON ct.ma_sinh_vien = sv.id
            JOIN nguoi_dung nd ON sv.ma_nguoi_dung = nd.id
            LEFT JOIN diem_danh dd ON dd.ma_sinh_vien = sv.id AND dd.ma_lich_su_dung = ?
            WHERE ct.ma_lop_hoc_phan = ?
            ORDER BY sv.ma_sinh_vien ASC
        `;
        const [students] = await conn.query(sql, [scheduleId, lichHoc.ma_lop_hoc_phan]);

        return { is_locked: isLocked, students };
    } finally {
        conn.release();
    }
};

// 3. LƯU ĐIỂM DANH XUỐNG DB VÀ KHÓA BUỔI HỌC
const saveAttendance = async (ma_lich_su_dung, danh_sach_diem_danh) => {
    const conn = await db.promise().getConnection();
    try {
        await conn.beginTransaction();

        // Chốt buổi học (Khóa không cho sửa nữa)
        await conn.query(
            `UPDATE lich_su_dung_phong_may SET trang_thai = 'completed' WHERE id = ?`, 
            [ma_lich_su_dung]
        );

        // Xóa các điểm danh cũ của buổi này (để ghi đè bản mới nhất của GV)
        await conn.query(`DELETE FROM diem_danh WHERE ma_lich_su_dung = ?`, [ma_lich_su_dung]);

        // Insert loạt điểm danh mới
        if (danh_sach_diem_danh && danh_sach_diem_danh.length > 0) {
            const values = danh_sach_diem_danh.map(sv => [
                ma_lich_su_dung, sv.ma_sinh_vien, sv.trang_thai
            ]);
            await conn.query(
                `INSERT INTO diem_danh (ma_lich_su_dung, ma_sinh_vien, trang_thai) VALUES ?`,
                [values]
            );
        }

        await conn.commit();
        return { message: 'Lưu điểm danh thành công' };
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

module.exports = {
    checkInWithQR,
    saveAttendance,
    getStudentsBySchedule
};