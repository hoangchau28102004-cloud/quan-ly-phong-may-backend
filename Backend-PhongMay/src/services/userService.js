const db = require('../config/db');

const _detectCols = async () => {
  const conn = db.promise();
  const [colsRows] = await conn.query('SHOW COLUMNS FROM nguoi_dung');
  const cols = colsRows.map(c => c.Field);
  return {
    hasEmail: cols.includes('email'),
    hasTaiKhoan: cols.includes('tai_khoan'),
    hasDeletedAt: cols.includes('deleted_at'),
    roleCol: cols.includes('ma_vai_tro') ? 'ma_vai_tro' : (cols.includes('vai_tro_id') ? 'vai_tro_id' : null),
    lopCol: cols.includes('lop_hoc_id') ? 'lop_hoc_id' : (cols.includes('ma_lop') ? 'ma_lop' : (cols.includes('lop_id') ? 'lop_id' : null)),
    phoneCol: cols.includes('so_dien_thoai') ? 'so_dien_thoai' : (cols.includes('phone') ? 'phone' : null),
    genderCol: cols.includes('gioi_tinh') ? 'gioi_tinh' : null,
    dobCol: cols.includes('ngay_sinh') ? 'ngay_sinh' : null
  };
};

const getUsers = async (opts = {}) => {
  const conn = db.promise();
  const { hasEmail, hasTaiKhoan, hasDeletedAt, roleCol, lopCol, phoneCol, genderCol, dobCol } = await _detectCols();

  const { orderBy = 'created_at', descending = true, page, limit, filter } = opts;

  const selectFields = ['nd.id', 'nd.ho_ten'];
  if (hasEmail) selectFields.push('nd.email');
  if (hasTaiKhoan) selectFields.push('nd.tai_khoan');
  if (roleCol) {
    selectFields.push(`nd.${roleCol} as vai_tro_id`);
    selectFields.push('vt.ten_vai_tro as ten_vai_tro');
  }
  if (lopCol) selectFields.push(`nd.${lopCol} as lop_hoc_id`);
  if (phoneCol) selectFields.push(`nd.${phoneCol} as so_dien_thoai`);
  if (genderCol) selectFields.push(`nd.${genderCol} as gioi_tinh`);
  if (dobCol) selectFields.push(`nd.${dobCol} as ngay_sinh`);
  selectFields.push('nd.trang_thai', 'nd.created_at');

  let sql = `SELECT ${selectFields.join(', ')} FROM nguoi_dung nd`;
  const params = [];
  if (roleCol) sql += ` LEFT JOIN vai_tro vt ON nd.${roleCol} = vt.id`;

  const whereParts = [];
  if (hasDeletedAt) {
    whereParts.push('nd.deleted_at IS NULL');
  }

  // Lọc theo từ khóa
  if (filter) {
    const f = `%${filter}%`;
    const filterSearch = ['nd.ho_ten LIKE ?'];
    params.push(f);
    if (hasEmail) { filterSearch.push('nd.email LIKE ?'); params.push(f); }
    if (hasTaiKhoan) { filterSearch.push('nd.tai_khoan LIKE ?'); params.push(f); }
    whereParts.push(`(${filterSearch.join(' OR ')})`);
  }

  if (whereParts.length > 0) {
    sql += ' WHERE ' + whereParts.join(' AND ');
  }

  const allowedOrder = ['created_at', 'ho_ten', 'id', 'email', 'tai_khoan'];
  const orderCol = allowedOrder.includes(orderBy) ? orderBy : 'created_at';
  sql += ` ORDER BY nd.${orderCol} ${descending ? 'DESC' : 'ASC'}`;

  // Phân trang
  if (limit && Number(limit) > 0) {
    const l = Number(limit);
    const p = page && Number(page) > 0 ? Number(page) : 1;
    const offset = (p - 1) * l;
    sql += ' LIMIT ? OFFSET ?';
    params.push(l, offset);
  }

  const [results] = await conn.query(sql, params);

  // Normalize dữ liệu để tránh trả về null
  const normalized = results.map(r => {
    if (!r.ho_ten) r.ho_ten = '';
    if (!r.email) r.email = '';
    if (!r.tai_khoan) r.tai_khoan = '';
    if (!r.ten_vai_tro) r.ten_vai_tro = '';
    if (!r.so_dien_thoai) r.so_dien_thoai = '';
    if (!r.gioi_tinh) r.gioi_tinh = '';
    return r;
  });

  return normalized;
};

