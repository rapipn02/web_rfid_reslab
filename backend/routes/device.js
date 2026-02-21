const express = require('express');
const router = express.Router();


router.post('/status', async (req, res) => {
    try {
        const { deviceId, status } = req.body;
        
        
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


router.get('/status', async (req, res) => {
    try {
        
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


router.post('/status', async (req, res) => {
  try {
    const { deviceId, online, battery, signal, location } = req.body;
    console.log(`Device status update: ${deviceId}`);

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
    console.error('Error updating device status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update device status',
      message: error.message
    });
  }
});


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
    console.error('Error fetching device status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch device status',
      message: error.message
    });
  }
});

module.exports = router;
