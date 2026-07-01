const db = require('../config/db');

// ======================= MÁY TÍNH =======================
const getComputers = async () => {
    const sql = `
        SELECT mt.*, pm.ten_phong 
        FROM may_tinh mt 
        LEFT JOIN phong_may pm ON mt.ma_phong = pm.id
        ORDER BY mt.id DESC
    `;
    const [rows] = await db.promise().query(sql);
    return rows;
};

const getComputerById = async (id) => {
    const [rows] = await db.promise().query(
        `SELECT mt.*, pm.ten_phong 
         FROM may_tinh mt 
         LEFT JOIN phong_may pm ON mt.ma_phong = pm.id
         WHERE mt.id = ?`,
        [id]
    );
    return rows[0] || null;
};

const createComputer = async (data) => {
    const { 
        ma_phong, ma_may, ten_may, vi_tri, ma_qr, 
        bo_xu_ly, ram, card_do_hoa, bo_mach_chu, man_hinh, ban_phim, chuot, 
        hdd, ssd, trang_thai, ghi_chu 
    } = data;
    const sql = `
        INSERT INTO may_tinh (
            ma_phong, ma_may, ten_may, vi_tri, ma_qr,
            bo_xu_ly, ram, card_do_hoa, bo_mach_chu, man_hinh, ban_phim, chuot,
            hdd, ssd, trang_thai, ghi_chu, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`
    ;
    const [result] = await db.promise().query(sql, [
        ma_phong || null, ma_may, ten_may || null, vi_tri || null, ma_qr || null,
        bo_xu_ly || null, ram || null, card_do_hoa || null, bo_mach_chu || null, man_hinh || null, ban_phim || null, chuot || null,
        hdd || null, ssd || null, trang_thai || 'active', ghi_chu || null
    ]);
    return {
        id: result.insertId,
        ma_phong: ma_phong || null,
        ma_may,
        ten_may: ten_may || null,
        vi_tri: vi_tri || null,
        ma_qr: ma_qr || null,
        bo_xu_ly: bo_xu_ly || null,
        ram: ram || null,
        card_do_hoa: card_do_hoa || null,
        bo_mach_chu: bo_mach_chu || null,
        man_hinh: man_hinh || null,
        ban_phim: ban_phim || null,
        chuot: chuot || null,
        hdd: hdd || null,
        ssd: ssd || null,
        trang_thai: trang_thai || 'active',
        ghi_chu: ghi_chu || null
    };
};

const updateComputer = async (id, data) => {
    // 1. Lấy dữ liệu cũ để tránh ghi đè mất (vd: mất ma_qr, vi_tri)
    const [existingRows] = await db.promise().query('SELECT * FROM may_tinh WHERE id = ?', [id]);
    if (existingRows.length === 0) return 0; // Không tìm thấy máy
    const old = existingRows[0];

    // 2. Gán giá trị mới. Nếu Frontend gửi thiếu thì giữ nguyên dữ liệu Cũ
    const ma_phong = data.ma_phong !== undefined ? data.ma_phong : old.ma_phong;
    const ma_may = data.ma_may !== undefined ? data.ma_may : old.ma_may;
    const ten_may = data.ten_may !== undefined ? data.ten_may : old.ten_may;
    const vi_tri = data.vi_tri !== undefined ? data.vi_tri : old.vi_tri;
    const ma_qr = data.ma_qr !== undefined ? data.ma_qr : old.ma_qr;
    const bo_xu_ly = data.bo_xu_ly !== undefined ? data.bo_xu_ly : old.bo_xu_ly;
    const ram = data.ram !== undefined ? data.ram : old.ram;
    const card_do_hoa = data.card_do_hoa !== undefined ? data.card_do_hoa : old.card_do_hoa;
    const bo_mach_chu = data.bo_mach_chu !== undefined ? data.bo_mach_chu : old.bo_mach_chu;
    const man_hinh = data.man_hinh !== undefined ? data.man_hinh : old.man_hinh;
    const ban_phim = data.ban_phim !== undefined ? data.ban_phim : old.ban_phim;
    const chuot = data.chuot !== undefined ? data.chuot : old.chuot;
    const hdd = data.hdd !== undefined ? data.hdd : old.hdd;
    const ssd = data.ssd !== undefined ? data.ssd : old.ssd;
    const trang_thai = data.trang_thai !== undefined ? data.trang_thai : old.trang_thai;
    const ghi_chu = data.ghi_chu !== undefined ? data.ghi_chu : old.ghi_chu;

    const sql = `
        UPDATE may_tinh SET 
            ma_phong=?, ma_may=?, ten_may=?, vi_tri=?, ma_qr=?, 
            bo_xu_ly=?, ram=?, card_do_hoa=?, bo_mach_chu=?, man_hinh=?, ban_phim=?, chuot=?, 
            hdd=?, ssd=?, trang_thai=?, ghi_chu=?, updated_at=NOW()
        WHERE id=?
    `;
    
    await db.promise().query(sql, [
        ma_phong, ma_may, ten_may, vi_tri, ma_qr,
        bo_xu_ly, ram, card_do_hoa, bo_mach_chu, man_hinh, ban_phim, chuot,
        hdd, ssd, trang_thai, ghi_chu, id
    ]);
    
    // Luôn trả về 1 để vượt qua vòng kiểm tra `affectedRows === 0` (404) ở Controller
    // Đảm bảo bấm "Lưu" mà không thay đổi gì vẫn tính là Thành Công!
    return 1; 
};