// =========================================================================
// 🚀 ĐÃ FIX: Sử dụng Transaction và Tự động Insert vào sinh_vien / giang_vien
// =========================================================================
// 🚀 ĐẬP ĐI XÂY LẠI: TỰ ĐỘNG SINH MÃ SV VÀ NIÊN KHÓA TỪ EMAIL
const createUser = async ({ ho_ten, email, roleValue, lop_hoc_id, mat_khau, so_dien_thoai, gioi_tinh, ngay_sinh, trang_thai = 1 }) => {
  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();

    console.log("=> [1] Đang Insert vào bảng nguoi_dung...");
    const sqlUser = `INSERT INTO nguoi_dung (ma_vai_tro, ho_ten, email, mat_khau, so_dien_thoai, gioi_tinh, ngay_sinh, trang_thai, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;
    const [userResult] = await connection.query(sqlUser, [roleValue, ho_ten, email, mat_khau, so_dien_thoai, gioi_tinh, ngay_sinh, trang_thai]);
    const insertId = userResult.insertId;

    const roleNum = Number(roleValue);
    console.log(`=> Tạo nguoi_dung xong. ID: ${insertId} | Role đang xét: ${roleNum}`);

    // NẾU LÀ SINH VIÊN (role = 2) -> TỰ ĐỘNG BÓC TÁCH MÃ SV & NIÊN KHÓA
    if (roleNum === 2) {
      console.log("=> [2] Đây là Sinh Viên. Đang tự động xử lý Mã SV và Niên Khóa...");
      
      // 1. Tự động lấy chữ trước dấu @ của email làm mã sinh viên
      let maSV = '';
      if (email && email.includes('@')) {
        maSV = email.split('@')[0].toUpperCase();
      } else {
        maSV = `SV${insertId}`; // Backup nếu vì lý do nào đó không có email
      }

      // 2. Tự động tính niên khóa (Cắt ký tự thứ 5 và 6 của mã SV)
      let nienKhoaTuDong = '2023-2026'; // Giá trị mặc định an toàn
      if (maSV.length >= 6) {
        const yearPart = maSV.substring(4, 6); 
        const startYear = parseInt(yearPart, 10);
        if (!isNaN(startYear)) {
          const fullStartYear = 2000 + startYear;
          nienKhoaTuDong = `${fullStartYear}-${fullStartYear + 3}`;
        }
      }

      await connection.query(
        `INSERT INTO sinh_vien (ma_nguoi_dung, ma_sinh_vien, ma_lop, nien_khoa, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [insertId, maSV, lop_hoc_id || null, nienKhoaTuDong]
      );
      console.log(`=> Tạo tự động THÀNH CÔNG! Mã SV: ${maSV} | Niên khóa: ${nienKhoaTuDong}`);
    } 
    // NẾU LÀ GIẢNG VIÊN (role = 3)
    else if (roleNum === 3) {
      console.log("=> [2] Đây là Giảng Viên. Đang Insert sang bảng giang_vien...");
      // Lấy chữ trước @ làm mã GV (nếu có), không thì tự sinh
      const maGV = (email && email.includes('@')) ? email.split('@')[0].toUpperCase() : `GV${insertId}`;
      await connection.query(
        `INSERT INTO giang_vien (ma_nguoi_dung, ma_giang_vien, created_at, updated_at) VALUES (?, ?, NOW(), NOW())`,
        [insertId, maGV]
      );
      console.log(`=> Tạo dữ liệu bảng giang_vien THÀNH CÔNG! Mã GV: ${maGV}`);
    }

    await connection.commit();
    connection.release();
    return { id: insertId };

  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error("🔥 LỖI SQL Transaction createUser:", error.message);
    throw error;
  }
};

const getStudentDashboardData = async (userId) => {
    try {
        // 1. Lấy ID sinh viên từ bảng sinh_vien
        const [svRows] = await db.promise().query('SELECT id FROM sinh_vien WHERE ma_nguoi_dung = ?', [userId]);
        if (svRows.length === 0) return { coursesCount: 0, upcoming: [], recentAttendance: [], recentIncidents: [] };
        
        const sinhVienId = svRows[0].id;

        // 2. Query lấy dữ liệu (Phải dùng await)
        const [[{ coursesCount }]] = await db.promise().query('SELECT COUNT(*) as coursesCount FROM chi_tiet_lop_hoc_phan WHERE ma_sinh_vien = ?', [sinhVienId]);
        
        const [upcoming] = await db.promise().query(`
            SELECT mh.ten_mon, ls.ngay_hoc_cu_the as thoi_gian, pm.ten_phong as phong 
            FROM lich_su_dung_phong_may ls
            JOIN lop_hoc_phan lhp ON ls.ma_lop_hoc_phan = lhp.id
            JOIN mon_hoc mh ON lhp.ma_mon = mh.id
            JOIN phong_may pm ON ls.ma_phong = pm.id
            JOIN chi_tiet_lop_hoc_phan ctlhp ON lhp.id = ctlhp.ma_lop_hoc_phan
            WHERE ctlhp.ma_sinh_vien = ? AND ls.ngay_hoc_cu_the >= CURDATE()
            LIMIT 5`, [sinhVienId]);

        const [recentAttendance] = await db.promise().query(`
            SELECT mh.ten_mon, dd.trang_thai, dd.thoi_gian_check_in as thoi_gian 
            FROM diem_danh dd
            JOIN lop_hoc_phan lhp ON dd.ma_lop_hoc_phan = lhp.id
            JOIN mon_hoc mh ON lhp.ma_mon = mh.id
            WHERE dd.ma_sinh_vien = ?
            ORDER BY dd.thoi_gian_check_in DESC LIMIT 5`, [sinhVienId]);

        return { coursesCount, upcoming, recentAttendance, recentIncidents: [] };
    } catch (e) {
        throw new Error("Lỗi Database: " + e.message);
    }
};

