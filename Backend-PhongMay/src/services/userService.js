const db = require('../config/db');

const _detectCols = async () => {
  const conn = db.promise();
  const [colsRows] = await conn.query('SHOW COLUMNS FROM nguoi_dung');
  const cols = colsRows.map(c => c.Field);
  return {
    hasEmail: cols.includes('email'),
    hasTaiKhoan: cols.includes('tai_khoan'),
    roleCol: cols.includes('ma_vai_tro') ? 'ma_vai_tro' : (cols.includes('vai_tro_id') ? 'vai_tro_id' : null),
    // detect class/lesson FK column on nguoi_dung if present (may be absent in some schemas)
    lopCol: cols.includes('lop_hoc_id') ? 'lop_hoc_id' : (cols.includes('ma_lop') ? 'ma_lop' : (cols.includes('lop_id') ? 'lop_id' : null)),
    phoneCol: cols.includes('so_dien_thoai') ? 'so_dien_thoai' : (cols.includes('phone') ? 'phone' : null)
  };
};

const getUsers = async (opts = {}) => {
  const conn = db.promise();
  const { hasEmail, hasTaiKhoan, roleCol, lopCol, phoneCol } = await _detectCols();

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
  selectFields.push('nd.trang_thai', 'nd.created_at');

  let sql = `SELECT ${selectFields.join(', ')} FROM nguoi_dung nd`;
  const params = [];
  if (roleCol) sql += ` LEFT JOIN vai_tro vt ON nd.${roleCol} = vt.id`;

  // Filtering
  if (filter) {
    const f = `%${filter}%`;
    const whereParts = [];
    whereParts.push('nd.ho_ten LIKE ?');
    params.push(f);
    if (hasEmail) { whereParts.push('nd.email LIKE ?'); params.push(f); }
    if (hasTaiKhoan) { whereParts.push('nd.tai_khoan LIKE ?'); params.push(f); }
    sql += ' WHERE ' + whereParts.join(' OR ');
  }

  // Whitelist allowed order columns to avoid SQL injection
  const allowedOrder = ['created_at', 'ho_ten', 'id', 'email', 'tai_khoan'];
  const orderCol = allowedOrder.includes(orderBy) ? orderBy : 'created_at';
  sql += ` ORDER BY nd.${orderCol} ${descending ? 'DESC' : 'ASC'}`;

  // Pagination
  if (limit && Number(limit) > 0) {
    const l = Number(limit);
    const p = page && Number(page) > 0 ? Number(page) : 1;
    const offset = (p - 1) * l;
    sql += ' LIMIT ? OFFSET ?';
    params.push(l, offset);
  }

  const [results] = await conn.query(sql, params);

  // Normalize result rows: ensure string fields are never null (frontend may expect non-nullable strings)
  const normalized = results.map(r => {
    // ensure expected string fields exist and are strings
    if (r.ho_ten == null) r.ho_ten = '';
    if (r.email == null) r.email = '';
    if (r.tai_khoan == null) r.tai_khoan = '';
    if (r.ten_vai_tro == null) r.ten_vai_tro = '';
    if (r.so_dien_thoai == null) r.so_dien_thoai = '';
    return r;
  });

  return normalized;
};

