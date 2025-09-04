/**
 * @swagger
 * /api/attendance:
 *   get:
 *     summary: Get all attendance records
 *     description: Retrieve attendance records with optional filtering
 *     tags: [Attendance]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering (YYYY-MM-DD)
 *         example: 2025-09-01
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering (YYYY-MM-DD)
 *         example: 2025-09-30
 *       - in: query
 *         name: memberId
 *         schema:
 *           type: string
 *         description: Filter by specific member ID
 *         example: member_123
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Hadir, Tidak Hadir, Terlambat]
 *         description: Filter by attendance status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of records to return
 *     responses:
 *       200:
 *         description: Attendance records retrieved successfully
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
 *                     $ref: '#/components/schemas/Attendance'
 *                 count:
 *                   type: integer
 *                   example: 50
 *                 filters:
 *                   type: object
 *                   properties:
 *                     startDate:
 *                       type: string
 *                     endDate:
 *                       type: string
 *                     memberId:
 *                       type: string
 *                     status:
 *                       type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *   post:
 *     summary: Create manual attendance record
 *     description: Create a new attendance record manually
 *     tags: [Attendance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - memberId
 *               - tanggal
 *               - jamDatang
 *               - status
 *             properties:
 *               memberId:
 *                 type: string
 *                 example: member_123
 *               tanggal:
 *                 type: string
 *                 format: date
 *                 example: 2025-09-04
 *               jamDatang:
 *                 type: string
 *                 format: time
 *                 example: 08:30:00
 *               jamPulang:
 *                 type: string
 *                 format: time
 *                 example: 17:30:00
 *               status:
 *                 type: string
 *                 enum: [Hadir, Tidak Hadir, Terlambat]
 *                 example: Hadir
 *               keterangan:
 *                 type: string
 *                 example: Manual entry
 *     responses:
 *       201:
 *         description: Attendance record created successfully
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
 *                   example: Attendance record created successfully
 *       400:
 *         description: Invalid request data
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
 *                   example: Member not found
 *       500:
 *         $ref: '#/components/responses/InternalError'
 * 
 * /api/attendance/today:
 *   get:
 *     summary: Get today's attendance
 *     description: Retrieve all attendance records for today with statistics
 *     tags: [Attendance]
 *     responses:
 *       200:
 *         description: Today's attendance retrieved successfully
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
 *                     $ref: '#/components/schemas/Attendance'
 *                 stats:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     hadir:
 *                       type: integer
 *                       example: 20
 *                     checkedIn:
 *                       type: integer
 *                       example: 18
 *                     checkedOut:
 *                       type: integer
 *                       example: 15
 *                 date:
 *                   type: string
 *                   format: date
 *                   example: 2025-09-04
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       500:
 *         $ref: '#/components/responses/InternalError'
 * 
 * /api/attendance/stats:
 *   get:
 *     summary: Get attendance statistics
 *     description: Retrieve comprehensive attendance statistics for a date range
 *     tags: [Attendance]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for statistics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for statistics
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
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
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 150
 *                     hadir:
 *                       type: integer
 *                       example: 120
 *                     tidakHadir:
 *                       type: integer
 *                       example: 30
 *                     totalCheckedOut:
 *                       type: integer
 *                       example: 110
 *                     averageDuration:
 *                       type: string
 *                       example: 08:30:00
 *                     dailyStats:
 *                       type: object
 *                       additionalProperties:
 *                         type: object
 *                         properties:
 *                           total:
 *                             type: integer
 *                           hadir:
 *                             type: integer
 *                           checkedOut:
 *                             type: integer
 *                 period:
 *                   type: object
 *                   properties:
 *                     startDate:
 *                       type: string
 *                     endDate:
 *                       type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       500:
 *         $ref: '#/components/responses/InternalError'
 * 
 * /api/attendance/{id}:
 *   get:
 *     summary: Get attendance record by ID
 *     description: Retrieve a specific attendance record
 *     tags: [Attendance]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Attendance record ID
 *         example: attendance_456
 *     responses:
 *       200:
 *         description: Attendance record retrieved successfully
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
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *   put:
 *     summary: Update attendance record
 *     description: Update an existing attendance record
 *     tags: [Attendance]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Attendance record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               jamDatang:
 *                 type: string
 *                 format: time
 *                 example: 08:45:00
 *               jamPulang:
 *                 type: string
 *                 format: time
 *                 example: 17:15:00
 *               status:
 *                 type: string
 *                 enum: [Hadir, Tidak Hadir, Terlambat]
 *                 example: Terlambat
 *               keterangan:
 *                 type: string
 *                 example: Updated manually
 *     responses:
 *       200:
 *         description: Attendance record updated successfully
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
 *                   example: Attendance record updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *   delete:
 *     summary: Delete attendance record
 *     description: Remove an attendance record from the system
 *     tags: [Attendance]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Attendance record ID
 *         example: attendance_456
 *     responses:
 *       200:
 *         description: Attendance record deleted successfully
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
 *                   example: Attendance record deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */

module.exports = {};
