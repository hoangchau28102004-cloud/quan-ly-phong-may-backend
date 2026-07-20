const issueService = require('../services/issueService');
const notificationService = require('../services/notificationService');
const db = require('../config/db');

const getComputers = async (req, res, next) => {
  try {
    const { ma_phong } = req.query;
    const data = await issueService.getComputersByRoom(ma_phong);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const reportIssue = async (req, res, next) => {
  try {
    console.log("=========================================");
    console.log("👉 [1] ĐÃ NHẬN REQUEST BÁO CÁO TỪ FLUTTER");
    
    const { ma_nguoi_bao_cao, ma_may_tinh, loai_su_co, tieu_de, mo_ta, muc_do } = req.body;
    
    // 1. Lưu báo cáo sự cố vào DB
    const insertId = await issueService.createIssueReport({
      ma_nguoi_bao_cao,
      ma_may_tinh,
      loai_su_co,
      tieu_de,
      mo_ta,
      muc_do
    });
    console.log(`✅ Đã lưu vào bao_cao_su_co thành công. ID mới: ${insertId}`);

    // 🚀 2. TẠO THÔNG BÁO CHO ADMIN
    try {
        console.log("👉 [2] Bắt đầu tiến trình tạo thông báo...");
        
        // Tìm tên người báo cáo
        const [userRows] = await db.promise().query('SELECT ho_ten FROM nguoi_dung WHERE id = ?', [ma_nguoi_bao_cao]);
        const tenNguoiBao = userRows.length > 0 ? userRows[0].ho_ten : 'Người dùng hệ thống';

        let noiDungThongBao = `Tài khoản ${tenNguoiBao} vừa báo cáo lỗi: ${tieu_de} (${loai_su_co}).`;

        // Tìm thông tin máy tính
        if (ma_may_tinh) {
            const [machineRows] = await db.promise().query(`
                SELECT mt.ten_may, pm.ten_phong 
                FROM may_tinh mt 
                LEFT JOIN phong_may pm ON mt.ma_phong = pm.id 
                WHERE mt.id = ?
            `, [ma_may_tinh]);

            if (machineRows.length > 0) {
                noiDungThongBao = `Tài khoản ${tenNguoiBao} vừa báo lỗi (${loai_su_co}) trên máy [${machineRows[0].ten_may}] tại phòng [${machineRows[0].ten_phong || 'Chưa xếp phòng'}].`;
            }
        }

        // Tìm ID Admin
        const [adminRows] = await db.promise().query("SELECT id FROM nguoi_dung WHERE ma_vai_tro = 1 OR id = 33");
        console.log("👉 [3] Tìm thấy các Admin cần gửi:", adminRows.map(a => a.id));

        for (const admin of adminRows) {
            // ĐÃ THÊM LẠI updated_at VÀ NOW() VÀO ĐÂY ĐỂ TRÁNH LỖI NGẦM
            await db.promise().query(
                `INSERT INTO thong_bao (ma_nguoi_dung, tieu_de, noi_dung, loai_thong_bao, da_doc, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
                [admin.id, 'Sự cố phòng máy mới!', noiDungThongBao, 'incident', 0]
            );
        }
        console.log("🎉🎉🎉 [4] XONG! Đã đẩy thành công dữ liệu vào bảng thong_bao!");
        
    } catch (notifError) {
        // NẾU CÒN LỖI, NÓ SẼ IN ĐỎ CHÓT Ở ĐÂY
        console.error("❌❌❌ LỖI CHÍ MẠNG TẠI KHỐI THÔNG BÁO:", notifError);
    }

    console.log("=========================================\n");
    // 3. Trả kết quả về cho Flutter
    res.json({ success: true, message: 'Báo cáo sự cố thành công!', data: { id: insertId } });
  } catch (error) {
    console.error("❌ LỖI TOÀN HỆ THỐNG:", error);
    next(error);
  }
};

const updateIssueStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { trang_thai, ma_nguoi_duyet } = req.body;

    if (!trang_thai) {
      return res.status(400).json({ success: false, message: 'Thiếu trường trang_thai' });
    }

    const [result] = await db.promise().query(
      'UPDATE bao_cao_su_co SET trang_thai = ?, updated_at = NOW() WHERE id = ?',
      [trang_thai, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy báo cáo sự cố' });
    }

    const [rows] = await db.promise().query(
      'SELECT ma_nguoi_bao_cao, tieu_de FROM bao_cao_su_co WHERE id = ?',
      [id]
    );

    if (rows.length > 0) {
      const { ma_nguoi_bao_cao, tieu_de: reportTitle } = rows[0];
      const statusText = trang_thai === 'approved' ? 'đã được duyệt' : trang_thai === 'rejected' ? 'đã bị từ chối' : `đã được cập nhật (${trang_thai})`;
      const content = `Báo cáo sự cố "${reportTitle}" của bạn ${statusText}.`; 
      try {
        await notificationService.sendToSpecificUser(
          ma_nguoi_bao_cao,
          'Cập nhật báo cáo sự cố',
          content,
          'issue_status'
        );
      } catch (notifError) {
        console.error('Lỗi gửi thông báo cập nhật báo cáo sự cố:', notifError);
      }
    }

    res.json({ success: true, message: 'Cập nhật trạng thái báo cáo thành công' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getComputers, reportIssue, updateIssueStatus };