const updateUser = async (id, { ho_ten, roleValue, lop_hoc_id, so_dien_thoai, gioi_tinh, ngay_sinh }) => {
  const conn = db.promise();
  const { roleCol, lopCol, phoneCol, genderCol, dobCol } = await _detectCols();

  const sets = [];
  const vals = [];
  
  if (ho_ten != null) { sets.push('ho_ten = ?'); vals.push(ho_ten); }
  if (roleCol && roleValue != null) { sets.push(`${roleCol} = ?`); vals.push(roleValue); }
  if (lopCol && lop_hoc_id != null) { sets.push(`${lopCol} = ?`); vals.push(lop_hoc_id); }
  if (phoneCol && so_dien_thoai !== undefined) { sets.push(`${phoneCol} = ?`); vals.push(so_dien_thoai); }
  if (genderCol && gioi_tinh !== undefined) { sets.push(`${genderCol} = ?`); vals.push(gioi_tinh); }
  if (dobCol && ngay_sinh !== undefined) { sets.push(`${dobCol} = ?`); vals.push(ngay_sinh); }

  if (sets.length === 0) return 0;
  
  sets.push('updated_at = CURRENT_TIMESTAMP');
  vals.push(id);
  
  const sql = `UPDATE nguoi_dung SET ${sets.join(', ')} WHERE id = ?`;
  const [result] = await conn.query(sql, vals);
  return result.affectedRows || 0;
};

const resetPassword = async (id, hashedPassword) => {
  const conn = db.promise();
  const sql = 'UPDATE nguoi_dung SET mat_khau = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
  const [result] = await conn.query(sql, [hashedPassword, id]);
  return result.affectedRows || 0;
};

const toggleStatus = async (id, active) => {
  const conn = db.promise();
  const val = active ? 1 : 0;
  const sql = 'UPDATE nguoi_dung SET trang_thai = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
  const [result] = await conn.query(sql, [val, id]);
  return result.affectedRows || 0;
};

const deleteUser = async (id) => {
  const conn = db.promise();
  const { hasDeletedAt } = await _detectCols();
  const sql = hasDeletedAt
    ? 'UPDATE nguoi_dung SET deleted_at = CURRENT_TIMESTAMP, trang_thai = 0 WHERE id = ?'
    : 'UPDATE nguoi_dung SET trang_thai = 0 WHERE id = ?';
  const [result] = await conn.query(sql, [id]);
  return result.affectedRows || 0;
};

const getRoles = async () => {
  const conn = db.promise();
  const [results] = await conn.query('SELECT id, ten_vai_tro FROM vai_tro ORDER BY id');
  return results;
};

const createUsersBulk = async (users) => {
  const created = [];
  for (const u of users) {
    try {
      const rawRole = (u.vai_tro_id !== undefined) ? u.vai_tro_id : u.ma_vai_tro || u.roleValue;
      const roleValue = Number(rawRole);
      const res = await createUser({ 
        ho_ten: u.ho_ten, email: u.email, tai_khoan: u.tai_khoan, roleValue, lop_hoc_id: u.lop_hoc_id, 
        mat_khau: u.mat_khau, so_dien_thoai: u.so_dien_thoai, gioi_tinh: u.gioi_tinh, ngay_sinh: u.ngay_sinh,
        ma_sinh_vien: u.ma_sinh_vien, nien_khoa: u.nien_khoa
      });
      if (res) created.push(res);
    } catch (err) {
      console.error('Bulk create user error', err.message || err);
    }
  }
  return created;
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  resetPassword,
  toggleStatus,
  deleteUser,
  getRoles,
  createUsersBulk,
  getStudentDashboardData
};