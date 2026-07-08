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
        id: result.insertId, ma_phong: ma_phong || null, ma_may, ten_may: ten_may || null,
        vi_tri: vi_tri || null, ma_qr: ma_qr || null, bo_xu_ly: bo_xu_ly || null, ram: ram || null,
        card_do_hoa: card_do_hoa || null, bo_mach_chu: bo_mach_chu || null, man_hinh: man_hinh || null,
        ban_phim: ban_phim || null, chuot: chuot || null, hdd: hdd || null, ssd: ssd || null,
        trang_thai: trang_thai || 'active', ghi_chu: ghi_chu || null
    };
};

const updateComputer = async (id, data) => {
    const [existingRows] = await db.promise().query('SELECT * FROM may_tinh WHERE id = ?', [id]);
    if (existingRows.length === 0) return 0;
    const old = existingRows[0];

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
        ma_phong, ma_may, ten_may, vi_tri, ma_qr, bo_xu_ly, ram, card_do_hoa, bo_mach_chu, 
        man_hinh, ban_phim, chuot, hdd, ssd, trang_thai, ghi_chu, id
    ]);
    return 1; 
};
// ============================================================================
// 1. XÓA MÁY TÍNH (XÓA CỨNG - NHỔ SẠCH KHÓA NGOẠI TRƯỚC KHI TRẢM)
// ============================================================================
const deleteComputer = async (id) => {
    const connection = await db.promise().getConnection();
    try {
        await connection.beginTransaction();

        // Diệt cỏ tận gốc ở các bảng chi tiết để không bị lỗi Foreign Key Constraint
        await connection.query('DELETE FROM chi_tiet_phieu_nhap_may WHERE ma_may_tinh = ?', [id]);
        await connection.query('DELETE FROM chi_tiet_phieu_muon_may WHERE ma_may_tinh = ?', [id]);
        await connection.query('DELETE FROM chi_tiet_phieu_tra_may WHERE ma_may_tinh = ?', [id]);

        // Trảm máy tính
        const [result] = await connection.query('DELETE FROM may_tinh WHERE id = ?', [id]);

        await connection.commit();
        return result.affectedRows || 0;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
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
    return { id: result.insertId, ma_phong, ten_phong, suc_chua: suc_chua || 0, mo_ta: mo_ta || null, trang_thai: trang_thai || 'active' };
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

// ============================================================================
// 1. TẠO PHIẾU NHẬP MÁY (CHẶN ĐỨNG LỖI DB KHI DỮ LIỆU BỊ NULL)
// ============================================================================
const createImportReceipt = async (data) => {
    const connection = await db.promise().getConnection();

    try {
        await connection.beginTransaction();

        // 🚨 NẾU THIẾU MÃ PHÒNG (NOT NULL TRONG DB) LÀ QUĂNG LỖI NGAY TẠI ĐÂY
        if (!data.ma_phong) {
            throw new Error("Lỗi: Ứng dụng Flutter chưa truyền lên [ma_phong]. Không thể lưu vào Database!");
        }

        // Tạo sẵn các biến default để Database không bị sập ER_BAD_NULL_ERROR
        const ma_phieu_nhap = data.ma_phieu_nhap || `PN-${Date.now()}`;
        const ngay_nhap = data.ngay_nhap || new Date().toISOString().split('T')[0];
        const so_luong = data.so_luong || data.tong_so_luong || (data.chi_tiet_may ? data.chi_tiet_may.length : 0);
        const nha_cung_cap = data.nha_cung_cap || 'Không xác định';
        
        const bo_xu_ly = data.bo_xu_ly || 'Không';
        const ram = data.ram || 'Không';
        const card_do_hoa = data.card_do_hoa || 'Không';
        const bo_mach_chu = data.bo_mach_chu || 'Không';
        const man_hinh = data.man_hinh || 'Không';
        const ban_phim = data.ban_phim || 'Không';
        const chuot = data.chuot || 'Không';
        const hdd = data.hdd || 'Không';
        const ssd = data.ssd || 'Không';

        const ghiChuCauHinh = `Bo mạch chủ: ${bo_mach_chu} | Bàn phím: ${ban_phim} | Chuột: ${chuot}`;
        const ghiChuFinal = `Nhà cung cấp: ${nha_cung_cap}\nCấu hình: ${ghiChuCauHinh}\nGhi chú thêm: ${data.ghi_chu_phieu || ''}`;

        // 1. Lưu thông tin Phiếu Nhập
        const [receiptResult] = await connection.query(
            `INSERT INTO phieu_nhap_may (ma_phieu_nhap, ngay_nhap, so_luong, nha_cung_cap, ghi_chu, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
            [ma_phieu_nhap, ngay_nhap, so_luong, nha_cung_cap, ghiChuFinal]
        );
        const idPhieuNhap = receiptResult.insertId;

        // 2. Chạy vòng lặp sinh máy
        if (data.chi_tiet_may && data.chi_tiet_may.length > 0) {
            const prefix = ma_phieu_nhap.replace(/^PN-/, 'MT-');
            let currentIndex = 1;

            for (const may of data.chi_tiet_may) {
                const sttStr = currentIndex.toString().padStart(3, '0');
                
                // 🚀 GÁN MÃ VÀ TÊN BẰNG NHAU ĐỂ CHỐNG LỖI DUPLICATE "MÁY 001"
                const ma_may = `${prefix}-${sttStr}`;
                const ten_may = ma_may; 
                const ma_qr = `QR-${ma_may}`;
                const trang_thai = may.trang_thai || 'active';

                const [mayResult] = await connection.query(
                    `INSERT INTO may_tinh
                     (ma_phong, ma_may, ten_may, vi_tri, ma_qr, bo_xu_ly, ram, card_do_hoa, bo_mach_chu, man_hinh,
                      ban_phim, chuot, hdd, ssd, trang_thai, ghi_chu, created_at, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                    [
                        data.ma_phong, ma_may, ten_may, null, ma_qr, bo_xu_ly, ram, card_do_hoa,
                        bo_mach_chu, man_hinh, ban_phim, chuot, hdd, ssd,
                        trang_thai, ghiChuCauHinh
                    ]
                );

                await connection.query(
                    `INSERT INTO chi_tiet_phieu_nhap_may (ma_phieu_nhap, ma_may_tinh, ghi_chu) VALUES (?, ?, ?)`,
                    [idPhieuNhap, mayResult.insertId, `Được sinh tự động từ mã phiếu ${ma_phieu_nhap}`]
                );
                currentIndex++; 
            }
        }

        await connection.commit();
        return { success: true, message: 'Tạo phiếu nhập và sinh máy thành công' };
    } catch (error) {
        await connection.rollback();
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

        const { ma_phong_cu, ma_phong_moi, ma_nguoi_dieu_chuyen, ly_do, ghi_chu } = data;
        
        await connection.query(
            `INSERT INTO lich_su_dieu_chuyen_may
             (may_tinh_ids, ma_phong_cu, ma_phong_moi, ma_nguoi_dieu_chuyen, ly_do, ghi_chu, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [JSON.stringify(mayTinhIds), ma_phong_cu || null, ma_phong_moi || null, ma_nguoi_dieu_chuyen || null, ly_do || null, ghi_chu || null]
        );
        
        await connection.query(`UPDATE may_tinh SET ma_phong = ? WHERE id IN (?)`, [ma_phong_moi || null, mayTinhIds]);
        
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

const scanLecturerMachine = async (qrCode) => {
    const connection = await db.promise().getConnection();
    try {
        // 1. Tìm thông tin máy tính dựa vào mã QR
        const [machines] = await connection.query(`
            SELECT mt.*, pm.ten_phong 
            FROM may_tinh mt 
            JOIN phong_may pm ON mt.ma_phong = pm.id 
            WHERE mt.ma_qr = ? AND mt.trang_thai = 'active'
        `, [qrCode]);

        if (machines.length === 0) {
            throw new Error('Mã QR không hợp lệ hoặc máy tính không tồn tại.');
        }

        const machine = machines[0];

        // 2. Tìm lịch học ĐANG DIỄN RA tại phòng máy này trong ngày hôm nay
        // (Giả sử lấy lịch học của ngày hiện tại)
        const [schedules] = await connection.query(`
            SELECT ls.id AS ma_lich, ls.so_tiet_bat_dau, ls.so_tiet_ket_thuc,
                   lhp.ma_lop_hoc_phan, mh.ten_mon
            FROM lich_su_dung_phong_may ls
            JOIN lop_hoc_phan lhp ON ls.ma_lop_hoc_phan = lhp.id
            JOIN mon_hoc mh ON lhp.ma_mon = mh.id
            WHERE ls.ma_phong = ? AND ls.ngay_hoc_cu_the = CURRENT_DATE()
            LIMIT 1
        `, [machine.ma_phong]);

        return {
            machine: machine,
            current_schedule: schedules.length > 0 ? schedules[0] : null
        };
    } catch (error) {
        console.error("LỖI QUÉT QR GIẢNG VIÊN:", error.message);
        throw error;
    } finally {
        connection.release();
    }
};
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
    deleteEquipment,
    scanLecturerMachine
};