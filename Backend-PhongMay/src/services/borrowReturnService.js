const db = require('../config/db');

const BorrowReturnService = {
  getBorrowRequests: async () => {
    const sql = `
      SELECT pm.*, 
             pm.nguoi_muon AS ten_nguoi_muon, /* Lấy trực tiếp tên người mượn */
             pb.ten_phong_ban,
             (SELECT CONCAT('[', GROUP_CONCAT(JSON_OBJECT(
                'ma_may', mt.ma_may, 
                'ten_may', mt.ten_may, 
                'tinh_trang', IFNULL(ct.tinh_trang_khi_muon, 'Không có'),
                'ghi_chu_ct', IFNULL(ct.ghi_chu, '')
              )), ']')
              FROM chi_tiet_phieu_muon_may ct
              JOIN may_tinh mt ON ct.ma_may_tinh = mt.id
              WHERE ct.ma_phieu_muon = pm.id) AS danh_sach_may
      FROM phieu_muon_may pm
      LEFT JOIN phong_ban pb ON pm.ma_phong_ban = pb.id
      ORDER BY pm.id DESC
    `;
    const [rows] = await db.promise().query(sql);
    return rows;
  },

  getReturnRequests: async () => {
    const sql = `
      SELECT pt.*, 
             pm.ma_phieu_muon AS ma_phieu_muon_goc,
             pm.nguoi_muon AS ten_nguoi_tra, /* Lấy tên người trả từ phiếu mượn gốc */
             (SELECT CONCAT('[', GROUP_CONCAT(JSON_OBJECT(
                'ma_may', mt.ma_may, 
                'ten_may', mt.ten_may, 
                'tinh_trang', IFNULL(ct.tinh_trang_khi_tra, 'Không có'),
                'ghi_chu_ct', IFNULL(ct.ghi_chu, '')
              )), ']')
              FROM chi_tiet_phieu_tra_may ct
              JOIN may_tinh mt ON ct.ma_may_tinh = mt.id
              WHERE ct.ma_phieu_tra = pt.id) AS danh_sach_may
      FROM phieu_tra_may pt
      LEFT JOIN phieu_muon_may pm ON pt.ma_phieu_muon = pm.id
      ORDER BY pt.id DESC
    `;
    const [rows] = await db.promise().query(sql);
    return rows;
  },
  
  updateBorrowStatus: async (id, trang_thai) => {
    const [result] = await db.promise().query('UPDATE phieu_muon_may SET trang_thai = ? WHERE id = ?', [trang_thai, id]);
    return result.affectedRows;
  },

  confirmReturn: async (ma_phieu_muon_id) => {
    if (!ma_phieu_muon_id) return 0;
    const [result] = await db.promise().query('UPDATE phieu_muon_may SET trang_thai = ? WHERE id = ?', ['Đã trả', ma_phieu_muon_id]);
    return result.affectedRows;
  },

  // ============================================================================
  // TẠO PHIẾU MƯỢN VÀ KHÓA MÁY (Tự động sinh mã PM-001, PM-002...)
  // ============================================================================
  createBorrowTicket : async (data) => {
      const { nguoi_muon, ma_phong_ban, ngay_muon, so_luong, ly_do_muon, ghi_chu, may_tinh_ids } = data;
      const connection = await db.promise().getConnection();

      try {
          await connection.beginTransaction();

          let formattedDate = ngay_muon;
          if (!formattedDate) {
              const now = new Date();
              now.setHours(now.getHours() + 7);
              formattedDate = now.toISOString().slice(0, 19).replace('T', ' ');
          } else if (formattedDate.includes('T')) {
              formattedDate = formattedDate.slice(0, 19).replace('T', ' ');
          }

          // 🚀 LOGIC TỰ ĐỘNG TẠO MÃ PHIẾU MƯỢN (PM-001)
          const [lastBorrowTicket] = await connection.query('SELECT ma_phieu_muon FROM phieu_muon_may ORDER BY id DESC LIMIT 1');
          let nextBorrowId = 1;
          if (lastBorrowTicket.length > 0 && lastBorrowTicket[0].ma_phieu_muon) {
              const parts = lastBorrowTicket[0].ma_phieu_muon.split('-');
              if (parts.length === 2) {
                  nextBorrowId = parseInt(parts[1], 10) + 1;
              }
          }
          const ma_phieu_muon = `PM-${nextBorrowId.toString().padStart(3, '0')}`;

          const queryPhieuMuon = `
              INSERT INTO phieu_muon_may 
              (ma_phieu_muon, nguoi_muon, ma_phong_ban, ngay_muon, so_luong, ly_do_muon, trang_thai, ghi_chu, created_at, updated_at) 
              VALUES (?, ?, ?, ?, ?, ?, 'Đang mượn', ?, NOW(), NOW())
          `;
          
          const [resultPM] = await connection.execute(queryPhieuMuon, [
              ma_phieu_muon, // Sử dụng mã vừa sinh trực tiếp
              nguoi_muon,
              ma_phong_ban,
              formattedDate,
              so_luong,
              ly_do_muon,
              ghi_chu
          ]);
          
          const phieuMuonId = resultPM.insertId;

          if (may_tinh_ids && may_tinh_ids.length > 0) {
              for (const maMay of may_tinh_ids) {
                  const [may] = await connection.query('SELECT id FROM may_tinh WHERE ma_may = ? OR id = ?', [maMay, maMay]);
                  
                  if (may.length > 0) {
                      const idMay = may[0].id;
                      await connection.execute(
                          `INSERT INTO chi_tiet_phieu_muon_may (ma_phieu_muon, ma_may_tinh, tinh_trang_khi_muon, created_at, updated_at) 
                          VALUES (?, ?, 'Hoạt động bình thường', NOW(), NOW())`,
                          [phieuMuonId, idMay]
                      );

                      await connection.execute(
                          `UPDATE may_tinh SET trang_thai = 'borrowed', updated_at = NOW() WHERE id = ?`,
                          [idMay] 
                      );
                  }
              }
          }

          await connection.commit();
          return { success: true, message: 'Tạo phiếu mượn thành công', ma_phieu_muon: ma_phieu_muon };
      } catch (error) {
          await connection.rollback();
          throw error;
      } finally {
          connection.release();
      }
  },

  getBorrowHistoryByNguoiMuon: async (nguoi_muon) => {
    const sql = `
      SELECT pm.*, pb.ten_phong_ban
      FROM phieu_muon_may pm
      LEFT JOIN phong_ban pb ON pm.ma_phong_ban = pb.id
      WHERE pm.nguoi_muon LIKE ?
      ORDER BY pm.id DESC
    `;
    const [rows] = await db.promise().query(sql, [`%${nguoi_muon}%`]);
    return rows;
  },

  // ============================================================================
  // XỬ LÝ TRẢ MÁY (Tự động sinh mã PT-001, PT-002...)
  // ============================================================================
  processReturnMachines: async (data) => {
    const { ma_phieu_muon_id, machine_ids, ghi_chu, thoi_gian_tra } = data;
    const connection = await db.promise().getConnection();

    try {
        await connection.beginTransaction();

        const so_luong_tra = machine_ids.length;

        // 1. Kiểm tra phiếu mượn hiện tại đang còn bao nhiêu máy
        const [pm] = await connection.query('SELECT so_luong FROM phieu_muon_may WHERE id = ?', [ma_phieu_muon_id]);
        if (pm.length === 0) throw new Error('Không tìm thấy phiếu mượn!');
        
        let so_luong_hien_tai = pm[0].so_luong;
        let so_luong_moi = so_luong_hien_tai - so_luong_tra;
        if (so_luong_moi < 0) so_luong_moi = 0;

        // 2. Cập nhật lại số lượng phiếu mượn. Nếu trả hết (về 0) thì đổi thành 'Đã trả', còn không thì giữ 'Đang mượn'
        let trang_thai_moi = (so_luong_moi === 0) ? 'Đã trả' : 'Đang mượn';
        await connection.query(
            'UPDATE phieu_muon_may SET so_luong = ?, trang_thai = ?, updated_at = NOW() WHERE id = ?', 
            [so_luong_moi, trang_thai_moi, ma_phieu_muon_id]
        );

        // 🚀 LOGIC TỰ ĐỘNG TẠO MÃ PHIẾU TRẢ (PT-001)
        const [lastReturnTicket] = await connection.query('SELECT ma_phieu_tra FROM phieu_tra_may ORDER BY id DESC LIMIT 1');
        let nextReturnId = 1;
        if (lastReturnTicket.length > 0 && lastReturnTicket[0].ma_phieu_tra) {
            const parts = lastReturnTicket[0].ma_phieu_tra.split('-');
            if (parts.length === 2) {
                nextReturnId = parseInt(parts[1], 10) + 1;
            }
        }
        const ma_phieu_tra = `PT-${nextReturnId.toString().padStart(3, '0')}`;

        // 3. Tạo 1 Phiếu Trả Máy mới tinh để lưu vết lịch sử (Insert trực tiếp mã PT)
        // Lưu ý: Mình sửa 'Hoàn thành' thành 'confirmed' để khớp với db phpMyAdmin bạn gửi
        const [pt] = await connection.query(`
            INSERT INTO phieu_tra_may (ma_phieu_tra, ma_phieu_muon, thoi_gian_tra, so_luong, trang_thai, ghi_chu, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'confirmed', ?, NOW(), NOW())
        `, [ma_phieu_tra, ma_phieu_muon_id, thoi_gian_tra || new Date(), so_luong_tra, ghi_chu]);
        
        const phieuTraId = pt.insertId;

        // 4. Xử lý từng máy tính được trả
        for (const maMay of machine_ids) {
            const [may] = await connection.query('SELECT id FROM may_tinh WHERE ma_may = ?', [maMay]);
            if (may.length > 0) {
                const idMay = may[0].id;
                
                // A. Ghi vào chi tiết phiếu trả
                await connection.query(`
                    INSERT INTO chi_tiet_phieu_tra_may (ma_phieu_tra, ma_may_tinh, tinh_trang_khi_tra, created_at, updated_at)
                    VALUES (?, ?, 'Bình thường', NOW(), NOW())
                `, [phieuTraId, idMay]);

                // B. Gỡ máy này ra khỏi chi tiết phiếu mượn (để nó không hiện trong danh sách nợ nữa)
                await connection.query(`
                    DELETE FROM chi_tiet_phieu_muon_may WHERE ma_phieu_muon = ? AND ma_may_tinh = ?
                `, [ma_phieu_muon_id, idMay]);

                // C. Mở khóa máy tính (cập nhật lại thành active để người khác mượn tiếp)
                await connection.query(`
                    UPDATE may_tinh SET trang_thai = 'active', updated_at = NOW() WHERE id = ?
                `, [idMay]);
            }
        }

        await connection.commit();
        return { success: true, message: 'Xác nhận trả máy thành công!', ma_phieu_tra: ma_phieu_tra };
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
  }
};

module.exports = BorrowReturnService;