const deleteComputer = async (id) => {
    const [result] = await db.promise().query('DELETE FROM may_tinh WHERE id=?', [id]);
    return result.affectedRows || 0;
};

// ======================= PHÒNG MÁY =======================
const listRooms = async () => {
    const [rows] = await db.promise().query('SELECT * FROM phong_may ORDER BY id DESC');
    return rows;
};

const getRoomById = async (id) => {
    const [rows] = await db.promise().query('SELECT * FROM phong_may WHERE id=?', [id]);
    return rows[0] || null;
};

const createRoom = async (data) => {
    const { ma_phong, ten_phong, suc_chua, mo_ta, trang_thai } = data;
    const [result] = await db.promise().query(
        `INSERT INTO phong_may (ma_phong, ten_phong, suc_chua, mo_ta, trang_thai, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [ma_phong, ten_phong, suc_chua || 0, mo_ta || null, trang_thai || 'active']
    );
    return {
        id: result.insertId,
        ma_phong,
        ten_phong,
        suc_chua: suc_chua || 0,
        mo_ta: mo_ta || null,
        trang_thai: trang_thai || 'active'
    };
};

const updateRoom = async (id, data) => {
    const { ma_phong, ten_phong, suc_chua, mo_ta, trang_thai } = data;
    const [result] = await db.promise().query(
        `UPDATE phong_may SET ma_phong=?, ten_phong=?, suc_chua=?, mo_ta=?, trang_thai=?, updated_at=NOW() WHERE id=?`,
        [ma_phong, ten_phong, suc_chua || 0, mo_ta || null, trang_thai || 'active', id]
    );
    return result.affectedRows || 0;
};

const deleteRoom = async (id) => {
    const [result] = await db.promise().query('DELETE FROM phong_may WHERE id=?', [id]);
    return result.affectedRows || 0;
};

// ======================= PHIẾU NHẬP MÁY =======================
const listImportReceipts = async () => {
    const [rows] = await db.promise().query('SELECT * FROM phieu_nhap_may ORDER BY id DESC');
    return rows;
};

const createImportReceipt = async (data) => {
    const connection = await db.promise().getConnection();
    try {
        await connection.beginTransaction();

        // MAP DỮ LIỆU CHÍNH XÁC VỚI CODE FLUTTER MỚI NHẤT
        const {
            ma_phieu_nhap, ngay_nhap, so_luong, nha_cung_cap, ghi_chu_phieu,
            ma_phong, bo_xu_ly, ram, card_do_hoa, bo_mach_chu,
            man_hinh, ban_phim, chuot, hdd, ssd
        } = data;

        // BƯỚC 1: LƯU PHIẾU NHẬP MÁY
        const [receiptResult] = await connection.query(
            `INSERT INTO phieu_nhap_may (ma_phieu_nhap, ngay_nhap, so_luong, nha_cung_cap, ghi_chu, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
            [ma_phieu_nhap || null, ngay_nhap || null, so_luong || 0, nha_cung_cap || null, ghi_chu_phieu || null]
        );
        const idPhieuNhap = receiptResult.insertId;

        // BƯỚC 2: CHẠY VÒNG LẶP THEO SỐ LƯỢNG MÁY
        if (so_luong > 0) {
            const prefix = ma_phieu_nhap ? ma_phieu_nhap.replace(/^PN-/, 'MT-') : `MT-${Date.now()}`;

            for (let i = 1; i <= so_luong; i += 1) {
                const index = i.toString().padStart(3, '0');
                const ma_may = `${prefix}-${index}`;
                const ten_may = `Máy ${index}`;
                const ma_qr = `QR-${ma_may}`;

                // 2.1: Insert Từng Máy Vào Kho
                const [mayResult] = await connection.query(
                    `INSERT INTO may_tinh
                     (ma_phong, ma_may, ten_may, vi_tri, ma_qr, bo_xu_ly, ram, card_do_hoa, bo_mach_chu, man_hinh,
                      ban_phim, chuot, hdd, ssd, trang_thai, ghi_chu, created_at, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                    [
                        ma_phong || null,
                        ma_may,
                        ten_may,
                        null, // vi_tri
                        ma_qr,
                        bo_xu_ly || null,
                        ram || null,
                        card_do_hoa || null,
                        bo_mach_chu || null,
                        man_hinh || null,
                        ban_phim || null,
                        chuot || null,
                        hdd || null,
                        ssd || null,
                        'active',
                        null // ghi_chu
                    ]
                );

                // 2.2: Insert Dữ Liệu Vào Bảng Chi Tiết Phiếu Nhập Máy
                await connection.query(
                    `INSERT INTO chi_tiet_phieu_nhap_may (ma_phieu_nhap, ma_may_tinh, ghi_chu)
                     VALUES (?, ?, ?)`,
                    [idPhieuNhap, mayResult.insertId, `Được sinh tự động từ mã phiếu ${ma_phieu_nhap}`]
                );
            }
        }

        await connection.commit();
        return { success: true, message: 'Tạo phiếu nhập, thêm máy và lưu chi tiết thành công!' };
    } catch (error) {
        await connection.rollback(); // Hủy bỏ hoàn toàn nếu có lỗi
        throw error;
    } finally {
        connection.release();
    }
};

const transferMachines = async (data) => {
    const connection = await db.promise().getConnection();
    try {
        await connection.beginTransaction();

        let mayTinhIds = data.may_tinh_ids;
        if (typeof mayTinhIds === 'string') {
            mayTinhIds = mayTinhIds ? JSON.parse(mayTinhIds) : [];
        }
        if (!Array.isArray(mayTinhIds) || mayTinhIds.length === 0) {
            throw new Error('Danh sách máy tính không hợp lệ');
        }

        const {
            ma_phong_cu, ma_phong_moi, ma_nguoi_dieu_chuyen, ly_do, ghi_chu
        } = data;
        
        await connection.query(
            `INSERT INTO lich_su_dieu_chuyen_may
             (may_tinh_ids, ma_phong_cu, ma_phong_moi, ma_nguoi_dieu_chuyen, ly_do, ghi_chu, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [JSON.stringify(mayTinhIds), ma_phong_cu || null, ma_phong_moi || null, ma_nguoi_dieu_chuyen || null, ly_do || null, ghi_chu || null]
        );
        
        await connection.query(
            `UPDATE may_tinh SET ma_phong = ? WHERE id IN (?)`,
            [ma_phong_moi || null, mayTinhIds]
        );
        
        await connection.commit();
        return { success: true, message: 'Chuyển máy thành công' };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const getTransferHistory = async () => {
    const [rows] = await db.promise().query('SELECT * FROM lich_su_dieu_chuyen_may ORDER BY id DESC');
    return rows;
};

// ======================= THIẾT BỊ KHÁC =======================
const getEquipments = async () => {
    const sql = `SELECT tb.*, pm.ten_phong FROM thiet_bi tb LEFT JOIN phong_may pm ON tb.ma_phong = pm.id ORDER BY tb.id DESC`;
    const [rows] = await db.promise().query(sql); return rows;
};
const createEquipment = async (data) => {
    const { ma_phong, ten_thiet_bi, so_luong, don_vi, trang_thai, ghi_chu } = data;
    await db.promise().query(`INSERT INTO thiet_bi (ma_phong, ten_thiet_bi, so_luong, don_vi, trang_thai, ghi_chu, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())`, [ma_phong || null, ten_thiet_bi, so_luong || 0, don_vi || null, trang_thai || 'active', ghi_chu || null]);
};
const updateEquipment = async (id, data) => {
    const { ma_phong, ten_thiet_bi, so_luong, don_vi, trang_thai, ghi_chu } = data;
    await db.promise().query(`UPDATE thiet_bi SET ma_phong=?, ten_thiet_bi=?, so_luong=?, don_vi=?, trang_thai=?, ghi_chu=?, updated_at=NOW() WHERE id=?`, [ma_phong || null, ten_thiet_bi, so_luong || 0, don_vi || null, trang_thai, ghi_chu || null, id]);
};
const deleteEquipment = async (id) => { await db.promise().query('DELETE FROM thiet_bi WHERE id=?', [id]); };

module.exports = {
    listRooms,
    getRoomById,
    createRoom,
    updateRoom,
    deleteRoom,
    listComputers: getComputers,
    getComputerById,
    createComputer,
    updateComputer,
    deleteComputer,
    listImportReceipts,
    createImportReceipt,
    transferMachines,
    getTransferHistory,
    getEquipments,
    createEquipment,
    updateEquipment,
    deleteEquipment
};