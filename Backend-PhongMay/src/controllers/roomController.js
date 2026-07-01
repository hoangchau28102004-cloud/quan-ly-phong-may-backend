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
  // --- HÀM MỚI ĐỂ XỬ LÝ QUÉT MÃ QR ---
  scanMachine: async (req, res, next) => {
    try {
      const { serial } = req.params; // Nhận mã QR/Serial từ URL
      const machine = await roomService.getMachineBySerial(serial);
      console.log("👉 ĐÃ NHẬN YÊU CẦU QUÉT MÃ TỪ FLUTTER. MÃ LÀ:", serial);

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
  }
};

module.exports = RoomController;