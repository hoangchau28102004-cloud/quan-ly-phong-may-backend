const db = require('../config/db');

const createImportReceipt = async (data) => {
  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();

    const {
      ma_phieu_nhap, ma_phong, ngay_nhap, tong_so_luong = 0, nha_cung_cap, ghi_chu_phieu,
      cpu_brand, cpu_detail, ram_brand, ram_capacity,
      gpu_type, gpu_detail, mainboard, monitor, keyboard, mouse,
      storage_type, storage_capacity, os
    } = data;

    const boXuLy = `${cpu_brand || ''} ${cpu_detail || ''}`.trim() || null;
    const ram = `${ram_brand || ''} ${ram_capacity || ''}`.trim() || null;
    const cardDoHoa = gpu_type === 'Card Rời' ? (gpu_detail || null) : 'Card Onboard';
    const hdd = storage_type === 'HDD' ? storage_capacity || null : null;
    const ssd = storage_type === 'SSD' ? storage_capacity || null : null;
    const ghiChuCauHinh = `Bo mạch chủ: ${mainboard || 'Không rõ'} | Bàn phím: ${keyboard || 'Không'} | Chuột: ${mouse || 'Không'}`;
    const ghiChuFinal = `Nhà cung cấp: ${nha_cung_cap || 'Không'}\nCấu hình: ${ghiChuCauHinh}\nGhi chú thêm: ${ghi_chu_phieu || ''}`;

    await connection.query(
      `INSERT INTO phieu_nhap_may
       (ma_phieu_nhap, ngay_nhap, so_luong, nha_cung_cap, ghi_chu, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [ma_phieu_nhap || null, ngay_nhap || null, tong_so_luong || 0, nha_cung_cap || null, ghiChuFinal]
    );

    if (tong_so_luong > 0) {
      const prefix = ma_phieu_nhap ? ma_phieu_nhap.replace(/^PN-/, 'MT-') : `MT-${Date.now()}`;
      const rows = [];

      for (let i = 1; i <= tong_so_luong; i += 1) {
        const index = i.toString().padStart(3, '0');
        const ma_may = `${prefix}-${index}`;
        const ten_may = `Máy ${index}`;
        const ma_qr = `QR-${ma_may}`;

        rows.push([
          ma_phong || null,
          ma_may,
          ten_may,
          null,
          ma_qr,
          boXuLy,
          ram,
          cardDoHoa,
          mainboard || null,
          monitor || null,
          keyboard || null,
          mouse || null,
          hdd,
          ssd,
          'active',
          ghiChuCauHinh,
          new Date(),
          new Date()
        ]);
      }

      await connection.query(
        `INSERT INTO may_tinh
         (ma_phong, ma_may, ten_may, vi_tri, ma_qr, bo_xu_ly, ram, card_do_hoa,
          bo_mach_chu, man_hinh, ban_phim, chuot, hdd, ssd, trang_thai, ghi_chu, created_at, updated_at)
         VALUES ?`,
        [rows]
      );
    }

    await connection.commit();
    return { success: true, message: 'Tạo phiếu nhập thành công' };
  } catch (error) {
    await connection.rollback();
    throw new Error('Lỗi Transaction: ' + error.message);
  } finally {
    connection.release();
  }
};

module.exports = { createImportReceipt };