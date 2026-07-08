const attendanceService = require('../services/attendanceService');

const scanQRCheckIn = async (req, res) => {
    try {
        // 🚀 FIX LỖI Ở ĐÂY: Hứng userId từ req.body do Flutter bắn lên
        // Thay vì dùng req.user.id gây sập server
        const { scheduleId, qrCode, userId } = req.body; 

        // 🚀 THÊM CHỐT CHẶN AN TOÀN
        if (!userId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Không nhận diện được Sinh viên. Vui lòng đăng nhập lại!' 
            });
        }

        if (!scheduleId || !qrCode) {
            return res.status(400).json({ 
                success: false, 
                message: 'Vui lòng cung cấp đủ mã ca học (scheduleId) và mã QR (qrCode).' 
            });
        }

        // Gọi qua lớp Service để xử lý nghiệp vụ DB
        const result = await attendanceService.checkInWithQR(userId, scheduleId, qrCode);
        const successMessage = result.is_update 
            ? `Cập nhật thành công! Hệ thống đã ghi nhận bạn chuyển sang ngồi tại ${result.ten_may}.`
            : `Điểm danh thành công! Bạn đã được ghi nhận ngồi tại ${result.ten_may}.`;

        res.status(200).json({
            success: true,
            message: successMessage,
            data: result
        });  

    } catch (error) {
        console.error('Lỗi điểm danh QR:', error.message);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    scanQRCheckIn
};