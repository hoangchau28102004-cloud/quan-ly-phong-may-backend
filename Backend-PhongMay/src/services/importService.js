const db = require('../config/db');

const createImportReceipt = async (data) => {
  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();

    const {
      ma_phieu_nhap, ma_phong, ngay_nhap, so_luong, tong_so_luong,
      nha_cung_cap, ghi_chu_phieu,
      bo_xu_ly, ram, card_do_hoa, bo_mach_chu, man_hinh, ban_phim, chuot,
      hdd, ssd, chi_tiet_may 
    } = data;

    const finalSoLuong = so_luong || tong_so_luong || 0;
    const ghiChuCauHinh = `Bo mạch chủ: ${bo_mach_chu || 'Không rõ'} | Bàn phím: ${ban_phim || 'Không'} | Chuột: ${chuot || 'Không'}`;
    const ghiChuFinal = `Nhà cung cấp: ${nha_cung_cap || 'Không'}\nCấu hình: ${ghiChuCauHinh}\nGhi chú thêm: ${ghi_chu_phieu || ''}`;

    // 1. Lưu thông tin Phiếu Nhập với mã tạm để tránh NULL
    const tempReceiptCode = `PN-${Date.now()}`;
    const [receiptResult] = await connection.query(
      `INSERT INTO phieu_nhap_may
       (ma_phieu_nhap, ngay_nhap, so_luong, nha_cung_cap, ghi_chu, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [tempReceiptCode, ngay_nhap || null, finalSoLuong, nha_cung_cap || null, ghiChuFinal]
    );
    const idPhieuNhap = receiptResult.insertId;

    // 1.1 Sinh mã phiếu nhập tuần tự từ ID
    const generatedMaPhieuNhap = `PN-${idPhieuNhap.toString().padStart(6, '0')}`;
    await connection.query(
      `UPDATE phieu_nhap_may SET ma_phieu_nhap = ? WHERE id = ?`,
      [generatedMaPhieuNhap, idPhieuNhap]
    );

    // 2. Lưu danh sách máy tính (Sử dụng mã phiếu nhập đã sinh tự động làm tiền tố)
    if (chi_tiet_may && chi_tiet_may.length > 0) {
      const prefix = generatedMaPhieuNhap.replace(/^PN-/, 'MT-');
      let currentIndex = 1;

      for (const may of chi_tiet_may) {
        const sttStr = currentIndex.toString().padStart(3, '0');
        const ma_may = `${prefix}-${sttStr}`;
        const ten_may = ma_may;
        const ma_qr = `QR-${ma_may}`;
        const trang_thai = may.trang_thai || 'active';

        const [mayResult] = await connection.query(
          `INSERT INTO may_tinh
           (ma_phong, ma_may, ten_may, vi_tri, ma_qr, bo_xu_ly, ram, card_do_hoa,
            bo_mach_chu, man_hinh, ban_phim, chuot, hdd, ssd, trang_thai, ghi_chu, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            ma_phong || null, ma_may, ten_may, null, ma_qr, bo_xu_ly || null, ram || null, card_do_hoa || null,
            bo_mach_chu || null, man_hinh || null, ban_phim || null, chuot || null, hdd || null, ssd || null,
            trang_thai, ghiChuCauHinh
          ]
        );

        await connection.query(
          `INSERT INTO chi_tiet_phieu_nhap_may (ma_phieu_nhap, ma_may_tinh, ghi_chu) VALUES (?, ?, ?)`,
          [idPhieuNhap, mayResult.insertId, `Được sinh tự động từ mã phiếu ${generatedMaPhieuNhap}`]
        );

        currentIndex++;
      }
    }

    await connection.commit();
    return { success: true, message: 'Tạo phiếu nhập và sinh máy thành công', ma_phieu_nhap: generatedMaPhieuNhap };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getImportReceipts = async () => {
  const connection = await db.promise().getConnection();

  try {
    const [rows] = await connection.query(
      `SELECT id, ma_phieu_nhap, ngay_nhap, so_luong, nha_cung_cap, ghi_chu AS ghi_chu_phieu, created_at, updated_at
       FROM phieu_nhap_may
       ORDER BY created_at DESC`
    );
    return rows;
  } finally {
    connection.release();
  }
};

module.exports = { createImportReceipt, getImportReceipts };