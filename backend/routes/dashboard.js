

const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');



router.get('/', DashboardController.getDashboardData);



router.get('/chart', DashboardController.getChartData);



router.get('/summary', DashboardController.getAttendanceSummary);

module.exports = router;
