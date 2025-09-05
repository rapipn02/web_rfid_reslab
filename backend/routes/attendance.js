const express = require('express');
const router = express.Router();
const AttendanceController = require('../controllers/attendanceController');
const ValidationMiddleware = require('../middleware/validation');
const { 
  verifyToken, 
  requirePermission, 
  validateAttendanceData, 
  sanitizeInput 
} = require('../middleware');

// GET /api/attendance - Get all attendance records (requires read permission)
router.get('/', 
  verifyToken,
  requirePermission('read:attendance'),
  ValidationMiddleware.validateAttendanceQuery, 
  AttendanceController.getAllAttendance
);

// GET /api/attendance/today - Get today's attendance (requires read permission)
router.get('/today', 
  verifyToken,
  requirePermission('read:attendance'),
  AttendanceController.getTodayAttendance
);

// GET /api/attendance/stats - Get attendance statistics (requires read permission)
router.get('/stats', 
  verifyToken,
  requirePermission('read:attendance'),
  AttendanceController.getAttendanceStats
);

// GET /api/attendance/auto-update-status - Auto update status for all members
router.get('/auto-update-status', 
  verifyToken,
  requirePermission('update:attendance'),
  AttendanceController.autoUpdateStatus
);

// GET /api/attendance/stream - Server-Sent Events for real-time updates
router.get('/stream', 
  verifyToken,
  requirePermission('read:attendance'),
  AttendanceController.streamAttendanceUpdates
);

// GET /api/attendance/:id - Get attendance by ID (requires read permission)
router.get('/:id', 
  verifyToken,
  requirePermission('read:attendance'),
  AttendanceController.getAttendanceById
);

// GET /api/attendance/member/:memberId - Get attendance by member ID (requires read permission)
router.get('/member/:memberId', 
  verifyToken,
  requirePermission('read:attendance'),
  AttendanceController.getAttendanceByMember
);

// POST /api/attendance - Create manual attendance record (requires create permission)
router.post('/', 
  sanitizeInput,
  verifyToken,
  requirePermission('create:attendance'),
  validateAttendanceData,
  ValidationMiddleware.validateAttendance, 
  AttendanceController.createAttendance
);

// POST /api/attendance/manual - Create/Update manual attendance with easier interface (NO RFID REQUIRED)
router.post('/manual', 
  sanitizeInput,
  verifyToken,
  requirePermission('create:attendance'),
  AttendanceController.createManualAttendance
);

// PUT /api/attendance/:id - Update attendance record (requires update permission)
router.put('/:id', 
  sanitizeInput,
  verifyToken,
  requirePermission('update:attendance'),
  validateAttendanceData,
  ValidationMiddleware.validateAttendance, 
  AttendanceController.updateAttendance
);

// DELETE /api/attendance/:id - Delete attendance record (requires delete permission)
router.delete('/:id', 
  verifyToken,
  requirePermission('delete:attendance'),
  AttendanceController.deleteAttendance
);

module.exports = router;
