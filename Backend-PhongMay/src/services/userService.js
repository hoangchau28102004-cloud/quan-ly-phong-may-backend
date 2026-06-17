const db = require('../config/db');

const _detectCols = async () => {
  const conn = db.promise();
  const [colsRows] = await conn.query('SHOW COLUMNS FROM nguoi_dung');
  const cols = colsRows.map(c => c.Field);
  return {
    hasEmail: cols.includes('email'),
    hasTaiKhoan: cols.includes('tai_khoan'),
    roleCol: cols.includes('ma_vai_tro') ? 'ma_vai_tro' : (cols.includes('vai_tro_id') ? 'vai_tro_id' : null),
    lopCol: cols.includes('lop_hoc_id') ? 'lop_hoc_id' : (cols.includes('ma_lop') ? 'ma_lop' : (cols.includes('lop_id') ? 'lop_id' : null)),
    phoneCol: cols.includes('so_dien_thoai') ? 'so_dien_thoai' : (cols.includes('phone') ? 'phone' : null),
    genderCol: cols.includes('gioi_tinh') ? 'gioi_tinh' : null,
    dobCol: cols.includes('ngay_sinh') ? 'ngay_sinh' : null
  };
};

const getUsers = async (opts = {}) => {
  const conn = db.promise();
  const { hasEmail, hasTaiKhoan, roleCol, lopCol, phoneCol, genderCol, dobCol } = await _detectCols();

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

  // Chỉ lấy những user chưa bị xóa (Soft Delete)
  const whereParts = ['nd.deleted_at IS NULL'];

  // Lọc theo từ khóa
  if (filter) {
    const f = `%${filter}%`;
    const filterSearch = ['nd.ho_ten LIKE ?'];
    params.push(f);
    if (hasEmail) { filterSearch.push('nd.email LIKE ?'); params.push(f); }
    if (hasTaiKhoan) { filterSearch.push('nd.tai_khoan LIKE ?'); params.push(f); }
    whereParts.push(`(${filterSearch.join(' OR ')})`);
  }

  sql += ' WHERE ' + whereParts.join(' AND ');

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

const createUser = async ({ ho_ten, email, tai_khoan, roleValue, lop_hoc_id, mat_khau, so_dien_thoai, gioi_tinh, ngay_sinh, trang_thai = 1 }) => {
  const conn = db.promise();
  const { hasEmail, hasTaiKhoan, roleCol, lopCol, phoneCol, genderCol, dobCol } = await _detectCols();

  const cols = ['ho_ten', 'mat_khau', 'trang_thai'];
  const vals = [ho_ten, mat_khau, trang_thai];
  
  if (hasEmail && email != null) { cols.push('email'); vals.push(email); }
  if (hasTaiKhoan && tai_khoan != null) { cols.push('tai_khoan'); vals.push(tai_khoan); }
  if (roleCol && roleValue != null) { cols.push(roleCol); vals.push(roleValue); }
  if (lopCol && lop_hoc_id != null) { cols.push(lopCol); vals.push(lop_hoc_id); }
  if (phoneCol && so_dien_thoai != null) { cols.push(phoneCol); vals.push(so_dien_thoai); }
  if (genderCol && gioi_tinh != null) { cols.push(genderCol); vals.push(gioi_tinh); }
  if (dobCol && ngay_sinh != null) { cols.push(dobCol); vals.push(ngay_sinh); }

  const placeholders = cols.map(() => '?').join(', ');
  const sql = `INSERT INTO nguoi_dung (${cols.join(', ')}) VALUES (${placeholders})`;
  const [result] = await conn.query(sql, vals);
  const insertId = result.insertId || result.insert_id || null;

  if (insertId) {
    const selectFields = ['nd.id', 'nd.ho_ten'];
    if (hasEmail) selectFields.push('nd.email');
    if (hasTaiKhoan) selectFields.push('nd.tai_khoan');
    if (roleCol) { selectFields.push(`nd.${roleCol} as vai_tro_id`); selectFields.push('vt.ten_vai_tro as ten_vai_tro'); }
    if (lopCol) selectFields.push(`nd.${lopCol} as lop_hoc_id`);
    if (phoneCol) selectFields.push(`nd.${phoneCol} as so_dien_thoai`);
    if (genderCol) selectFields.push(`nd.${genderCol} as gioi_tinh`);
    if (dobCol) selectFields.push(`nd.${dobCol} as ngay_sinh`);
    selectFields.push('nd.trang_thai', 'nd.created_at');

    let selectSql = `SELECT ${selectFields.join(', ')} FROM nguoi_dung nd`;
    if (roleCol) selectSql += ` LEFT JOIN vai_tro vt ON nd.${roleCol} = vt.id`;
    const [rows] = await conn.query(selectSql, [insertId]);
    return rows[0] || { id: insertId };
  }

  return null;
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
  const sql = 'UPDATE nguoi_dung SET deleted_at = CURRENT_TIMESTAMP, trang_thai = 0 WHERE id = ?';
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
      const roleValue = (u.vai_tro_id !== undefined) ? u.vai_tro_id : u.ma_vai_tro || u.roleValue;
      const res = await createUser({ 
        ho_ten: u.ho_ten, email: u.email, tai_khoan: u.tai_khoan, roleValue, lop_hoc_id: u.lop_hoc_id, 
        mat_khau: u.mat_khau, so_dien_thoai: u.so_dien_thoai, gioi_tinh: u.gioi_tinh, ngay_sinh: u.ngay_sinh 
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
};