const createUser = async ({ ho_ten, email, tai_khoan, roleValue, lop_hoc_id, mat_khau, trang_thai = 1 }) => {
  const conn = db.promise();
  const { hasEmail, hasTaiKhoan, roleCol, lopCol } = await _detectCols();

  const cols = ['ho_ten', 'mat_khau', 'trang_thai'];
  const vals = [ho_ten, mat_khau, trang_thai];
  if (hasEmail && email != null) { cols.push('email'); vals.push(email); }
  if (hasTaiKhoan && tai_khoan != null) { cols.push('tai_khoan'); vals.push(tai_khoan); }
  if (roleCol && roleValue != null) { cols.push(roleCol); vals.push(roleValue); }
  if (lopCol && lop_hoc_id != null) { cols.push(lopCol); vals.push(lop_hoc_id); }

  const placeholders = cols.map(() => '?').join(', ');
  const sql = `INSERT INTO nguoi_dung (${cols.join(', ')}) VALUES (${placeholders})`;
  const [result] = await conn.query(sql, vals);
  const insertId = result.insertId || result.insert_id || null;

  // Return the created resource (normalized field names)
  if (insertId) {
    const selectFields = ['nd.id', 'nd.ho_ten'];
    if (hasEmail) selectFields.push('nd.email');
    if (hasTaiKhoan) selectFields.push('nd.tai_khoan');
    if (roleCol) { selectFields.push(`nd.${roleCol} as vai_tro_id`); selectFields.push('vt.ten_vai_tro as ten_vai_tro'); }
    if (lopCol) selectFields.push(`nd.${lopCol} as lop_hoc_id`);
    selectFields.push('nd.trang_thai', 'nd.created_at');

    let selectSql = `SELECT ${selectFields.join(', ')} FROM nguoi_dung nd`;
    if (roleCol) selectSql += ` LEFT JOIN vai_tro vt ON nd.${roleCol} = vt.id`;
    const [rows] = await conn.query(selectSql, [insertId]);
    return rows[0] || { id: insertId };
  }

  return null;
};

const updateUser = async (id, { ho_ten, email, tai_khoan, roleValue, lop_hoc_id }) => {
  const conn = db.promise();
  const { hasEmail, hasTaiKhoan, roleCol, lopCol } = await _detectCols();

  const sets = [];
  const vals = [];
  if (ho_ten != null) { sets.push('ho_ten = ?'); vals.push(ho_ten); }
  if (hasEmail && email != null) { sets.push('email = ?'); vals.push(email); }
  if (hasTaiKhoan && tai_khoan != null) { sets.push('tai_khoan = ?'); vals.push(tai_khoan); }
  if (roleCol && roleValue != null) { sets.push(`${roleCol} = ?`); vals.push(roleValue); }
  if (lopCol && lop_hoc_id != null) { sets.push(`${lopCol} = ?`); vals.push(lop_hoc_id); }

  if (sets.length === 0) return 0;
  vals.push(id);
  const sql = `UPDATE nguoi_dung SET ${sets.join(', ')} WHERE id = ?`;
  const [result] = await conn.query(sql, vals);
  return result.affectedRows || 0;
};

const resetPassword = async (id, hashedPassword) => {
  const conn = db.promise();
  const sql = 'UPDATE nguoi_dung SET mat_khau = ? WHERE id = ?';
  const [result] = await conn.query(sql, [hashedPassword, id]);
  return result.affectedRows || 0;
};

const toggleStatus = async (id, active) => {
  const conn = db.promise();
  const val = active ? 1 : 0;
  const sql = 'UPDATE nguoi_dung SET trang_thai = ? WHERE id = ?';
  const [result] = await conn.query(sql, [val, id]);
  return result.affectedRows || 0;
};

const getRoles = async () => {
  const conn = db.promise();
  const [results] = await conn.query('SELECT id, ten_vai_tro FROM vai_tro ORDER BY id');
  return results;
};

const createUsersBulk = async (users) => {
  // users: array of { ho_ten, email, tai_khoan, roleValue/vai_tro_id/ma_vai_tro, lop_hoc_id, mat_khau }
  const created = [];
  for (const u of users) {
    try {
      const roleValue = (u.vai_tro_id !== undefined) ? u.vai_tro_id : u.ma_vai_tro || u.roleValue;
      const res = await createUser({ ho_ten: u.ho_ten, email: u.email, tai_khoan: u.tai_khoan, roleValue, lop_hoc_id: u.lop_hoc_id, mat_khau: u.mat_khau });
      if (res) created.push(res);
    } catch (err) {
      // collect partial results and continue
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
  getRoles,
  createUsersBulk,
};
