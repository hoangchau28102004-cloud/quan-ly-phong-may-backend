const db = require('../config/db');

const AcademicService = {
// --- MÔN HỌC ---
    getSubjects: async () => {
        const [rows] = await db.promise().query('SELECT * FROM mon_hoc ORDER BY id DESC');
        return rows;
    },
    
    createSubject: async (data) => {
        console.log("==> DỮ LIỆU THÊM MÔN HỌC:", data); // In ra để kiểm tra
        const [result] = await db.promise().query(
            'INSERT INTO mon_hoc (ma_mon_hoc, ten_mon, loai_mon, so_tin_chi, mo_ta) VALUES (?, ?, ?, ?, ?)', 
            [data.ma_mon_hoc, data.ten_mon, data.loai_mon, data.so_tin_chi, data.mo_ta]
        );
        return { id: result.insertId };
    },
    updateSubject: async (id, data) => {
        console.log("==> DỮ LIỆU SỬA MÔN HỌC:", data); // In ra để kiểm tra
        const [result] = await db.promise().query(
            'UPDATE mon_hoc SET ma_mon_hoc=?, ten_mon=?, loai_mon=?, so_tin_chi=?, mo_ta=? WHERE id=?', 
            [data.ma_mon_hoc, data.ten_mon, data.loai_mon, data.so_tin_chi, data.mo_ta, id]
        );
        return result.affectedRows;
    },

    
    // --- LỚP HỌC ---
    getClasses: async () => {
        const sql = `
            SELECT 
                l.*, 
                nd.ho_ten as ten_giang_vien,
                (SELECT COUNT(*) FROM sinh_vien sv WHERE sv.ma_lop = l.id) as so_sinh_vien
            FROM lop_hoc l 
            LEFT JOIN giang_vien gv ON l.ma_giang_vien = gv.id
            LEFT JOIN nguoi_dung nd ON gv.ma_nguoi_dung = nd.id
            ORDER BY l.id DESC
        `;
        const [rows] = await db.promise().query(sql);
        return rows;
    },
    createClass: async (data) => {
        const [result] = await db.promise().query('INSERT INTO lop_hoc (ma_lop, nien_khoa, chuyen_nganh, ma_giang_vien) VALUES (?, ?, ?, ?)', 
        [data.ma_lop, data.nien_khoa, data.chuyen_nganh, data.ma_giang_vien]);
        return { id: result.insertId };
    },
    updateClass: async (id, data) => {
        const [result] = await db.promise().query('UPDATE lop_hoc SET ma_lop=?, nien_khoa=?, chuyen_nganh=?, ma_giang_vien=? WHERE id=?', 
        [data.ma_lop, data.nien_khoa, data.chuyen_nganh, data.ma_giang_vien, id]);
        return result.affectedRows;
    },

   // =========================================================================
    // --- LỚP HỌC PHẦN ---
    // =========================================================================
    getModules: async () => {
        const sql = `
            SELECT 
                lhp.*, 
                mh.ten_mon, 
                nh.ten_nam_hoc, 
                pm.ten_phong,
                lh.ma_lop AS ten_lop,
                (SELECT pcgv.ma_giang_vien FROM phan_cong_giang_vien pcgv WHERE pcgv.ma_lop_hoc_phan = lhp.id LIMIT 1) as ma_giang_vien,
                (SELECT GROUP_CONCAT(nd.ho_ten SEPARATOR ', ') 
                 FROM phan_cong_giang_vien pcgv 
                 JOIN giang_vien gv ON pcgv.ma_giang_vien = gv.id 
                 JOIN nguoi_dung nd ON gv.ma_nguoi_dung = nd.id 
                 WHERE pcgv.ma_lop_hoc_phan = lhp.id) as ten_giang_vien,
                (SELECT COUNT(*) FROM chi_tiet_lop_hoc_phan ctlhp WHERE ctlhp.ma_lop_hoc_phan = lhp.id) as so_sinh_vien
            FROM lop_hoc_phan lhp 
            LEFT JOIN mon_hoc mh ON lhp.ma_mon = mh.id 
            LEFT JOIN nam_hoc nh ON lhp.ma_nam_hoc = nh.id 
            LEFT JOIN phong_may pm ON lhp.ma_phong = pm.id 
            LEFT JOIN lop_hoc lh ON lhp.ma_lop = lh.id
            ORDER BY lhp.id DESC
        `;
        const [rows] = await db.promise().query(sql);
        return rows;
    },
    createModule: async (data) => {
        if (!data.ma_mon) {
            throw new Error('ma_mon is required to create a lop_hoc_phan');
        }
        const [result] = await db.promise().query('INSERT INTO lop_hoc_phan (ma_lop_hoc_phan, ma_lop, ma_mon, ma_nam_hoc, ma_phong, si_so_toi_da) VALUES (?, ?, ?, ?, ?, ?)', 
        [data.ma_lop_hoc_phan, data.ma_lop || null, data.ma_mon, data.ma_nam_hoc, data.ma_phong, data.si_so_toi_da]);
        
        const newId = result.insertId;
        
        // Lưu Giảng viên vào bảng phân công
        if (data.ma_giang_vien) {
            await db.promise().query('INSERT INTO phan_cong_giang_vien (ma_lop_hoc_phan, ma_giang_vien) VALUES (?, ?)', [newId, data.ma_giang_vien]);
        }
        return { id: newId };
    },
    updateModule: async (id, data) => {
        if (!data.ma_mon) {
            throw new Error('ma_mon is required to update a lop_hoc_phan');
        }
        const [result] = await db.promise().query('UPDATE lop_hoc_phan SET ma_lop_hoc_phan=?, ma_lop=?, ma_mon=?, ma_nam_hoc=?, ma_phong=?, si_so_toi_da=? WHERE id=?', 
        [data.ma_lop_hoc_phan, data.ma_lop || null, data.ma_mon, data.ma_nam_hoc, data.ma_phong, data.si_so_toi_da, id]);
        
        // Cập nhật Giảng viên
        if (data.ma_giang_vien) {
            await db.promise().query('DELETE FROM phan_cong_giang_vien WHERE ma_lop_hoc_phan = ?', [id]);
            await db.promise().query('INSERT INTO phan_cong_giang_vien (ma_lop_hoc_phan, ma_giang_vien) VALUES (?, ?)', [id, data.ma_giang_vien]);
        }
        return result.affectedRows;
    },

    // --- LẤY DANH SÁCH GIẢNG VIÊN ---
    getTeachers: async () => {
        const sql = `
            SELECT gv.id, gv.ma_giang_vien, nd.ho_ten 
            FROM giang_vien gv
            JOIN nguoi_dung nd ON gv.ma_nguoi_dung = nd.id
        `;
        const [rows] = await db.promise().query(sql);
        return rows;
    },

    // --- HÀM DÙNG CHUNG CHO XÓA ---
    deleteItem: async (type, id) => {
        let table = '';
        if (type === 'mon') table = 'mon_hoc';
        if (type === 'lop') table = 'lop_hoc';
        if (type === 'lhp') table = 'lop_hoc_phan';
        
        if (!table) return 0;
        const [result] = await db.promise().query(`DELETE FROM ${table} WHERE id = ?`, [id]);
        return result.affectedRows;
    },

    // ================= DANH SÁCH SINH VIÊN TRONG LỚP =================
    getStudentsByClass: async (classId) => {
        const sql = `
            SELECT sv.id, sv.ma_sinh_vien, nd.ho_ten, nd.email, sv.nien_khoa
            FROM sinh_vien sv
            JOIN nguoi_dung nd ON sv.ma_nguoi_dung = nd.id
            WHERE sv.ma_lop = ?
            ORDER BY sv.ma_sinh_vien ASC
        `;
        const [rows] = await db.promise().query(sql, [classId]);
        return rows;
    },
    getAvailableStudents: async () => {
        const sql = `
            SELECT sv.id, sv.ma_sinh_vien, nd.ho_ten 
            FROM sinh_vien sv
            JOIN nguoi_dung nd ON sv.ma_nguoi_dung = nd.id
            WHERE sv.ma_lop IS NULL
            ORDER BY sv.ma_sinh_vien ASC
        `;
        const [rows] = await db.promise().query(sql);
        return rows;
    },
    addStudentToClass: async (classId, studentId) => {
        const [result] = await db.promise().query('UPDATE sinh_vien SET ma_lop = ? WHERE id = ?', [classId, studentId]);
        return result.affectedRows;
    },
    removeStudentFromClass: async (studentId) => {
        const [result] = await db.promise().query('UPDATE sinh_vien SET ma_lop = NULL WHERE id = ?', [studentId]);
        return result.affectedRows;
    },
    // ================= SINH VIÊN TRONG LỚP HỌC PHẦN =================
    // 1. Lấy danh sách sinh viên của lớp học phần
    getStudentsByModule: async (moduleId) => {
        const sql = `
            SELECT sv.id, sv.ma_sinh_vien, nd.ho_ten, nd.email, lh.ma_lop, sv.nien_khoa
            FROM chi_tiet_lop_hoc_phan ct
            JOIN sinh_vien sv ON ct.ma_sinh_vien = sv.id
            JOIN nguoi_dung nd ON sv.ma_nguoi_dung = nd.id
            LEFT JOIN lop_hoc lh ON sv.ma_lop = lh.id
            WHERE ct.ma_lop_hoc_phan = ?
            ORDER BY sv.ma_sinh_vien ASC
        `;
        const [rows] = await db.promise().query(sql, [moduleId]);
        return rows;
    },
    // 2. Thêm sinh viên vào Lớp học phần
    addStudentToModule: async (moduleId, studentId) => {
        // CHẶN 1: Kiểm tra xem sinh viên đã có trong lớp chưa
        const [exist] = await db.promise().query('SELECT * FROM chi_tiet_lop_hoc_phan WHERE ma_lop_hoc_phan = ? AND ma_sinh_vien = ?', [moduleId, studentId]);
        if (exist.length > 0) throw new Error('Sinh viên đã tồn tại trong lớp này!');

        // CHẶN 2: Kiểm tra sĩ số tối đa
        const [lhp] = await db.promise().query('SELECT si_so_toi_da FROM lop_hoc_phan WHERE id = ?', [moduleId]);
        const [count] = await db.promise().query('SELECT COUNT(*) as total FROM chi_tiet_lop_hoc_phan WHERE ma_lop_hoc_phan = ?', [moduleId]);
        
        if (lhp.length > 0 && count[0].total >= lhp[0].si_so_toi_da) {
            throw new Error('Vượt quá sĩ số tối đa của Lớp học phần!');
        }

        // BƯỚC 3: Mọi thứ an toàn -> Tiến hành lưu vào DB
        const [result] = await db.promise().query('INSERT INTO chi_tiet_lop_hoc_phan (ma_lop_hoc_phan, ma_sinh_vien) VALUES (?, ?)', [moduleId, studentId]);
        return result.affectedRows;
    },
    // 3. Xóa sinh viên khỏi Lớp học phần
    removeStudentFromModule: async (moduleId, studentId) => {
        const [result] = await db.promise().query('DELETE FROM chi_tiet_lop_hoc_phan WHERE ma_lop_hoc_phan = ? AND ma_sinh_vien = ?', [moduleId, studentId]);
        return result.affectedRows;
    }
};

module.exports = AcademicService;