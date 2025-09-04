/**
 * @swagger
 * /api/device/status:
 *   post:
 *     summary: Update device status
 *     description: Update status information for ESP32 devices
 *     tags: [Device]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deviceId
 *               - status
 *             properties:
 *               deviceId:
 *                 type: string
 *                 description: ESP32 device identifier
 *                 example: esp32_001
 *               status:
 *                 $ref: '#/components/schemas/DeviceStatus'
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
 *                 data:
 *                   $ref: '#/components/schemas/DeviceStatus'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalError'
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

module.exports = {};
