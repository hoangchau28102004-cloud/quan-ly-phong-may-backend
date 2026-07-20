const db = require('../config/db');

const notificationService = {
    // 1. LẤY THÔNG BÁO CHO NGƯỜI ĐANG ĐĂNG NHẬP
    getNotificationsByUser: async (userId) => {
        const query = `
            SELECT * FROM thong_bao 
            WHERE ma_nguoi_dung = ? 
            ORDER BY created_at DESC 
            LIMIT 50
        `;
        const conn = db.promise();
        const [rows] = await conn.query(query, [userId]);
        return rows;
    },

    // 2. ĐÁNH DẤU ĐÃ ĐỌC
    markAsRead: async (notifId, userId) => {
        const query = `UPDATE thong_bao SET da_doc = 1 WHERE id = ? AND ma_nguoi_dung = ?`;
        const conn = db.promise();
        const [result] = await conn.query(query, [notifId, userId]);
        return result.affectedRows > 0;
    },

    // =========================================================
    // CÁC HÀM XỬ LÝ PHÂN LUỒNG ROLE (GỌI TỪ CÁC CONTROLLER KHÁC)
    // =========================================================

    // 3. GỬI CHO 1 CÁ NHÂN (Dùng khi Admin duyệt sự cố cho SV/GV)
    sendToSpecificUser: async (userId, title, content, type = 'system') => {
        const query = `
            INSERT INTO thong_bao (ma_nguoi_dung, tieu_de, noi_dung, loai_thong_bao, da_doc, created_at,updated_at) 
            VALUES (?, ?, ?, ?, 0, NOW(),NOW())
        `;
        const conn = db.promise();
        const [result] = await conn.query(query, [userId, title, content, type]);
        console.debug('sendToSpecificUser: inserted notification', { notificationId: result.insertId, userId, type });
    },

    // 4. GỬI CHO TẤT CẢ ADMIN (Dùng khi GV mượn phòng gấp / báo sự cố mới)
    sendToAllAdmins: async (title, content, type = 'admin_alert') => {
        const conn = db.promise();
        const [admins] = await conn.query(`SELECT id FROM nguoi_dung WHERE ma_vai_tro = 1`);
        if (admins.length === 0) {
            console.warn('sendToAllAdmins: không tìm thấy admin nào để gửi thông báo');
            return;
        }

        const placeholders = admins.map(() => '(?, ?, ?, ?, 0, NOW(), NOW())').join(', ');
        const params = admins.flatMap(admin => [admin.id, title, content, type]);
        const query = `
            INSERT INTO thong_bao (ma_nguoi_dung, tieu_de, noi_dung, loai_thong_bao, da_doc, created_at, updated_at)
            VALUES ${placeholders}
        `;
        const [result] = await conn.query(query, params);
        console.debug('sendToAllAdmins: inserted notifications for admins', { adminCount: admins.length, affectedRows: result.affectedRows });
    }
};

module.exports = notificationService;