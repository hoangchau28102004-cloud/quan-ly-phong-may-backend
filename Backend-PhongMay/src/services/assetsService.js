const db = require('../config/db');

// Rooms (phong_may)
const listRooms = async (opts = {}) => {
  const conn = db.promise();
  const { page, limit, filter } = opts;
  let sql = 'SELECT id, ma_phong, ten_phong, suc_chua, trang_thai, mo_ta, created_at FROM phong_may WHERE 1=1';
  const params = [];
  if (filter) { sql += ' AND (ten_phong LIKE ? OR ma_phong LIKE ?)'; params.push(`%${filter}%`, `%${filter}%`); }
  sql += ' ORDER BY created_at DESC';
  if (limit && Number(limit) > 0) {
    const l = Number(limit);
    const p = page && Number(page) > 0 ? Number(page) : 1;
    const offset = (p - 1) * l;
    sql += ' LIMIT ? OFFSET ?'; params.push(l, offset);
  }
  const [rows] = await conn.query(sql, params);
  return rows;
};

const getRoomById = async (id) => {
  const conn = db.promise();
  const [rows] = await conn.query('SELECT id, ma_phong, ten_phong, suc_chua, trang_thai, mo_ta, created_at FROM phong_may WHERE id = ?', [id]);
  return rows[0] || null;
};

const createRoom = async (data) => {
  const conn = db.promise();
  const { ma_phong, ten_phong, suc_chua = 0, mo_ta = null, trang_thai = 'active' } = data;
  const sql = 'INSERT INTO phong_may (ma_phong, ten_phong, suc_chua, mo_ta, trang_thai, created_at) VALUES (?, ?, ?, ?, ?, NOW())';
  const [result] = await conn.query(sql, [ma_phong, ten_phong, suc_chua, mo_ta, trang_thai]);
  const insertId = result.insertId || result.insert_id || null;
  if (insertId) return getRoomById(insertId);
  return null;
};

const updateRoom = async (id, data) => {
  const conn = db.promise();
  const sets = [];
  const params = [];
  if (data.ma_phong !== undefined) { sets.push('ma_phong = ?'); params.push(data.ma_phong); }
  if (data.ten_phong !== undefined) { sets.push('ten_phong = ?'); params.push(data.ten_phong); }
  if (data.suc_chua !== undefined) { sets.push('suc_chua = ?'); params.push(data.suc_chua); }
  if (data.trang_thai !== undefined) { sets.push('trang_thai = ?'); params.push(data.trang_thai); }
  if (data.mo_ta !== undefined) { sets.push('mo_ta = ?'); params.push(data.mo_ta); }
  if (sets.length === 0) return 0;
  params.push(id);
  const sql = `UPDATE phong_may SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`;
  const [result] = await conn.query(sql, params);
  return result.affectedRows || 0;
};

const deleteRoom = async (id) => {
  const conn = db.promise();
  const [result] = await conn.query('DELETE FROM phong_may WHERE id = ?', [id]);
  return result.affectedRows || 0;
};

// Configs (cau_hinh_may_tinh)
const listConfigs = async () => {
  const [rows] = await db.promise().query('SELECT * FROM cau_hinh_may_tinh ORDER BY id');
  return rows;
};

const getConfigById = async (id) => {
  const [rows] = await db.promise().query('SELECT * FROM cau_hinh_may_tinh WHERE id = ?', [id]);
  return rows[0] || null;
};

const createConfig = async (data) => {
  const { bo_xu_ly, ram, o_cung, card_do_hoa, man_hinh, he_dieu_hanh, ghi_chu } = data;
  const sql = `INSERT INTO cau_hinh_may_tinh (bo_xu_ly, ram, o_cung, card_do_hoa, man_hinh, he_dieu_hanh, ghi_chu, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`;
  const [result] = await db.promise().query(sql, [bo_xu_ly, ram, o_cung, card_do_hoa, man_hinh, he_dieu_hanh, ghi_chu]);
  const insertId = result.insertId || null;
  if (insertId) return getConfigById(insertId);
  return null;
};

const updateConfig = async (id, data) => {
  const conn = db.promise();
  const sets = [];
  const params = [];
  ['bo_xu_ly','ram','o_cung','card_do_hoa','man_hinh','he_dieu_hanh','ghi_chu'].forEach(k => {
    if (data[k] !== undefined) { sets.push(`${k} = ?`); params.push(data[k]); }
  });
  if (sets.length === 0) return 0;
  params.push(id);
  const sql = `UPDATE cau_hinh_may_tinh SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`;
  const [result] = await conn.query(sql, params);
  return result.affectedRows || 0;
};

