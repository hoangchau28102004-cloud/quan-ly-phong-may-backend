const db = require('../config/db');

const AcademicService = {
    // --- MÔN HỌC ---
    getSubjects: async () => {
        const [rows] = await db.promise().query('SELECT * FROM mon_hoc ORDER BY id DESC');
        return rows;
    },
    
    createSubject: async (data) => {
        const [result] = await db.promise().query(
            'INSERT INTO mon_hoc (ma_mon_hoc, ten_mon, loai_mon, so_tin_chi, mo_ta) VALUES (?, ?, ?, ?, ?)', 
            [data.ma_mon_hoc, data.ten_mon, data.loai_mon, data.so_tin_chi, data.mo_ta]
        );
        return { id: result.insertId };
    },
    updateSubject: async (id, data) => {
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

    // --- LỚP HỌC PHẦN ---
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
        if (!data.ma_mon) throw new Error('ma_mon is required to create a lop_hoc_phan');
        const [result] = await db.promise().query('INSERT INTO lop_hoc_phan (ma_lop_hoc_phan, ma_lop, ma_mon, ma_nam_hoc, ma_phong, si_so_toi_da) VALUES (?, ?, ?, ?, ?, ?)', 
        [data.ma_lop_hoc_phan, data.ma_lop || null, data.ma_mon, data.ma_nam_hoc, data.ma_phong, data.si_so_toi_da]);
        
        const newId = result.insertId;
        if (data.ma_giang_vien) {
            await db.promise().query('INSERT INTO phan_cong_giang_vien (ma_lop_hoc_phan, ma_giang_vien) VALUES (?, ?)', [newId, data.ma_giang_vien]);
        }
        return { id: newId };
    },
    updateModule: async (id, data) => {
        if (!data.ma_mon) throw new Error('ma_mon is required to update a lop_hoc_phan');
        const [result] = await db.promise().query('UPDATE lop_hoc_phan SET ma_lop_hoc_phan=?, ma_lop=?, ma_mon=?, ma_nam_hoc=?, ma_phong=?, si_so_toi_da=? WHERE id=?', 
        [data.ma_lop_hoc_phan, data.ma_lop || null, data.ma_mon, data.ma_nam_hoc, data.ma_phong, data.si_so_toi_da, id]);
        
        if (data.ma_giang_vien) {
            await db.promise().query('DELETE FROM phan_cong_giang_vien WHERE ma_lop_hoc_phan = ?', [id]);
            await db.promise().query('INSERT INTO phan_cong_giang_vien (ma_lop_hoc_phan, ma_giang_vien) VALUES (?, ?)', [id, data.ma_giang_vien]);
        }
        return result.affectedRows;
    },

    getTeachers: async () => {
        const sql = `
            SELECT gv.id, gv.ma_giang_vien, nd.ho_ten 
            FROM giang_vien gv
            JOIN nguoi_dung nd ON gv.ma_nguoi_dung = nd.id
        `;
        const [rows] = await db.promise().query(sql);
        return rows;
    },

    deleteItem: async (type, id) => {
        let table = '';
        if (type === 'mon') table = 'mon_hoc';
        if (type === 'lop') table = 'lop_hoc';
        if (type === 'lhp') table = 'lop_hoc_phan';
        
        if (!table) return 0;
        const [result] = await db.promise().query(`DELETE FROM ${table} WHERE id = ?`, [id]);
        return result.affectedRows;
    },

    getStudentsByClass: async (classId) => {
        const sql = `
            SELECT sv.id, sv.ma_sinh_vien, nd.ho_ten, nd.email, sv.nien_khoa
            FROM sinh_vien sv
            JOIN nguoi_dung nd ON sv.ma_nguoi_dung = nd.id
            WHERE sv.ma_lop = ? ORDER BY sv.ma_sinh_vien ASC
        `;
        const [rows] = await db.promise().query(sql, [classId]);
        return rows;
    },

  // --- CHO MÀN HÌNH LỚP HỌC ---
    getAvailableStudents: async () => {
        const sql = `
            SELECT sv.id, sv.ma_sinh_vien, nd.ho_ten, nd.email, sv.nien_khoa, sv.ma_lop
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

    // --- SINH VIÊN TRONG LỚP HỌC PHẦN ---
    getStudentsByModule: async (moduleId) => {
        const sql = `
            SELECT sv.id, sv.ma_sinh_vien, nd.ho_ten, nd.email, lh.ma_lop, sv.nien_khoa
            FROM chi_tiet_lop_hoc_phan ct
            JOIN sinh_vien sv ON ct.ma_sinh_vien = sv.id
            JOIN nguoi_dung nd ON sv.ma_nguoi_dung = nd.id
            LEFT JOIN lop_hoc lh ON sv.ma_lop = lh.id
            WHERE ct.ma_lop_hoc_phan = ? ORDER BY sv.ma_sinh_vien ASC
        `;
        const [rows] = await db.promise().query(sql, [moduleId]);
        return rows;
    },

  getAvailableStudentsForModule: async (moduleId) => {
        const sql = `
            SELECT sv.id, sv.ma_sinh_vien, nd.ho_ten, nd.email, sv.nien_khoa, lh.ma_lop
            FROM sinh_vien sv
            JOIN nguoi_dung nd ON sv.ma_nguoi_dung = nd.id
            LEFT JOIN lop_hoc lh ON sv.ma_lop = lh.id
            WHERE sv.id NOT IN (
                SELECT ma_sinh_vien FROM chi_tiet_lop_hoc_phan WHERE ma_lop_hoc_phan = ?
            )
            ORDER BY sv.ma_sinh_vien ASC
        `;
        const [rows] = await db.promise().query(sql, [moduleId]);
        return rows;
    },

    addStudentToModule: async (moduleId, studentId) => {
        const [exist] = await db.promise().query('SELECT * FROM chi_tiet_lop_hoc_phan WHERE ma_lop_hoc_phan = ? AND ma_sinh_vien = ?', [moduleId, studentId]);
        if (exist.length > 0) throw new Error('Sinh viên đã tồn tại trong lớp này!');

        const [lhp] = await db.promise().query('SELECT si_so_toi_da FROM lop_hoc_phan WHERE id = ?', [moduleId]);
        const [count] = await db.promise().query('SELECT COUNT(*) as total FROM chi_tiet_lop_hoc_phan WHERE ma_lop_hoc_phan = ?', [moduleId]);
        
        if (lhp.length > 0 && count[0].total >= lhp[0].si_so_toi_da) {
            throw new Error('Vượt quá sĩ số tối đa của Lớp học phần!');
        }

        const [result] = await db.promise().query('INSERT INTO chi_tiet_lop_hoc_phan (ma_lop_hoc_phan, ma_sinh_vien) VALUES (?, ?)', [moduleId, studentId]);
        return result.affectedRows;
    },
    removeStudentFromModule: async (moduleId, studentId) => {
        const [result] = await db.promise().query('DELETE FROM chi_tiet_lop_hoc_phan WHERE ma_lop_hoc_phan = ? AND ma_sinh_vien = ?', [moduleId, studentId]);
        return result.affectedRows;
    },

    // --- TÍNH NĂNG QUẢN LÝ NĂM HỌC & TỰ ĐỘNG CHIA TUẦN ---
    getAcademicYears: async () => {
        const [rows] = await db.promise().query('SELECT * FROM nam_hoc ORDER BY ngay_bat_dau DESC');
        return rows;
    },
    
    getWeeksByYear: async (ma_nam_hoc) => {
        const [rows] = await db.promise().query('SELECT * FROM tuan WHERE ma_nam_hoc = ? ORDER BY so_tuan ASC', [ma_nam_hoc]);
        return rows;
    },

   createAcademicYear: async (data) => {
        const { ten_nam_hoc, ngay_bat_dau, ngay_ket_thuc, trang_thai } = data;
        const connection = await db.promise().getConnection();
        
        try {
            await connection.beginTransaction();

            const sqlYear = `INSERT INTO nam_hoc (ten_nam_hoc, ngay_bat_dau, ngay_ket_thuc, trang_thai, created_at) VALUES (?, ?, ?, ?, NOW())`;
            const [yearResult] = await connection.query(sqlYear, [ten_nam_hoc, ngay_bat_dau, ngay_ket_thuc, trang_thai || 'pending']);
            const newYearId = yearResult.insertId;

            const formatDateStr = (dateObj) => {
                const y = dateObj.getFullYear();
                const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                const d = String(dateObj.getDate()).padStart(2, '0');
                return `${y}-${m}-${d}`;
            };

            let startDate = new Date(ngay_bat_dau);
            let endDate = new Date(ngay_ket_thuc);
            let currentWeekStart = new Date(startDate);
            let weekNumber = 1;

            while (currentWeekStart <= endDate) {
                let currentWeekEnd = new Date(currentWeekStart);
                let currentDayOfWeek = currentWeekStart.getDay();
                let daysUntilSunday = currentDayOfWeek === 0 ? 0 : 7 - currentDayOfWeek;
                currentWeekEnd.setDate(currentWeekStart.getDate() + daysUntilSunday);

                if (currentWeekEnd > endDate) {
                    currentWeekEnd = new Date(endDate);
                }

                const sqlWeek = `INSERT INTO tuan (ma_nam_hoc, so_tuan, ngay_bat_dau, ngay_ket_thuc, created_at) VALUES (?, ?, ?, ?, NOW())`;
                await connection.query(sqlWeek, [
                    newYearId, 
                    weekNumber, 
                    formatDateStr(currentWeekStart), 
                    formatDateStr(currentWeekEnd)
                ]);

                currentWeekStart = new Date(currentWeekEnd);
                currentWeekStart.setDate(currentWeekEnd.getDate() + 1);
                weekNumber++;
            }

            await connection.commit();
            return { success: true, id: newYearId, message: `Đã tạo năm học và chia thành ${weekNumber - 1} tuần` };
        } catch (error) {
           await connection.rollback();
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error(`Năm học '${ten_nam_hoc}' đã tồn tại. Vui lòng nhập tên khác!`);
            }
            throw error;
        } finally {
            connection.release();
        }
    },

    deleteAcademicYear: async (id) => {
        try {
            const [result] = await db.promise().query('DELETE FROM nam_hoc WHERE id = ?', [id]);
            return result.affectedRows;
        } catch (error) {
            if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
                throw new Error('Không thể xóa! Năm học này đã có Lớp Học Phần. Vui lòng xóa các Lớp Học Phần của năm này trước.');
            }
            throw error; 
        }
    }
};

module.exports = AcademicService;