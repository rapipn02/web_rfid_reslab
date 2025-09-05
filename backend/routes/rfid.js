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

// ===== PUBLIC ENDPOINTS (untuk ESP32 device) =====

// POST /api/rfid/scan - Handle RFID scan from ESP32 (public endpoint)
router.post('/scan', 
  sanitizeInput,
  ValidationMiddleware.validateRfidScan, 
  RfidController.handleRfidScan
);

// POST /api/rfid/device/:deviceId/heartbeat - Device heartbeat (public endpoint)
router.post('/device/:deviceId/heartbeat', 
  sanitizeInput,
  RfidController.deviceHeartbeat
);

// ===== PROTECTED ENDPOINTS (untuk admin/operator) =====

// GET /api/rfid/device/:deviceId/status - Get device status (requires read permission)
router.get('/device/:deviceId/status', 
  verifyToken,
  requirePermission('read:attendance'),
  RfidController.getDeviceStatus
);

// GET /api/rfid/scans/latest - Get latest RFID scans (requires read permission)
router.get('/scans/latest', 
  verifyToken,
  requirePermission('read:attendance'),
  RfidController.getLatestScans
);

// GET /api/rfid/scans/unknown - Get unknown RFID scans (requires read permission)
router.get('/scans/unknown', 
  verifyToken,
  requirePermission('read:attendance'),
  RfidController.getUnknownScans
);

module.exports = router;

