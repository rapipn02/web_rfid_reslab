const express = require('express');
const router = express.Router();
const AttendanceController = require('../controllers/attendanceController');
const ValidationMiddleware = require('../middleware/validation');

// GET /api/attendance - Get all attendance records
router.get('/', ValidationMiddleware.validateAttendanceQuery, AttendanceController.getAllAttendance);

// GET /api/attendance/today - Get today's attendance  
router.get('/today', AttendanceController.getTodayAttendance);

// GET /api/attendance/stats - Get attendance statistics
router.get('/stats', AttendanceController.getAttendanceStats);

// GET /api/attendance/:id - Get attendance by ID
router.get('/:id', AttendanceController.getAttendanceById);

// GET /api/attendance/member/:memberId - Get attendance by member ID
router.get('/member/:memberId', AttendanceController.getAttendanceByMember);

// POST /api/attendance - Create manual attendance record
router.post('/', ValidationMiddleware.validateAttendance, AttendanceController.createAttendance);

// PUT /api/attendance/:id - Update attendance record
router.put('/:id', ValidationMiddleware.validateAttendance, AttendanceController.updateAttendance);

// DELETE /api/attendance/:id - Delete attendance record
router.delete('/:id', AttendanceController.deleteAttendance);

module.exports = router;
