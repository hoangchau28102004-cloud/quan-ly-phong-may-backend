const service = require('../services/academicService');

const handleResponse = async (res, next, action) => {
    try {
        const result = await action();
        res.json(result || { success: true, message: 'Thành công!' });
    } catch (err) { 
        console.error("❌ LỖI API CHÍNH XÁC LÀ:", err.message);
        // Ép trả về lỗi 500 và thông báo rõ ràng để Flutter đọc được
        res.status(500).json({ success: false, message: err.message }); 
    }
};

// --- MÔN HỌC ---
const getSubjects = (req, res, next) => handleResponse(res, next, async () => ({ success: true, data: await service.getSubjects() }));
const createSubject = (req, res, next) => handleResponse(res, next, () => service.createSubject(req.body));
const updateSubject = async (req, res, next) => {
    try {
        const result = await service.updateSubject(req.params.id, req.body);
        res.json({ success: true, message: 'Thành công!', data: result });
    } catch (err) { next(err); }
};
const deleteSubject = (req, res, next) => handleResponse(res, next, () => service.deleteItem('mon', req.params.id));

// --- LỚP HỌC ---
const getClasses = (req, res, next) => handleResponse(res, next, async () => ({ success: true, data: await service.getClasses() }));
const createClass = (req, res, next) => handleResponse(res, next, () => service.createClass(req.body));
const updateClass = (req, res, next) => handleResponse(res, next, () => service.updateClass(req.params.id, req.body));
const deleteClass = (req, res, next) => handleResponse(res, next, () => service.deleteItem('lop', req.params.id));

// --- LỚP HỌC PHẦN ---
const getModules = (req, res, next) => handleResponse(res, next, async () => ({ success: true, data: await service.getModules() }));
const createModule = (req, res, next) => handleResponse(res, next, () => service.createModule(req.body));
const updateModule = (req, res, next) => handleResponse(res, next, () => service.updateModule(req.params.id, req.body));
const deleteModule = (req, res, next) => handleResponse(res, next, () => service.deleteItem('lhp', req.params.id));
const getTeachers = (req, res, next) => handleResponse(res, next, async () => ({ success: true, data: await service.getTeachers() }));

// --- SINH VIÊN TRONG LỚP HỌC & HỌC PHẦN ---
const getStudentsByClass = (req, res, next) => handleResponse(res, next, async () => ({ success: true, data: await service.getStudentsByClass(req.params.classId) }));
const getAvailableStudents = (req, res, next) => handleResponse(res, next, async () => ({ success: true, data: await service.getAvailableStudents() }));
const addStudentToClass = (req, res, next) => handleResponse(res, next, () => service.addStudentToClass(req.params.classId, req.body.studentId));
const removeStudentFromClass = (req, res, next) => handleResponse(res, next, () => service.removeStudentFromClass(req.params.studentId));
const getStudentsByModule = (req, res, next) => handleResponse(res, next, async () => ({ success: true, data: await service.getStudentsByModule(req.params.moduleId) }));
const addStudentToModule = (req, res, next) => handleResponse(res, next, () => service.addStudentToModule(req.params.moduleId, req.body.studentId));
const removeStudentFromModule = (req, res, next) => handleResponse(res, next, () => service.removeStudentFromModule(req.params.moduleId, req.params.studentId));

const getStudentDashboard = async (req, res) => {
    try {
        const dashboardData = await service.getStudentDashboardData(req.params.id);
        res.status(200).json({ success: true, data: dashboardData });
    } catch (error) { res.status(500).json({ success: false, message: 'Lỗi máy chủ' }); }
};

// =========================================================================
// --- TÍNH NĂNG MỚI: API NĂM HỌC VÀ TUẦN ---
// =========================================================================
const getAcademicYears = (req, res, next) => handleResponse(res, next, async () => ({ success: true, data: await service.getAcademicYears() }));
const createAcademicYear = (req, res, next) => handleResponse(res, next, () => service.createAcademicYear(req.body));
const deleteAcademicYear = (req, res, next) => handleResponse(res, next, () => service.deleteAcademicYear(req.params.id));
const getWeeksByYear = (req, res, next) => handleResponse(res, next, async () => ({ success: true, data: await service.getWeeksByYear(req.params.yearId) }));

module.exports = {
    getSubjects, createSubject, updateSubject, deleteSubject,
    getClasses, createClass, updateClass, deleteClass,
    getModules, createModule, updateModule, deleteModule,
    getTeachers, 
    getStudentsByClass, getAvailableStudents, addStudentToClass, removeStudentFromClass,
    getStudentsByModule, addStudentToModule, removeStudentFromModule, getStudentDashboard,
    // Export các api mới
    getAcademicYears, createAcademicYear, deleteAcademicYear, getWeeksByYear
};