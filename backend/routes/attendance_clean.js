const express = require('express');
const router = express.Router();
const AttendanceController = require('../controllers/attendanceController');
const ValidationMiddleware = require('../middleware/validation');


router.get('/', ValidationMiddleware.validateAttendanceQuery, AttendanceController.getAllAttendance);


router.get('/today', AttendanceController.getTodayAttendance);


router.get('/stats', AttendanceController.getAttendanceStats);


router.get('/:id', AttendanceController.getAttendanceById);


router.get('/member/:memberId', AttendanceController.getAttendanceByMember);


router.post('/', ValidationMiddleware.validateAttendance, AttendanceController.createAttendance);


router.put('/:id', ValidationMiddleware.validateAttendance, AttendanceController.updateAttendance);


router.delete('/:id', AttendanceController.deleteAttendance);

module.exports = router;
