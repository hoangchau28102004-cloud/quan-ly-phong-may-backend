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

        // Tạo sẵn mã phiếu tạm để tránh NULL trong DB; sẽ cập nhật lại sau khi có insertId
        const initialReceiptCode = data.ma_phieu_nhap || `PN-PENDING-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
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
            [initialReceiptCode, ngay_nhap, so_luong, nha_cung_cap, ghiChuFinal]
        );
        const idPhieuNhap = receiptResult.insertId;

        const ma_phieu_nhap = `PN-${idPhieuNhap}`;
        await connection.query(
            `UPDATE phieu_nhap_may SET ma_phieu_nhap = ? WHERE id = ?`,
            [ma_phieu_nhap, idPhieuNhap]
        );

        // 2. Chạy vòng lặp sinh máy
        if (data.chi_tiet_may && data.chi_tiet_may.length > 0) {
            const prefix = ma_phieu_nhap.replace(/^PN-/, 'PC-');
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
        
        // 1. Lưu thông tin vào bảng lịch sử điều chuyển (BẢNG CHA)
        const [resultLichSu] = await connection.query(
            `INSERT INTO lich_su_dieu_chuyen_may
             (ma_phong_cu, ma_phong_moi, ma_nguoi_dieu_chuyen, ly_do, ghi_chu, thoi_gian_dieu_chuyen, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
            [ma_phong_cu || null, ma_phong_moi || null, ma_nguoi_dieu_chuyen || null, ly_do || null, ghi_chu || null]
        );
        const lichSuId = resultLichSu.insertId;

        // ================= LOGIC AUTO VỊ TRÍ & TÊN MÁY MỚI =================
        // Lấy tên phòng mới (Ví dụ: "F7.1" hoặc "Kho")
        const [phongMoi] = await connection.query(`SELECT ten_phong FROM phong_may WHERE id = ?`, [ma_phong_moi]);
        const tenPhongMoi = phongMoi[0]?.ten_phong || 'PHONG';

        // Đếm xem phòng mới đang có bao nhiêu cái máy để lấy số bắt đầu
        const [countRes] = await connection.query(`SELECT COUNT(*) as total FROM may_tinh WHERE ma_phong = ?`, [ma_phong_moi]);
        let currentCount = countRes[0].total;
        // ===================================================================

        // 2. Lưu từng máy tính vào bảng chi tiết & Cập nhật tên/vị trí
        for (const idMay of mayTinhIds) {
            
            // Xử lý sinh Tên máy và Vị trí
            currentCount++; 
            // .padStart(2, '0') sẽ biến số 1 thành "01", số 9 thành "09", số 10 thành "10"
            const viTriMoi = currentCount.toString().padStart(2, '0'); 
            
            // Ghép lại thành tên mới: F7.1-01
            let tenMayMoi = `${tenPhongMoi}-${viTriMoi}`;

            // Lưu ý UX: Nếu chuyển vào "KHO" thì có thể không cần vị trí
            let viTriLuuDB = viTriMoi;
            if (tenPhongMoi.toLowerCase().includes('kho')) {
                // Nếu vào Kho thì đặt tên là KHO-01, nhưng vị trí trong Kho thường không xác định (tùy bác quyết định)
                // viTriLuuDB = null; // Bỏ comment dòng này nếu muốn Kho thì vị trí = NULL
            }

            // Ghi vào bảng chi tiết điều chuyển
            await connection.query(
                `INSERT INTO chi_tiet_dieu_chuyen_may 
                 (ma_lich_su_dieu_chuyen, ma_may_tinh, ghi_chu, created_at, updated_at)
                 VALUES (?, ?, ?, NOW(), NOW())`,
                [lichSuId, idMay, 'Hệ thống tự động chuyển và đổi tên']
            );

            // UPDATE BẢNG MÁY TÍNH: Phòng mới, Tên mới, Vị trí mới
            await connection.query(
                `UPDATE may_tinh 
                 SET ma_phong = ?, 
                     ten_may = ?, 
                     vi_tri = ?, 
                     updated_at = NOW() 
                 WHERE id = ?`, 
                [ma_phong_moi, tenMayMoi, viTriLuuDB, idMay]
            );
        }
        
        await connection.commit();
        return { success: true, message: 'Điều chuyển và cập nhật vị trí máy thành công' };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const getTransferHistory = async () => {
    // SỬ DỤNG JOIN VÀ GROUP_CONCAT ĐỂ GOM MÃ MÁY TỪ BẢNG CHI TIẾT
    const sql = `
        SELECT 
            ls.id,
            ls.thoi_gian_dieu_chuyen,
            ls.ly_do,
            ls.ghi_chu,
            pc.ten_phong AS tu_phong,
            pm.ten_phong AS den_phong,
            nd.ho_ten AS nguoi_dieu_chuyen,
            GROUP_CONCAT(mt.ma_may SEPARATOR ', ') AS danh_sach_may
        FROM lich_su_dieu_chuyen_may ls
        LEFT JOIN phong_may pc ON ls.ma_phong_cu = pc.id
        LEFT JOIN phong_may pm ON ls.ma_phong_moi = pm.id
        LEFT JOIN nguoi_dung nd ON ls.ma_nguoi_dieu_chuyen = nd.id
        LEFT JOIN chi_tiet_dieu_chuyen_may ct ON ls.id = ct.ma_lich_su_dieu_chuyen
        LEFT JOIN may_tinh mt ON ct.ma_may_tinh = mt.id
        GROUP BY ls.id
        ORDER BY ls.thoi_gian_dieu_chuyen DESC
    `;
    const [rows] = await db.promise().query(sql);
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
const getAvailableMachinesForBorrow = async () => {
    // Tìm các máy đang 'active' và không nằm trong các phiếu mượn chưa trả
    const sql = `
        SELECT mt.id, mt.ma_may, mt.ten_may, pm.ten_phong 
        FROM may_tinh mt
        LEFT JOIN phong_may pm ON mt.ma_phong = pm.id
        WHERE mt.trang_thai = 'active' 
        AND mt.id NOT IN (
            SELECT ct.ma_may_tinh 
            FROM chi_tiet_phieu_muon_may ct
            JOIN phieu_muon_may p ON ct.ma_phieu_muon = p.id
            WHERE p.trang_thai IN ('Chờ duyệt', 'Đang mượn')
        )
    `;
    const [rows] = await db.promise().query(sql);
    return rows;
};

// Admin duyệt phiếu mượn và cấp phát máy cụ thể
const approveBorrowRequest = async (phieuId, machineIds) => {
    const connection = await db.promise().getConnection();
    try {
        await connection.beginTransaction();

        // 1. Cập nhật trạng thái phiếu mượn thành 'Đã duyệt' (hoặc 'Đang mượn')
        await connection.query(
            `UPDATE phieu_muon_may SET trang_thai = 'Đang mượn', updated_at = NOW() WHERE id = ?`,
            [phieuId]
        );

        // 2. Insert từng máy tính được admin tick chọn vào chi_tiet_phieu_muon_may
        for (const machineId of machineIds) {
            await connection.query(
                `INSERT INTO chi_tiet_phieu_muon_may (ma_phieu_muon, ma_may_tinh, tinh_trang_khi_muon) 
                 VALUES (?, ?, 'Hoạt động tốt')`,
                [phieuId, machineId]
            );
        }

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};
// ============================================================================
// HÀM MỚI: XỬ LÝ TRẢ MÁY CỦA ADMIN (LƯU KÈM CHI TIẾT)
// ============================================================================
const createReturnTicket = async (data) => {
    const { ma_phieu_muon_id, may_tinh_ids, ghi_chu, thoi_gian_tra } = data;
    const so_luong_tra = may_tinh_ids.length; 
    const connection = await db.promise().getConnection();

    try {
        await connection.beginTransaction();

        // ⚠️ ĐÃ SỬA: Sửa lại tên cột truy vấn cho khớp với CSDL thực tế (Bỏ ma_giang_vien)
        const [phieuMuon] = await connection.query('SELECT so_luong FROM phieu_muon_may WHERE id = ?', [ma_phieu_muon_id]);
        if (phieuMuon.length === 0) throw new Error('Phiếu mượn không tồn tại!');

        const current_so_luong = phieuMuon[0].so_luong;

        let formattedDate = thoi_gian_tra;
        if (!formattedDate) {
            const now = new Date();
            now.setHours(now.getHours() + 7);
            formattedDate = now.toISOString().slice(0, 19).replace('T', ' ');
        } else if (formattedDate.includes('T')) {
            formattedDate = formattedDate.slice(0, 19).replace('T', ' ');
        }

        // 🚀 LOGIC TỰ ĐỘNG TẠO MÃ PHIẾU TRẢ (Định dạng: PT-001, PT-002...)
        const [lastTicket] = await connection.query('SELECT ma_phieu_tra FROM phieu_tra_may ORDER BY id DESC LIMIT 1');
        let nextId = 1;
        if (lastTicket.length > 0 && lastTicket[0].ma_phieu_tra) {
            // Tách lấy phần số đằng sau dấu gạch ngang
            const parts = lastTicket[0].ma_phieu_tra.split('-');
            if (parts.length === 2) {
                nextId = parseInt(parts[1], 10) + 1;
            }
        }
        const ma_phieu_tra = `PT-${nextId.toString().padStart(3, '0')}`;

        // ⚠️ ĐÃ SỬA: Insert khớp với các cột trên phpMyAdmin (Thêm trang_thai, bỏ ma_giang_vien)
        const queryPhieuTra = `
            INSERT INTO phieu_tra_may (ma_phieu_tra, ma_phieu_muon, thoi_gian_tra, so_luong, trang_thai, ghi_chu, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'confirmed', ?, NOW(), NOW())
        `;
        const [resultTra] = await connection.execute(queryPhieuTra, [
            ma_phieu_tra, 
            ma_phieu_muon_id, 
            formattedDate,
            so_luong_tra, 
            ghi_chu || null 
        ]);
        const phieuTraId = resultTra.insertId;

        // 3. Xử lý nhả từng máy
        for (const maMay of may_tinh_ids) {
            const [may] = await connection.query('SELECT id FROM may_tinh WHERE ma_may = ?', [maMay]);

            if (may.length > 0) {
                const mayId = may[0].id;

                await connection.execute(
                    `INSERT INTO chi_tiet_phieu_tra_may (ma_phieu_tra, ma_may_tinh, tinh_trang_khi_tra, created_at, updated_at)
                     VALUES (?, ?, 'Hoạt động bình thường', NOW(), NOW())`,
                    [phieuTraId, mayId]
                );
                
                await connection.execute(
                    `UPDATE may_tinh SET trang_thai = 'active', updated_at = NOW() WHERE id = ?`,
                    [mayId]
                );
                
                await connection.execute(
                    `UPDATE chi_tiet_phieu_muon_may SET tinh_trang_khi_muon = 'Đã trả' WHERE ma_phieu_muon = ? AND ma_may_tinh = ?`,
                    [ma_phieu_muon_id, mayId]
                );
            }
        }

        // 4. Cập nhật lại số lượng nợ và trạng thái phiếu mượn gốc
        const new_so_luong = current_so_luong - so_luong_tra;
        const trang_thai_moi = new_so_luong <= 0 ? 'Đã trả' : 'Đang mượn';

        await connection.execute(
            `UPDATE phieu_muon_may SET so_luong = ?, trang_thai = ?, updated_at = NOW() WHERE id = ?`,
            [new_so_luong < 0 ? 0 : new_so_luong, trang_thai_moi, ma_phieu_muon_id]
        );

        await connection.commit();
        return { ma_phieu_tra, so_luong_con_lai: new_so_luong };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// ==================== LỊCH SỬ MÁY CỤ THỂ ====================
const getMachineHistory = async (machineId) => {
    const [rows] = await db.promise().query(
        `SELECT mt.*, pm.ten_phong FROM may_tinh mt 
         LEFT JOIN phong_may pm ON mt.ma_phong = pm.id
         WHERE mt.id = ?`,
        [machineId]
    );
    return rows[0] || null;
};

// Lịch sử điều chuyển của máy cụ thể
// Thay thế hàm getMachineTransferHistory cũ bằng hàm này
const getMachineTransferHistory = async (machineId) => {
    // JOIN qua bảng chi tiết để tìm đúng máy, đồng thời JOIN lấy tên phòng, tên người
    const sql = `
        SELECT 
            ls.thoi_gian_dieu_chuyen, 
            ls.ly_do, 
            nd.ho_ten as nguoi_thao_tac,
            pc.ten_phong as tu_phong, 
            pm.ten_phong as den_phong
        FROM chi_tiet_dieu_chuyen_may ct
        JOIN lich_su_dieu_chuyen_may ls ON ct.ma_lich_su_dieu_chuyen = ls.id
        LEFT JOIN phong_may pc ON ls.ma_phong_cu = pc.id
        LEFT JOIN phong_may pm ON ls.ma_phong_moi = pm.id
        LEFT JOIN nguoi_dung nd ON ls.ma_nguoi_dieu_chuyen = nd.id
        WHERE ct.ma_may_tinh = ?
        ORDER BY ls.thoi_gian_dieu_chuyen DESC
    `;
    const [rows] = await db.promise().query(sql, [machineId]);
    return rows;
};

// Lịch sử mượn của máy cụ thể
const getMachineBorrowHistory = async (machineId) => {
    const [rows] = await db.promise().query(
        `SELECT DISTINCT 
            pm.id, pm.ma_phieu_muon, pm.ngay_muon, pm.trang_thai, 
            pm.ma_phong_ban, pb.ten_phong_ban,
            cpm.tinh_trang_khi_muon, cpm.ghi_chu
         FROM chi_tiet_phieu_muon_may cpm
         JOIN phieu_muon_may pm ON cpm.ma_phieu_muon = pm.id
         LEFT JOIN phong_ban pb ON pm.ma_phong_ban = pb.id
         WHERE cpm.ma_may_tinh = ?
         ORDER BY pm.ngay_muon DESC`,
        [machineId]
    );
    return rows;
};

// Lịch sử trả của máy cụ thể
const getMachineReturnHistory = async (machineId) => {
    const [rows] = await db.promise().query(
        `SELECT DISTINCT 
            pt.id, pt.ma_phieu_tra, pt.thoi_gian_tra, pt.trang_thai, pt.ghi_chu,
            pm.ma_phieu_muon, cpt.tinh_trang_khi_tra
         FROM chi_tiet_phieu_tra_may cpt
         JOIN phieu_tra_may pt ON cpt.ma_phieu_tra = pt.id
         LEFT JOIN phieu_muon_may pm ON pt.ma_phieu_muon = pm.id
         WHERE cpt.ma_may_tinh = ?
         ORDER BY pt.thoi_gian_tra DESC`,
        [machineId]
    );
    return rows;
};

// Lịch sử bảo trì của máy cụ thể
const getMachineMaintenanceHistory = async (machineId) => {
    const [rows] = await db.promise().query(
        `SELECT * FROM bao_cao_su_co 
         WHERE ma_may_tinh = ?
         ORDER BY created_at DESC`,
        [machineId]
    );
    return rows;
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
    getMachineHistory,
    getMachineTransferHistory,
    getMachineBorrowHistory,
    getMachineReturnHistory,
    getMachineMaintenanceHistory,
    getEquipments,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    scanLecturerMachine,
    getAvailableMachinesForBorrow,
    approveBorrowRequest,
    createReturnTicket
};