const express = require('express');
const router = express.Router();

// POST /api/device/status - Update device status
router.post('/status', async (req, res) => {
    try {
        const { deviceId, status } = req.body;
        
        // TODO: Implement device status update
        res.json({
            success: true,
            message: 'Device status updated successfully',
            data: { deviceId, status }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to update device status',
            message: error.message
        });
    }
});

// GET /api/device/status - Get all device statuses
router.get('/status', async (req, res) => {
    try {
        // TODO: Implement get all device statuses
        res.json({
            success: true,
            data: {},
            count: 0,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get device statuses',
            message: error.message
        });
    }
});

module.exports = router;
const { adminRtdb } = require('../config/firebase');

/**
 * @swagger
 * /api/device/status:
 *   post:
 *     summary: Update device status
 *     description: Update ESP32 device status and heartbeat
 *     tags: [Device]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deviceId
 *             properties:
 *               deviceId:
 *                 type: string
 *                 description: ESP32 device identifier
 *                 example: esp32_001
 *               online:
 *                 type: boolean
 *                 description: Device online status
 *                 example: true
 *               battery:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Battery percentage
 *                 example: 85
 *               signal:
 *                 type: string
 *                 enum: [strong, medium, weak, unknown]
 *                 description: WiFi signal strength
 *                 example: strong
 *               location:
 *                 type: string
 *                 description: Device location
 *                 example: Lab Reslab
 *     responses:
 *       200:
 *         description: Device status updated successfully
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
 *                   example: Device status updated successfully
 *                 deviceId:
 *                   type: string
 *                   example: esp32_001
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/status', async (req, res) => {
  try {
    const { deviceId, online, battery, signal, location } = req.body;
    console.log(`📱 Device status update: ${deviceId}`);

    const deviceStatus = {
      online: online || false,
      lastSeen: new Date().toISOString(),
      battery: battery || 0,
      signal: signal || 'unknown',
      location: location || 'unknown',
      updatedAt: new Date().toISOString()
    };

    await adminRtdb.ref(`device_status/${deviceId}`).set(deviceStatus);

    res.json({
      success: true,
      message: 'Device status updated',
      deviceId,
      status: deviceStatus
    });

  } catch (error) {
    console.error('❌ Error updating device status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update device status',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/device/status:
 *   get:
 *     summary: Get all device statuses
 *     description: Retrieve status information for all ESP32 devices
 *     tags: [Device]
 *     responses:
 *       200:
 *         description: Device statuses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   additionalProperties:
 *                     type: object
 *                     properties:
 *                       online:
 *                         type: boolean
 *                         example: true
 *                       lastSeen:
 *                         type: string
 *                         format: date-time
 *                         example: 2025-09-04T08:30:00Z
 *                       battery:
 *                         type: integer
 *                         example: 85
 *                       signal:
 *                         type: string
 *                         example: strong
 *                       location:
 *                         type: string
 *                         example: Lab Reslab
 *                 count:
 *                   type: integer
 *                   description: Number of devices
 *                   example: 3
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-09-04T08:30:00Z
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/status', async (req, res) => {
  try {
    const devicesSnapshot = await adminRtdb.ref('device_status').once('value');
    const devices = devicesSnapshot.val() || {};

    res.json({
      success: true,
      data: devices,
      count: Object.keys(devices).length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching device status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch device status',
      message: error.message
    });
  }
});

module.exports = router;
