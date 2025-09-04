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
 * 
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
 * 
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
 * 
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
 * 
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

module.exports = {};
