const express = require('express');
const router = express.Router();
const RfidController = require('../controllers/rfidController');
const ValidationMiddleware = require('../middleware/validation');
const { 
  verifyToken, 
  requirePermission, 
  sanitizeInput,
  Auth
} = require('../middleware');




router.post('/check-member',
  sanitizeInput,
  ValidationMiddleware.validateRfidScan,
  RfidController.checkMember
);


router.post('/scan', 
  sanitizeInput,
  ValidationMiddleware.validateRfidScan, 
  RfidController.handleRfidScan
);


router.get('/scans/latest', 
  verifyToken,
  requirePermission('read:attendance'),
  RfidController.getLatestScans
);


router.get('/scans/unknown', 
  verifyToken,
  requirePermission('read:attendance'),
  RfidController.getUnknownScans
);


router.get('/scans/latest-unprocessed',
  verifyToken,
  requirePermission('read:attendance'),
  RfidController.getLatestUnprocessedScan
);


router.post('/device/:deviceId/heartbeat', 
  sanitizeInput,
  RfidController.deviceHeartbeat
);


router.post('/devices/:deviceId/realtime-mode', 
  verifyToken,
  requirePermission('admin'),
  sanitizeInput,
  RfidController.toggleRealtimeMode
);




router.get('/devices', 
  verifyToken,
  requirePermission('admin'),
  RfidController.getAllDevices
);


router.get('/devices/:deviceId', 
  RfidController.getDeviceById
);


router.put('/devices/:deviceId', 
  verifyToken,
  requirePermission('admin'),
  sanitizeInput,
  RfidController.updateDevice
);


router.get('/device/:deviceId/status', 
  verifyToken,
  requirePermission('read:attendance'),
  RfidController.getDeviceStatus
);

module.exports = router;