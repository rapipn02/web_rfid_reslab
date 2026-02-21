const express = require('express');
const router = express.Router();
const AttendanceController = require('../controllers/attendanceController');
const ValidationMiddleware = require('../middleware/validation');
const AttendanceMiddleware = require('../middleware/attendanceMiddleware');
const { validateWorkingHours, checkDuplicateAttendance } = require('../middleware/autoCheckout');
const { 
  verifyToken, 
  requirePermission, 
  validateAttendanceData, 
  sanitizeInput 
} = require('../middleware');


router.get('/', 
  verifyToken,
  requirePermission('read:attendance'),
  ValidationMiddleware.validateAttendanceQuery, 
  AttendanceController.getAllAttendance
);


router.get('/today', 
  verifyToken,
  requirePermission('read:attendance'),
  AttendanceController.getTodayAttendance
);


router.get('/today-with-members', 
  verifyToken,
  requirePermission('read:attendance'),
  AttendanceController.getTodayAttendanceWithMembers
);


router.get('/stats', 
  verifyToken,
  requirePermission('read:attendance'),
  AttendanceController.getAttendanceStats
);


router.get('/auto-update-status', 
  verifyToken,
  requirePermission('update:attendance'),
  AttendanceController.autoUpdateStatus
);


router.get('/stream', 
  verifyToken,
  requirePermission('read:attendance'),
  AttendanceController.streamAttendanceUpdates
);


router.get('/:id', 
  verifyToken,
  requirePermission('read:attendance'),
  AttendanceController.getAttendanceById
);


router.get('/member/:memberId', 
  verifyToken,
  requirePermission('read:attendance'),
  AttendanceController.getAttendanceByMember
);


router.post('/check-in', 
  sanitizeInput,
  verifyToken,
  AttendanceMiddleware.validateWorkingHours,
  AttendanceController.checkIn
);


router.post('/check-out', 
  sanitizeInput,
  verifyToken,
  AttendanceMiddleware.validateWorkingHours,
  AttendanceMiddleware.determineAttendanceStatus,
  AttendanceController.checkOut
);


router.post('/force-auto-checkout', 
  verifyToken,
  requirePermission('admin'),
  AttendanceController.forceAutoCheckout
);


router.post('/', 
  sanitizeInput,
  verifyToken,
  requirePermission('create:attendance'),
  validateAttendanceData,
  ValidationMiddleware.validateAttendance, 
  AttendanceController.createAttendance
);


router.post('/manual', 
  sanitizeInput,
  verifyToken,
  requirePermission('create:attendance'),
  AttendanceController.createManualAttendance
);


router.put('/:id', 
  sanitizeInput,
  verifyToken,
  requirePermission('update:attendance'),
  validateAttendanceData,
  ValidationMiddleware.validateAttendance, 
  AttendanceController.updateAttendance
);


router.delete('/:id', 
  verifyToken,
  requirePermission('delete:attendance'),
  AttendanceController.deleteAttendance
);


router.post('/checkin',
  verifyToken,
  validateWorkingHours,
  checkDuplicateAttendance,
  ValidationMiddleware.validateAttendance,
  AttendanceController.checkIn
);


router.post('/checkout',
  verifyToken,
  validateWorkingHours,
  ValidationMiddleware.validateCheckout,
  AttendanceController.checkOut
);


router.get('/today/:memberId',
  verifyToken,
  requirePermission('read:attendance'),
  AttendanceController.getTodayAttendance
);


router.post('/generate-absent',
  verifyToken,
  requirePermission('write:attendance'),
  AttendanceController.generateAbsentRecords
);


router.post('/auto-checkout',
  verifyToken,
  requirePermission('write:attendance'),
  AttendanceController.manualAutoCheckout
);


router.post('/clean-duplicates',
  verifyToken,
  requirePermission('write:attendance'),
  AttendanceController.cleanDuplicateAttendance
);


router.post('/fix-today-duplicates',
  verifyToken,
  requirePermission('write:attendance'),
  AttendanceController.fixTodayDuplicates
);

module.exports = router;
