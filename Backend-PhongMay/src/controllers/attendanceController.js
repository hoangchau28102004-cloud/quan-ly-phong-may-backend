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
const getStudentsBySchedule = async (req, res) => {
    const { scheduleId } = req.params;
    try {
        // Gọi sang Service để lấy data
        const students = await attendanceService.getStudentsBySchedule(scheduleId);
        res.status(200).json({ success: true, data: students });
    } catch (error) {
        console.error("Lỗi lấy danh sách sinh viên:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
const saveAttendance = async (req, res) => {
    try {
        const { schedule_id, danh_sach } = req.body;
        
        if (!schedule_id || !Array.isArray(danh_sach)) {
            return res.status(400).json({ success: false, message: 'Dữ liệu điểm danh không hợp lệ' });
        }

        const result = await attendanceService.saveAttendance(schedule_id, danh_sach);
        res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        console.error("Lỗi lưu điểm danh:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
module.exports = {
    scanQRCheckIn,getStudentsBySchedule,saveAttendance
};