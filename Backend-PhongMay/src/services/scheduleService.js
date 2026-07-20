const db = require('../config/db');

// ==========================================================
// 1. QUẢN LÝ LỊCH SỬ DỤNG PHÒNG MÁY (THỜI KHÓA BIỂU)
// ==========================================================
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
    // 1. IN RA ĐỂ KHÁM NGHIỆM TỬ THI XEM FLUTTER GỬI GÌ
    console.log('🚀 DỮ LIỆU TỪ FLUTTER GỬI LÊN:', data);

    // 2. ÉP CUNG DỮ LIỆU (KHÔNG CHO PHÉP NULL HOẶC UNDEFINED Ở CÁC TRƯỜNG QUAN TRỌNG)
    if (!data.ma_phong) throw new Error('Flutter gửi thiếu biến "ma_phong" (ID phòng máy)!');
    if (!data.ngay_hoc_cu_the) throw new Error('Flutter gửi thiếu biến "ngay_hoc_cu_the" (Format YYYY-MM-DD)!');
    if (!data.so_tiet_bat_dau) throw new Error('Flutter gửi thiếu biến "so_tiet_bat_dau"!');
    if (!data.so_tiet_ket_thuc) throw new Error('Flutter gửi thiếu biến "so_tiet_ket_thuc"!');
    if (!data.thu_trong_tuan) throw new Error('Flutter gửi thiếu biến "thu_trong_tuan" (VD: Thứ 2)!');

    let ma_tuan = data.ma_tuan || null;
    let ma_lop_cha = null;
    if (data.ma_lop_hoc_phan) {
        const [lhpRows] = await db.promise().query(
            'SELECT ma_lop FROM lop_hoc_phan WHERE id = ?', 
            [data.ma_lop_hoc_phan]
        );
        if (lhpRows.length > 0) {
            ma_lop_cha = lhpRows[0].ma_lop; // Bắt được ID lớp cha
        }
    }   
    // 3. NẾU KHÔNG TRUYỀN MÃ TUẦN, BACKEND SẼ TỰ DÒ TÌM TRONG DB
    if (!ma_tuan && data.ngay_hoc_cu_the) {
        const sqlFindTuan = `
            SELECT id FROM tuan 
            WHERE ? BETWEEN ngay_bat_dau AND ngay_ket_thuc 
            LIMIT 1
        `;
        const [tuanRows] = await db.promise().query(sqlFindTuan, [data.ngay_hoc_cu_the]);

        if (tuanRows.length > 0) {
            ma_tuan = tuanRows[0].id;
        } else {
            // Lỗi trí mạng: Ngày gửi lên không nằm trong năm học nào cả!
            throw new Error(`Ngày ${data.ngay_hoc_cu_the} không thuộc về bất kỳ Tuần nào trong CSDL!`);
        }
    }

    // 4. CHÈN VÀO DATABASE (CÓ ĐỦ BỘ GIÁP BẢO VỆ)
    const sql = `
        INSERT INTO lich_su_dung_phong_may 
        (ma_phong, ma_lop, ma_lop_hoc_phan, ma_giang_vien, ngay_hoc_cu_the, so_tiet_bat_dau, so_tiet_ket_thuc, loai_lich, thu_trong_tuan, ma_tuan, trang_thai) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')
    `;
    
    // Ép kiểu để DB không bị sốc
    const [result] = await db.promise().query(sql, [
        parseInt(data.ma_phong),
        ma_lop_cha, // Lưu Lớp Cha vào đây
        data.ma_lop_hoc_phan ? parseInt(data.ma_lop_hoc_phan) : null,
        data.ma_giang_vien ? parseInt(data.ma_giang_vien) : null, 
        data.ngay_hoc_cu_the,
        parseInt(data.so_tiet_bat_dau),
        parseInt(data.so_tiet_ket_thuc),
        data.loai_lich || 'ChinhThuc',
        data.thu_trong_tuan,
        ma_tuan
    ]);
    
    return result.insertId;
};
const updateSchedule = async (id, data) => {
    // Dùng COALESCE: Nếu Frontend không gửi lên trường nào thì DB tự giữ nguyên giá trị cũ
    // Bổ sung ma_giang_vien để lưu thông tin giảng viên dạy thay
    const sql = `
        UPDATE lich_su_dung_phong_may 
        SET 
            ma_phong = COALESCE(?, ma_phong), 
            ma_lop_hoc_phan = COALESCE(?, ma_lop_hoc_phan), 
            ngay_hoc_cu_the = COALESCE(?, ngay_hoc_cu_the), 
            so_tiet_bat_dau = COALESCE(?, so_tiet_bat_dau), 
            so_tiet_ket_thuc = COALESCE(?, so_tiet_ket_thuc), 
            loai_lich = COALESCE(?, loai_lich), 
            thu_trong_tuan = COALESCE(?, thu_trong_tuan),
            ma_giang_vien = COALESCE(?, ma_giang_vien) 
        WHERE id = ?
    `;
    
    const [result] = await db.promise().query(sql, [
        data.ma_phong || null,
        data.ma_lop_hoc_phan || null,
        data.ngay_hoc_cu_the || null,    // Dùng khi muốn dời lịch (chọn ngày mới)
        data.so_tiet_bat_dau || null,
        data.so_tiet_ket_thuc || null,
        data.loai_lich || null,
        data.thu_trong_tuan || null,     // Nếu dời lịch sang thứ khác thì gửi kèm trường này
        data.ma_giang_vien || null,      // Dùng khi muốn đổi giảng viên dạy thay
        id
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

const updateBookingStatus = async (id, status, reviewerId = null) => {
    const sql = 'UPDATE dat_phong_may SET trang_thai_duyet = ?, updated_at = NOW() WHERE id = ?';
    const [result] = await db.promise().query(sql, [status, id]);
    return result.affectedRows || 0;
};

const getSchedule = async (tuan_id, lop_hoc_id, nguoi_dung_id, current_date) => {
  const conn = db.promise();
  try {
    let sql = `
      SELECT
        lpm.id,
        lpm.ngay_hoc_cu_the AS ngay_hoc,
        lpm.thu_trong_tuan AS thu,
        lpm.so_tiet_bat_dau AS tiet_bat_dau,
        lpm.so_tiet_ket_thuc AS tiet_ket_thuc,
        lpm.ma_tuan AS tuan_id,
        CASE
            WHEN lpm.so_tiet_bat_dau >= 11 THEN 'Tối'
            WHEN lpm.so_tiet_bat_dau >= 6 THEN 'Chiều'
            ELSE 'Sáng'
        END AS ma_ca,
        pm.ten_phong, pm.id AS phong_may_id,
        lh.ma_lop,
        mh.ten_mon,
        nd.ho_ten AS ten_giang_vien
      FROM lich_su_dung_phong_may lpm
      JOIN phong_may pm ON lpm.ma_phong = pm.id
      LEFT JOIN lop_hoc lh ON lpm.ma_lop = lh.id
      LEFT JOIN lop_hoc_phan lhp ON lpm.ma_lop_hoc_phan = lhp.id
      LEFT JOIN mon_hoc mh ON lhp.ma_mon = mh.id
      LEFT JOIN giang_vien gv ON lpm.ma_giang_vien = gv.id
      LEFT JOIN nguoi_dung nd ON gv.ma_nguoi_dung = nd.id
      WHERE 1=1
    `;

    const params = [];

    if (tuan_id) {
      sql += ` AND lpm.ma_tuan = ?`;
      params.push(tuan_id);
    } else if (current_date) {
      sql += ` AND lpm.ma_tuan = (SELECT id FROM tuan WHERE ? BETWEEN ngay_bat_dau AND ngay_ket_thuc LIMIT 1)`;
      params.push(current_date);
    }

    if (lop_hoc_id) {
      sql += ` AND lpm.ma_lop = ?`;
      params.push(lop_hoc_id);
    }

    if (nguoi_dung_id) {
      const [gvRows] = await conn.query('SELECT id FROM giang_vien WHERE ma_nguoi_dung = ?', [nguoi_dung_id]);
      if (gvRows.length > 0) {
        sql += ` AND lpm.ma_giang_vien = ?`;
        params.push(gvRows[0].id);
      } else {
        sql += ` AND lpm.ma_giang_vien = ?`;
        params.push(nguoi_dung_id);
      }
    }

    sql += ` ORDER BY lpm.ngay_hoc_cu_the ASC, lpm.so_tiet_bat_dau ASC`;

    const [rows] = await conn.query(sql, params);
    return rows.map(r => {
      let thuInt = 2;
      if (r.thu === 'Thứ 2') thuInt = 2;
      else if (r.thu === 'Thứ 3') thuInt = 3;
      else if (r.thu === 'Thứ 4') thuInt = 4;
      else if (r.thu === 'Thứ 5') thuInt = 5;
      else if (r.thu === 'Thứ 6') thuInt = 6;
      else if (r.thu === 'Thứ 7') thuInt = 7;
      else if (r.thu === 'Chủ Nhật' || r.thu === 'CN') thuInt = 8;

      return {
        ...r,
        thu: thuInt,
        gio_bat_dau: r.tiet_bat_dau ? 'Tiết ' + r.tiet_bat_dau : 'Tiết 1',
        gio_ket_thuc: r.tiet_ket_thuc ? 'Tiết ' + r.tiet_ket_thuc : 'Tiết 3',
        ma_lop: r.ma_lop || 'Lớp chung',
        ten_giang_vien: r.ten_giang_vien || 'Đang cập nhật'
      };
    });
  } catch (err) {
    throw err;
  }
};

const bookRoom = async (data) => {
  const conn = db.promise();
  try {
    const [gvRows] = await conn.query('SELECT id FROM giang_vien WHERE ma_nguoi_dung = ?', [data.nguoi_dung_id]);
    let ma_giang_vien;

    if (gvRows.length === 0) {
      const ma_gv_tam = 'GV' + data.nguoi_dung_id + '_' + Date.now().toString().slice(-4);
      const [insertGv] = await conn.query(
        'INSERT INTO giang_vien (ma_nguoi_dung, ma_giang_vien, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
        [data.nguoi_dung_id, ma_gv_tam]
      );
      ma_giang_vien = insertGv.insertId;
    } else {
      ma_giang_vien = gvRows[0].id;
    }

    const sql = `INSERT INTO dat_phong_may 
                 (ma_giang_vien, ma_phong, ngay_dat, tiet_bat_dau, tiet_ket_thuc, muc_dich, trang_thai_duyet, created_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`;
    const [result] = await conn.query(sql, [
      ma_giang_vien,
      data.phong_may_id,
      data.ngay_yeu_cau,
      data.tiet_bat_dau || 1,
      data.tiet_ket_thuc || 1,
      data.muc_dich || '',
      data.trang_thai_duyet || 'pending'
    ]);
    return { id: result.insertId };
  } catch (err) {
    throw err;
  }
};

const getBookings = async (opts = {}) => {
  const conn = db.promise();
  const { trang_thai_duyet, ma_phong, ma_giang_vien, nguoi_dung_id, page, limit } = opts;

  let sql = `SELECT dp.id, dp.ma_giang_vien, dp.ma_phong, 
             DATE_FORMAT(dp.ngay_dat, '%Y-%m-%d') as ngay_dat, 
             CASE
                WHEN dp.tiet_bat_dau >= 11 THEN 'Tối'
                WHEN dp.tiet_bat_dau >= 6 THEN 'Chiều'
                ELSE 'Sáng'
             END AS ma_ca,
             dp.tiet_bat_dau, dp.tiet_ket_thuc, dp.muc_dich, dp.trang_thai_duyet, dp.created_at, pm.ten_phong, nd.ho_ten as nguoi_dat
             FROM dat_phong_may dp
             LEFT JOIN phong_may pm ON dp.ma_phong = pm.id
             LEFT JOIN giang_vien gv ON dp.ma_giang_vien = gv.id
             LEFT JOIN nguoi_dung nd ON gv.ma_nguoi_dung = nd.id
             WHERE 1=1`;
  const params = [];

  if (trang_thai_duyet) { sql += ' AND dp.trang_thai_duyet = ?'; params.push(trang_thai_duyet); }
  if (ma_phong) { sql += ' AND dp.ma_phong = ?'; params.push(ma_phong); }
  if (ma_giang_vien) { sql += ' AND dp.ma_giang_vien = ?'; params.push(ma_giang_vien); }
  if (nguoi_dung_id) { sql += ' AND gv.ma_nguoi_dung = ?'; params.push(nguoi_dung_id); }

  sql += ' ORDER BY dp.ngay_dat DESC, dp.created_at DESC';
  if (limit && Number(limit) > 0) {
    const l = Number(limit);
    const p = page && Number(page) > 0 ? Number(page) : 1;
    const offset = (p - 1) * l;
    sql += ' LIMIT ? OFFSET ?';
    params.push(l, offset);
  }

  const [rows] = await conn.query(sql, params);
  return rows;
};

const deleteBooking = async (id) => {
  const conn = db.promise();
  const sql = `DELETE FROM dat_phong_may WHERE id = ? AND trang_thai_duyet = 'pending'`;
  const [result] = await conn.query(sql, [id]);
  return result.affectedRows || 0;
};

const getStudentScheduleData = async (userId) => {
    // 🚀 SỬA TÊN CỘT BẰNG ALIAS (AS) ĐỂ KHỚP 100% VỚI APP FLUTTER
    const sql = `
        SELECT 
            ls.id, 
            mh.ten_mon, 
            lhp.ma_lop_hoc_phan AS ma_lhp_str, 
            pm.ten_phong, 
            pm.id AS phong_may_id,
            nd_gv.ho_ten AS ten_giang_vien, 
            DATE_FORMAT(ls.ngay_hoc_cu_the, '%Y-%m-%d') AS ngay_hoc, -- Phải là định dạng YYYY-MM-DD
            ls.thu_trong_tuan AS thu, 
            ls.so_tiet_bat_dau AS tiet_bat_dau, 
            ls.so_tiet_ket_thuc AS tiet_ket_thuc, 
            ls.loai_lich, 
            ls.trang_thai,
            ls.ma_tuan AS tuan_id,
            lh.ma_lop,
            CASE
                WHEN ls.so_tiet_bat_dau >= 11 THEN 'Tối'
                WHEN ls.so_tiet_bat_dau >= 6 THEN 'Chiều'
                ELSE 'Sáng'
            END AS ma_ca
        FROM lich_su_dung_phong_may ls
        JOIN lop_hoc_phan lhp ON ls.ma_lop_hoc_phan = lhp.id
        JOIN mon_hoc mh ON lhp.ma_mon = mh.id
        JOIN phong_may pm ON ls.ma_phong = pm.id
        JOIN chi_tiet_lop_hoc_phan ctlhp ON ctlhp.ma_lop_hoc_phan = lhp.id
        JOIN sinh_vien sv ON ctlhp.ma_sinh_vien = sv.id
        LEFT JOIN lop_hoc lh ON lhp.ma_lop = lh.id
        LEFT JOIN giang_vien gv ON ls.ma_giang_vien = gv.id
        LEFT JOIN nguoi_dung nd_gv ON gv.ma_nguoi_dung = nd_gv.id
        WHERE sv.ma_nguoi_dung = ?
        ORDER BY ls.ngay_hoc_cu_the ASC
    `;
    const [rows] = await db.promise().query(sql, [userId]);
    
    // 🚀 BƯỚC ÉP KIỂU: Biến chữ "Thứ 3" thành số 3 giống hệt Admin
    return rows.map(r => {
        let thuInt = 2;
        if (r.thu === 'Thứ 2') thuInt = 2;
        else if (r.thu === 'Thứ 3') thuInt = 3;
        else if (r.thu === 'Thứ 4') thuInt = 4;
        else if (r.thu === 'Thứ 5') thuInt = 5;
        else if (r.thu === 'Thứ 6') thuInt = 6;
        else if (r.thu === 'Thứ 7') thuInt = 7;
        else if (r.thu === 'Chủ Nhật' || r.thu === 'CN') thuInt = 8;

        return {
            ...r,
            thu: thuInt,
            gio_bat_dau: r.tiet_bat_dau ? 'Tiết ' + r.tiet_bat_dau : 'Tiết 1',
            gio_ket_thuc: r.tiet_ket_thuc ? 'Tiết ' + r.tiet_ket_thuc : 'Tiết 3',
            ma_lop: r.ma_lop || r.ma_lhp_str || 'Lớp chung',
            ten_giang_vien: r.ten_giang_vien || 'Đang cập nhật'
        };
    });
};
const getScheduleDetail = async (scheduleId) => {
    const connection = await db.promise().getConnection();
    try {
        const sql = `
            SELECT 
                ls.id AS ma_lich,
                DATE_FORMAT(ls.ngay_hoc_cu_the, '%d/%m/%Y') AS ngay_hoc_cu_the,
                ls.so_tiet_bat_dau,
                ls.so_tiet_ket_thuc,
                lhp.ma_lop_hoc_phan,
                mh.ten_mon,
                pm.ten_phong,
                nd.ho_ten AS ten_giang_vien,
                (SELECT COUNT(*) FROM chi_tiet_lop_hoc_phan ctlhp WHERE ctlhp.ma_lop_hoc_phan = ls.ma_lop_hoc_phan) AS si_so_thuc_te,
                (SELECT COUNT(*) FROM may_tinh mt WHERE mt.ma_phong = ls.ma_phong AND mt.trang_thai = 'active') AS so_may_tinh
            FROM lich_su_dung_phong_may ls
            LEFT JOIN lop_hoc_phan lhp ON ls.ma_lop_hoc_phan = lhp.id
            LEFT JOIN mon_hoc mh ON lhp.ma_mon = mh.id
            LEFT JOIN phong_may pm ON ls.ma_phong = pm.id
            LEFT JOIN giang_vien gv ON ls.ma_giang_vien = gv.id
            LEFT JOIN nguoi_dung nd ON gv.ma_nguoi_dung = nd.id
            WHERE ls.id = ?
        `;
        const [rows] = await connection.query(sql, [scheduleId]);
        
        if (rows.length === 0) throw new Error("Không tìm thấy thông tin lịch học!");
        return rows[0];
    } catch (error) {
        console.error("LỖI LẤY CHI TIẾT LỊCH HỌC:", error.message);
        throw error;
    } finally {
        connection.release();
    }
};
module.exports = {
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getBookingRequests,
  updateBookingStatus,
  getSchedule,
  bookRoom,
  getBookings,
  deleteBooking,
  getStudentScheduleData,
  getScheduleDetail
};
