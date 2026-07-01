const roomService = require('../services/roomService');

const RoomController = {
  addMayTinh: async (req, res, next) => {
    try {
      const {
        ma_phong, ma_may, ten_may, vi_tri, ma_qr,
        bo_xu_ly, ram, card_do_hoa, bo_mach_chu, man_hinh,
        ban_phim, chuot, hdd, ssd, trang_thai, ghi_chu
      } = req.body;

      const generatedQr = ma_qr || `QR-${ma_may}-${Date.now()}`;
      const id = await roomService.addMayTinh({
        ma_phong,
        ma_may,
        ten_may,
        vi_tri,
        ma_qr: generatedQr,
        bo_xu_ly,
        ram,
        card_do_hoa,
        bo_mach_chu,
        man_hinh,
        ban_phim,
        chuot,
        hdd,
        ssd,
        trang_thai,
        ghi_chu
      });

      res.status(201).json({
        success: true,
        message: 'Thêm máy tính thành công',
        id,
        data: { id, ma_phong, ma_may, ten_may, vi_tri, ma_qr: generatedQr, trang_thai, ghi_chu }
      });
    } catch (error) {
      next(error);
    }
  },

  scanMachine: async (req, res, next) => {
    try {
      const { serial } = req.params; // Nhận mã QR/Serial từ URL
      const machine = await roomService.getMachineBySerial(serial);
      console.log('👉 ĐÃ NHẬN YÊU CẦU QUÉT MÃ TỪ FLUTTER. MÃ LÀ:', serial);

      if (!machine) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy máy tính với mã này!' });
      }

      res.status(200).json({
        success: true,
        data: machine
      });
    } catch (error) {
      next(error);
    }
  },

  getAvailableRooms: async (req, res, next) => {
    try {
      const { date, start, end } = req.query;
      if (!date || !start || !end) {
        return res.status(400).json({ success: false, message: 'Thiếu tham số ngày hoặc tiết' });
      }

      const rooms = await roomService.getAvailableRooms(date, Number(start), Number(end));
      res.status(200).json({ success: true, data: rooms });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = RoomController;