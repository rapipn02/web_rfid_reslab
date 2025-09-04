/**
 * @swagger
 * components:
 *   schemas:
 *     Member:
 *       type: object
 *       required:
 *         - nama
 *         - rfidId
 *         - hariPiket
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated member ID
 *           example: member_123
 *         nama:
 *           type: string
 *           description: Member's full name
 *           example: John Doe
 *         rfidId:
 *           type: string
 *           description: RFID card identifier
 *           example: RFID001
 *         hariPiket:
 *           type: array
 *           items:
 *             type: string
 *             enum: [Senin, Selasa, Rabu, Kamis, Jumat, Sabtu, Minggu]
 *           description: Scheduled duty days
 *           example: [Senin, Rabu, Jumat]
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     
 *     Attendance:
 *       type: object
 *       required:
 *         - memberId
 *         - tanggal
 *         - jamDatang
 *         - status
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated attendance ID
 *           example: attendance_456
 *         memberId:
 *           type: string
 *           description: Reference to member ID
 *           example: member_123
 *         nama:
 *           type: string
 *           description: Member's name (for display)
 *           example: John Doe
 *         tanggal:
 *           type: string
 *           format: date
 *           description: Attendance date
 *           example: 2025-09-04
 *         jamDatang:
 *           type: string
 *           format: time
 *           description: Check-in time
 *           example: 08:30:00
 *         jamPulang:
 *           type: string
 *           format: time
 *           description: Check-out time
 *           example: 17:30:00
 *         durasi:
 *           type: string
 *           description: Duration between check-in and check-out
 *           example: 09:00:00
 *         status:
 *           type: string
 *           enum: [Hadir, Tidak Hadir, Terlambat]
 *           description: Attendance status
 *           example: Hadir
 *         keterangan:
 *           type: string
 *           description: Additional notes
 *           example: On time
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     
 *     RfidScan:
 *       type: object
 *       required:
 *         - rfidId
 *         - deviceId
 *       properties:
 *         rfidId:
 *           type: string
 *           description: RFID card identifier
 *           example: RFID001
 *         deviceId:
 *           type: string
 *           description: ESP32 device identifier
 *           example: esp32_001
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Scan timestamp
 *           example: 2025-09-04T08:30:00Z
 *         signal:
 *           type: string
 *           description: Signal strength
 *           example: strong
 *     
 *     DeviceStatus:
 *       type: object
 *       properties:
 *         online:
 *           type: boolean
 *           description: Device online status
 *           example: true
 *         lastSeen:
 *           type: string
 *           format: date-time
 *           description: Last activity timestamp
 *           example: 2025-09-04T08:30:00Z
 *         battery:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *           description: Battery percentage
 *           example: 85
 *         signal:
 *           type: string
 *           enum: [weak, moderate, strong]
 *           description: Signal strength
 *           example: strong
 *         location:
 *           type: string
 *           description: Device location
 *           example: Lab Reslab
 *         firmware:
 *           type: string
 *           description: Firmware version
 *           example: v1.2.0
 *     
 *     AdminUser:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated user ID
 *           example: admin_789
 *         email:
 *           type: string
 *           format: email
 *           description: Admin email address
 *           example: admin@reslab.com
 *         password:
 *           type: string
 *           format: password
 *           description: Hashed password
 *           minLength: 6
 *         role:
 *           type: string
 *           enum: [admin, super_admin]
 *           description: User role
 *           example: admin
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           description: Last login timestamp
 *     
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Admin email address
 *           example: admin@reslab.com
 *         password:
 *           type: string
 *           format: password
 *           description: User password
 *           example: password123
 *     
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             token:
 *               type: string
 *               description: JWT access token
 *               example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *             user:
 *               $ref: '#/components/schemas/AdminUser'
 *         message:
 *           type: string
 *           example: Login successful
 *   
 *   responses:
 *     BadRequest:
 *       description: Bad Request - Invalid input data
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               error:
 *                 type: string
 *                 example: Invalid input data
 *               details:
 *                 type: object
 *                 description: Validation error details
 *     
 *     Unauthorized:
 *       description: Unauthorized - Authentication required
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               error:
 *                 type: string
 *                 example: Authentication required
 *     
 *     NotFound:
 *       description: Not Found - Resource not found
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               error:
 *                 type: string
 *                 example: Resource not found
 *     
 *     InternalError:
 *       description: Internal Server Error
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               error:
 *                 type: string
 *                 example: Internal server error
 *               message:
 *                 type: string
 *                 description: Error details
 *   
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT token for authentication
 */

module.exports = {};