/**
 * @swagger
 * /api/rfid/scan:
 *   post:
 *     summary: Handle RFID scan from ESP32
 *     description: Process RFID card scan for attendance check-in/check-out
 *     tags: [RFID]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RfidScan'
 *     responses:
 *       200:
 *         description: RFID scan processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Attendance'
 *                 message:
 *                   type: string
 *                   example: Check in successful
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         description: RFID not registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: RFID not registered
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/scan', ValidationMiddleware.validateRfidScan, RfidController.handleRfidScan);

/**
 * @swagger
 * /api/rfid/device/{deviceId}/status:
 *   get:
 *     summary: Get device status
 *     description: Retrieve current status of ESP32 device
 *     tags: [RFID]
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ESP32 device ID
 *         example: esp32_001
 *     responses:
 *       200:
 *         description: Device status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DeviceStatus'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/device/:deviceId/status', RfidController.getDeviceStatus);

/**
 * @swagger
 * /api/rfid/device/{deviceId}/heartbeat:
 *   post:
 *     summary: Device heartbeat
 *     description: Update device status and send heartbeat signal
 *     tags: [RFID]
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ESP32 device ID
 *         example: esp32_001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeviceStatus'
 *     responses:
 *       200:
 *         description: Heartbeat received successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Heartbeat received
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/device/:deviceId/heartbeat', RfidController.deviceHeartbeat);

/**
 * @swagger
 * /api/rfid/scans/latest:
 *   get:
 *     summary: Get latest RFID scans
 *     description: Retrieve recent RFID scan activity
 *     tags: [RFID]
 *     responses:
 *       200:
 *         description: Latest scans retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rfidId:
 *                         type: string
 *                         example: RFID001
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       type:
 *                         type: string
 *                         enum: [check_in, check_out]
 *                         example: check_in
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/scans/latest', RfidController.getLatestScans);

/**
 * @swagger
 * /api/rfid/scans/unknown:
 *   get:
 *     summary: Get unknown RFID scans
 *     description: Retrieve scans from unregistered RFID cards
 *     tags: [RFID]
 *     responses:
 *       200:
 *         description: Unknown scans retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rfidId:
 *                         type: string
 *                         example: UNKNOWN123
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       deviceId:
 *                         type: string
 *                         example: esp32_001
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/scans/unknown', RfidController.getUnknownScans);

module.exports = router;

// POST /api/rfid/scan - Handle RFID scan from ESP32
router.post('/scan', async (req, res) => {
  try {
    const { rfidId, deviceId, timestamp, type } = req.body;
    console.log(`📡 RFID Scan received:`, { rfidId, deviceId, type });

    // Validation
    if (!rfidId) {
      return res.status(400).json({
        success: false,
        error: 'RFID ID is required'
      });
    }

    // Find member by RFID
    const memberSnapshot = await adminDb.collection('members')
      .where('idRfid', '==', rfidId)
      .where('status', '==', 'active')
      .get();

    if (memberSnapshot.empty) {
      console.log(`❌ Unknown RFID: ${rfidId}`);
      
      // Log unknown RFID to realtime database
      await adminRtdb.ref('rfid_scans/unknown').push({
        rfidId,
        deviceId: deviceId || 'unknown',
        timestamp: timestamp || new Date().toISOString(),
        status: 'unknown',
        processed: true
      });

      return res.status(404).json({
        success: false,
        error: 'RFID not registered',
        rfidId
      });
    }

    const memberData = memberSnapshot.docs[0].data();
    const memberId = memberSnapshot.docs[0].id;
    console.log(`👤 Member found: ${memberData.nama} (${memberData.nim})`);

    // Get today's date
    const today = moment().format('YYYY-MM-DD');
    const currentTime = moment().format('HH:mm:ss');
    const currentDateTime = new Date().toISOString();

    // Check today's attendance
    const attendanceSnapshot = await adminDb.collection('attendance')
      .where('memberId', '==', memberId)
      .where('tanggal', '==', today)
      .get();

    let attendanceData;
    let scanType;

    if (attendanceSnapshot.empty) {
      // First scan today - CHECK IN
      scanType = 'check_in';
      attendanceData = {
        memberId,
        nama: memberData.nama,
        nim: memberData.nim,
        idRfid: memberData.idRfid,
        tanggal: today,
        jamDatang: currentTime,
        jamPulang: null,
        durasi: null,
        status: 'Hadir',
        createdAt: currentDateTime,
        updatedAt: currentDateTime
      };

      const docRef = await adminDb.collection('attendance').add(attendanceData);
      attendanceData.id = docRef.id;

      console.log(`✅ Check-in recorded for ${memberData.nama}`);

    } else {
      // Second scan today - CHECK OUT
      const existingDoc = attendanceSnapshot.docs[0];
      const existingData = existingDoc.data();

      if (existingData.jamPulang) {
        console.log(`⚠️ ${memberData.nama} already checked out today`);
        return res.status(400).json({
          success: false,
          error: 'Already checked out today',
          data: {
            nama: memberData.nama,
            checkIn: existingData.jamDatang,
            checkOut: existingData.jamPulang
          }
        });
      }

      scanType = 'check_out';

      // Calculate duration
      const jamDatang = moment(existingData.jamDatang, 'HH:mm:ss');
      const jamPulang = moment(currentTime, 'HH:mm:ss');
      const duration = moment.duration(jamPulang.diff(jamDatang));
      
      // Format duration as HH:mm:ss
      const hours = Math.floor(duration.asHours());
      const minutes = duration.minutes();
      const seconds = duration.seconds();
      const durasi = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      const updateData = {
        jamPulang: currentTime,
        durasi,
        updatedAt: currentDateTime
      };

      await adminDb.collection('attendance').doc(existingDoc.id).update(updateData);
      
      attendanceData = {
        ...existingData,
        ...updateData,
        id: existingDoc.id
      };

      console.log(`✅ Check-out recorded for ${memberData.nama}, Duration: ${durasi}`);
    }

    // Update realtime database for live monitoring
    await adminRtdb.ref('rfid_scans/latest_scan').set({
      rfidId,
      memberId,
      nama: memberData.nama,
      nim: memberData.nim,
      type: scanType,
      timestamp: currentDateTime,
      deviceId: deviceId || 'esp32_001',
      processed: true
    });

    // Update live attendance counter
    const todayRef = adminRtdb.ref(`live_attendance/today/${today}`);
    const currentStats = await todayRef.once('value');
    const stats = currentStats.val() || { total_checkin: 0, total_checkout: 0 };

    if (scanType === 'check_in') {
      stats.total_checkin = (stats.total_checkin || 0) + 1;
    } else {
      stats.total_checkout = (stats.total_checkout || 0) + 1;
    }
    stats.last_activity = currentDateTime;

    await todayRef.set(stats);

    // Send response
    res.json({
      success: true,
      data: attendanceData,
      scanType,
      message: scanType === 'check_in' 
        ? `Check-in successful for ${memberData.nama}` 
        : `Check-out successful for ${memberData.nama}`,
      timestamp: currentDateTime
    });

  } catch (error) {
    console.error('❌ Error processing RFID scan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process RFID scan',
      message: error.message
    });
  }
});

// GET /api/rfid/status - Get current scan status
router.get('/status', async (req, res) => {
  try {
    const latestScan = await adminRtdb.ref('rfid_scans/latest_scan').once('value');
    const todayStats = await adminRtdb.ref(`live_attendance/today/${moment().format('YYYY-MM-DD')}`).once('value');
    
    res.json({
      success: true,
      data: {
        latestScan: latestScan.val(),
        todayStats: todayStats.val() || { total_checkin: 0, total_checkout: 0 }
      }
    });

  } catch (error) {
    console.error('❌ Error getting RFID status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get RFID status',
      message: error.message
    });
  }
});

module.exports = router;
