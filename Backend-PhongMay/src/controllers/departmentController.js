const db = require('../config/db');

const getAllDepartments = async (req, res, next) => {
    try {
        const [rows] = await db.promise().query('SELECT id, ten_phong_ban FROM phong_ban WHERE trang_thai = "active"');
        res.json({ success: true, data: rows });
    } catch (error) {
        next(error);
    }
};

module.exports = { getAllDepartments };