const deleteConfig = async (id) => {
  const [result] = await db.promise().query('DELETE FROM cau_hinh_may_tinh WHERE id = ?', [id]);
  return result.affectedRows || 0;
};

// Computers (may_tinh)
const listComputers = async (opts = {}) => {
  const conn = db.promise();
  const { page, limit, filter } = opts;
  let sql = `SELECT mt.id, mt.ma_may, mt.ma_phong as phong_id, mt.ma_cau_hinh as cau_hinh_id, mt.ma_qr, mt.dia_chi_ip, mt.dia_chi_mac, mt.trang_thai, mt.created_at,
                      pm.ten_phong, pm.ma_phong as phong_code,
                      ch.bo_xu_ly, ch.ram, ch.o_cung, ch.card_do_hoa, ch.he_dieu_hanh
             FROM may_tinh mt
             LEFT JOIN phong_may pm ON mt.ma_phong = pm.id
             LEFT JOIN cau_hinh_may_tinh ch ON mt.ma_cau_hinh = ch.id
             WHERE 1=1`;
  const params = [];
  if (filter) { sql += ' AND (mt.ma_may LIKE ? OR pm.ten_phong LIKE ?)'; params.push(`%${filter}%`, `%${filter}%`); }
  sql += ' ORDER BY mt.created_at DESC';
  if (limit && Number(limit) > 0) {
    const l = Number(limit);
    const p = page && Number(page) > 0 ? Number(page) : 1;
    const offset = (p - 1) * l;
    sql += ' LIMIT ? OFFSET ?'; params.push(l, offset);
  }
  const [rows] = await conn.query(sql, params);
  return rows;
};

const getComputerById = async (id) => {
  const [rows] = await db.promise().query('SELECT * FROM may_tinh WHERE id = ?', [id]);
  return rows[0] || null;
};

