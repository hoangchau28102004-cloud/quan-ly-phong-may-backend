const db = require('../config/db');

const createImportReceipt = async (data) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Lấy dữ liệu đẩy lên từ UI Flutter
    const { 
      ma_phieu_nhap, ma_phong, ngay_nhap, tong_so_luong, nha_cung_cap, ghi_chu_phieu,
      cpu_brand, cpu_detail, ram_brand, ram_capacity, 
      gpu_type, gpu_detail, mainboard, monitor, keyboard, mouse, 
      storage_type, storage_capacity, os 
    } = data;
    
    // Ghép dữ liệu tương thích với bảng cau_hinh_may_tinh
    const boXuLy = `${cpu_brand} ${cpu_detail || ''}`.trim();
    const ram = `${ram_brand || ''} ${ram_capacity}`.trim();
    const oCung = `${storage_type} ${storage_capacity}`;
    const cardDoHoa = gpu_type === 'Card Rời' ? gpu_detail : 'Card Onboard';
    const heDieuHanh = os;
    const manHinh = monitor || 'Không có';
    
    // Các linh kiện không có cột riêng sẽ được gộp vào Ghi chú cấu hình
    const ghiChuCauHinh = `Bo mạch chủ: ${mainboard || 'Không rõ'} | Bàn phím: ${keyboard || 'Không'} | Chuột: ${mouse || 'Không'}`;

    // Lưu vào bảng cau_hinh_may_tinh 
    const [configResult] = await connection.query(
      `INSERT INTO cau_hinh_may_tinh (bo_xu_ly, ram, o_cung, card_do_hoa, man_hinh, he_dieu_hanh, ghi_chu, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [boXuLy, ram, oCung, cardDoHoa, manHinh, heDieuHanh, ghiChuCauHinh]
    );
    const maCauHinh = configResult.insertId;

    // Gộp ghi chú để lưu vào Phiếu Nhập [cite: 31]
    const cauHinhSoBo = `CPU: ${boXuLy} | RAM: ${ram} | VGA: ${cardDoHoa} | HDD/SSD: ${oCung}`;
    const ghiChuFinal = `Nhà cung cấp: ${nha_cung_cap || 'Không'}\nCấu hình: ${cauHinhSoBo}\nGhi chú thêm: ${ghi_chu_phieu || ''}`;

    await connection.query(
      `INSERT INTO phieu_nhap_may 
      (ma_phieu_nhap, ma_phong, ngay_nhap, tong_so_luong, cau_hinh_so_bo, trang_thai, ghi_chu, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, 'draft', ?, NOW(), NOW())`,
      [ma_phieu_nhap, ma_phong, ngay_nhap, tong_so_luong, cauHinhSoBo, ghiChuFinal]
    );

    // Sinh máy tính hàng loạt [cite: 23]
    if (tong_so_luong > 0) {
      const maMayPrefix = ma_phieu_nhap.replace('PN-', 'PC-');
      let insertValues = [];
      
      for (let i = 1; i <= tong_so_luong; i++) {
        const soThuTu = i.toString().padStart(3, '0');
        const maMay = `${maMayPrefix}-${soThuTu}`;
        const tenMay = `Máy ${soThuTu}`;
        
        insertValues.push([ma_phong, maCauHinh, maMay, tenMay, 'active', new Date(), new Date()]);
      }

      await connection.query(
        `INSERT INTO may_tinh (ma_phong, ma_cau_hinh, ma_may, ten_may, trang_thai, created_at, updated_at) VALUES ?`,
        [insertValues]
      );
    }

    await connection.commit();
    return { success: true, message: 'Tạo phiếu nhập và cấu hình thành công!' };

  } catch (error) {
    await connection.rollback();
    throw new Error('Lỗi Transaction: ' + error.message);
  } finally {
    connection.release();
  }
};

module.exports = { createImportReceipt };