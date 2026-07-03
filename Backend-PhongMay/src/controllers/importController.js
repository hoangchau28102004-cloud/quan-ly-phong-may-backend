const importService = require('../services/importService');

const ImportController = {
  createImportReceipt: async (req, res, next) => {
    try {
      const data = req.body;
      const result = await importService.createImportReceipt(data);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  getImportReceipts: async (req, res, next) => {
    try {
      const receipts = await importService.getImportReceipts();
      res.status(200).json({ success: true, data: receipts });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = ImportController;