const createComputer = async (data) => {
  const conn = db.promise();
  const ma_phong = data.phong_id || data.phong_may_id || data.ma_phong || data.ma_phong_id || null;
  const ma_cau_hinh = data.cau_hinh_id || data.ma_cau_hinh || null;
  const { ma_may, ma_qr = null, dia_chi_ip = null, dia_chi_mac = null, trang_thai = 'active', ghi_chu = null } = data;
  const sql = `INSERT INTO may_tinh (ma_phong, ma_cau_hinh, ma_may, ma_qr, dia_chi_ip, dia_chi_mac, trang_thai, ghi_chu, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
  const [result] = await conn.query(sql, [ma_phong, ma_cau_hinh, ma_may, ma_qr, dia_chi_ip, dia_chi_mac, trang_thai, ghi_chu]);
  const insertId = result.insertId || null;
  if (insertId) return getComputerById(insertId);
  return null;
};

const updateComputer = async (id, data) => {
  const conn = db.promise();
  const sets = [];
  const params = [];
  if (data.ma_may !== undefined) { sets.push('ma_may = ?'); params.push(data.ma_may); }
  if (data.ma_phong !== undefined) { sets.push('ma_phong = ?'); params.push(data.ma_phong); }
  if (data.ma_cau_hinh !== undefined) { sets.push('ma_cau_hinh = ?'); params.push(data.ma_cau_hinh); }
  if (data.dia_chi_ip !== undefined) { sets.push('dia_chi_ip = ?'); params.push(data.dia_chi_ip); }
  if (data.dia_chi_mac !== undefined) { sets.push('dia_chi_mac = ?'); params.push(data.dia_chi_mac); }
  if (data.trang_thai !== undefined) { sets.push('trang_thai = ?'); params.push(data.trang_thai); }
  if (data.ghi_chu !== undefined) { sets.push('ghi_chu = ?'); params.push(data.ghi_chu); }
  if (sets.length === 0) return 0;
  params.push(id);
  const sql = `UPDATE may_tinh SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`;
  const [result] = await conn.query(sql, params);
  return result.affectedRows || 0;
};

const deleteComputer = async (id) => {
  const [result] = await db.promise().query('DELETE FROM may_tinh WHERE id = ?', [id]);
  return result.affectedRows || 0;
};

// ==========================================
// IMPORT RECEIPT (PHIẾU NHẬP MÁY) 
// ==========================================

// 1. Lấy danh sách phiếu nhập
const listImportReceipts = async () => {
  const sql = `
    SELECT pn.id, pn.ma_phieu_nhap, pn.ngay_nhap, pn.tong_so_luong, pn.ghi_chu, pm.ten_phong
    FROM phieu_nhap_may pn
    LEFT JOIN phong_may pm ON pn.ma_phong = pm.id
    ORDER BY pn.created_at DESC
  `;
  const [rows] = await db.promise().query(sql);
  return rows;
};

// 2. Tạo phiếu nhập mới (Transaction)
const createImportReceipt = async (data) => {
  const conn = await db.promise().getConnection();
  try {
    await conn.beginTransaction();

    const { 
      ma_phieu_nhap, ma_phong, ngay_nhap, tong_so_luong, nha_cung_cap, ghi_chu_phieu,
      cpu_brand, cpu_detail, ram_brand, ram_capacity, 
      gpu_type, gpu_detail, mainboard, monitor, keyboard, mouse, 
      storage_type, storage_capacity, os 
    } = data;
    
    // Ghép dữ liệu chuẩn hóa
    const boXuLy = `${cpu_brand} ${cpu_detail || ''}`.trim();
    const ram = `${ram_brand || ''} ${ram_capacity}`.trim();
    const oCung = `${storage_type} ${storage_capacity}`;
    const cardDoHoa = gpu_type === 'Card Rời' ? gpu_detail : 'Card Onboard';
    const heDieuHanh = os;
    const manHinh = monitor || 'Không có';
    
    const ghiChuCauHinh = `Bo mạch chủ: ${mainboard || 'Không rõ'} | Bàn phím: ${keyboard || 'Không'} | Chuột: ${mouse || 'Không'}`;

    let maCauHinh = null;
    const cauHinhSoBo = `CPU: ${boXuLy} | RAM: ${ram} | VGA: ${cardDoHoa} | HDD/SSD: ${oCung}`;
    const ghiChuFinal = `Nhà cung cấp: ${nha_cung_cap || 'Không'}\nCấu hình: ${cauHinhSoBo}\nGhi chú thêm: ${ghi_chu_phieu || ''}`;

    // 1. Lưu cấu hình chung
    if (tong_so_luong > 0) {
      const [configResult] = await conn.query(
        `INSERT INTO cau_hinh_may_tinh (bo_xu_ly, ram, o_cung, card_do_hoa, man_hinh, he_dieu_hanh, ghi_chu, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [boXuLy, ram, oCung, cardDoHoa, manHinh, heDieuHanh, ghiChuCauHinh]
      );
      maCauHinh = configResult.insertId;
    }

    // 2. Insert Phiếu Nhập
    await conn.query(
      `INSERT INTO phieu_nhap_may 
      (ma_phieu_nhap, ma_phong, ngay_nhap, tong_so_luong, cau_hinh_so_bo, trang_thai, ghi_chu, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, 'draft', ?, NOW(), NOW())`,
      [ma_phieu_nhap, ma_phong, ngay_nhap, tong_so_luong, cauHinhSoBo, ghiChuFinal]
    );

    // 3. Sinh tự động máy tính
    if (tong_so_luong > 0 && maCauHinh) {
      const [existingComputers] = await conn.query(
        'SELECT ten_may FROM may_tinh WHERE ma_phong = ?', 
        [ma_phong]
      );
      
      let maxStt = 0;
      for (const comp of existingComputers) {
        const match = comp.ten_may.match(/\d+$/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (num > maxStt) maxStt = num;
        }
      }

      const maMayPrefix = ma_phieu_nhap.replace('PN-', 'PC-');
      let insertValues = [];
      
      for (let i = 1; i <= tong_so_luong; i++) {
        const sttTenMay = (maxStt + i).toString().padStart(3, '0'); 
        const tenMay = `Máy ${sttTenMay}`;
        
        const sttMaMay = i.toString().padStart(3, '0');
        const maMay = `${maMayPrefix}-${sttMaMay}`;
        
        insertValues.push([ma_phong, maCauHinh, maMay, tenMay, 'active', new Date(), new Date()]);
      }

      await conn.query(
        `INSERT INTO may_tinh (ma_phong, ma_cau_hinh, ma_may, ten_may, trang_thai, created_at, updated_at) VALUES ?`,
        [insertValues]
      );
    }

    await conn.commit();
    return { success: true, message: 'Tạo phiếu nhập và cấu hình thành công!' };

  } catch (error) {
    await conn.rollback();
    throw new Error('Lỗi Transaction: ' + error.message);
  } finally {
    conn.release();
  }
};

module.exports = {
  // rooms
  listRooms, getRoomById, createRoom, updateRoom, deleteRoom,
  // configs
  listConfigs, getConfigById, createConfig, updateConfig, deleteConfig,
  // computers
  listComputers, getComputerById, createComputer, updateComputer, deleteComputer,
  // Import receipt
  listImportReceipts, createImportReceipt
};