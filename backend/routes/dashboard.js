/**
 * Dashboard Routes
 * Routes untuk dashboard data
 */

const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get dashboard data
 *     description: Mengambil data untuk dashboard termasuk stats dan recent attendance
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Dashboard data berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                     recentAttendance:
 *                       type: array
 *                     chartData:
 *                       type: array
 *       500:
 *         description: Internal server error
 */
// GET /api/dashboard - Get dashboard data
router.get('/', DashboardController.getDashboardData);

/**
 * @swagger
 * /api/dashboard/chart:
 *   get:
 *     summary: Get chart data with period filter
 *     description: Mengambil data chart dengan filter periode (weekly, monthly, yearly)
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [weekly, monthly, yearly]
 *           default: weekly
 *         description: Periode chart data (weekly, monthly, yearly)
 *     responses:
 *       200:
 *         description: Chart data berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     chartData:
 *                       type: array
 *                     period:
 *                       type: string
 *                     lastUpdate:
 *                       type: string
 *       500:
 *         description: Internal server error
 */
// GET /api/dashboard/chart - Get chart data with filter
router.get('/chart', DashboardController.getChartData);

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Get attendance summary
 *     description: Mengambil ringkasan kehadiran untuk periode tertentu
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Tanggal mulai (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Tanggal akhir (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Summary berhasil diambil
 *       500:
 *         description: Internal server error
 */
// GET /api/dashboard/summary - Get attendance summary
router.get('/summary', DashboardController.getAttendanceSummary);

module.exports = router;
