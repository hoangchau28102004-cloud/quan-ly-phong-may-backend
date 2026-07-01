const issueService = require('../services/issueService');

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
    const { ma_nguoi_bao_cao, ma_may_tinh, loai_su_co, tieu_de, mo_ta, muc_do } = req.body;
    const insertId = await issueService.createIssueReport({
      ma_nguoi_bao_cao, ma_may_tinh, loai_su_co, tieu_de, mo_ta, muc_do
    });
    res.json({ success: true, message: "Báo cáo sự cố thành công!", data: { id: insertId } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getComputers, reportIssue };