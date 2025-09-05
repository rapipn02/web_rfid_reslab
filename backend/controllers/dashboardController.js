/**
 * Dashboard Controller
 * Controller untuk handle data dashboard
 */

const FirebaseService = require('../services/firebaseService');
const ResponseHelper = require('../utils/responseHelper');
const AttendanceController = require('./attendanceController');
const moment = require('moment');

class DashboardController {
  
  /**
   * Determine status based on attendance conditions (same as AttendanceController)
   */
  static determineStatus(jamDatang, jamPulang, tanggal = null) {
    const today = tanggal || moment().format('YYYY-MM-DD');
    const currentTime = moment();
    const cutoffTime = moment(`${today} 18:00:00`);
    
    // Jika sudah ada jam pulang = Hadir (sudah selesai piket)
    if (jamPulang) {
      return 'Hadir';
    }
    
    // Jika sudah ada jam datang tapi belum pulang = Sedang Piket
    if (jamDatang) {
      return 'Sedang Piket';
    }
    
    // Jika belum datang dan sudah lewat jam 18:00 = Tidak Piket
    if (!jamDatang && currentTime.isAfter(cutoffTime)) {
      return 'Tidak Piket';
    }
    
    // Jika belum datang dan belum lewat jam 18:00 = Belum Piket
    return 'Belum Piket';
  }

  /**
   * Get dashboard stats dan recent attendance
   */
  static async getDashboardData(req, res) {
    try {
      // Get all members
      const members = await FirebaseService.getDocuments('members');
      const totalMembers = members.length;
      
      // Get today's date
      const today = moment().format('YYYY-MM-DD');
      
      // Get all attendance records
      let attendanceRecords = await FirebaseService.getDocuments('attendance');
      
      // Update status automatically based on current conditions
      attendanceRecords = attendanceRecords.map(record => {
        const autoStatus = AttendanceController.determineStatus(record.jamDatang, record.jamPulang, record.tanggal);
        return {
          ...record,
          status: autoStatus
        };
      });
      
      // Calculate stats with updated status
      const totalAttendance = attendanceRecords.length;
      const hadirRecords = attendanceRecords.filter(record => record.status === 'Hadir');
      const sedangPiketRecords = attendanceRecords.filter(record => record.status === 'Sedang Piket');
      const belumPiketRecords = attendanceRecords.filter(record => record.status === 'Belum Piket');
      const tidakPiketRecords = attendanceRecords.filter(record => record.status === 'Tidak Piket');
      
      // Today's stats
      const todayRecords = attendanceRecords.filter(record => record.tanggal === today);
      const todayHadir = todayRecords.filter(record => record.status === 'Hadir').length;
      const todaySedangPiket = todayRecords.filter(record => record.status === 'Sedang Piket').length;
      const todayBelumPiket = todayRecords.filter(record => record.status === 'Belum Piket').length;
      const todayTidakPiket = todayRecords.filter(record => record.status === 'Tidak Piket').length;
      
      // Get recent attendance (last 10 records) - sorted by date
      const recentAttendance = attendanceRecords
        .sort((a, b) => {
          // Sort by date desc, then by createdAt desc
          const dateA = new Date(a.tanggal || a.createdAt);
          const dateB = new Date(b.tanggal || b.createdAt);
          return dateB - dateA;
        })
        .slice(0, 10);
      
      // Generate chart data (last 7 days) with updated status
      const chartData = [];
      for (let i = 6; i >= 0; i--) {
        const date = moment().subtract(i, 'days');
        const dateStr = date.format('YYYY-MM-DD');
        
        const dayRecords = attendanceRecords.filter(record => record.tanggal === dateStr);
        const hadir = dayRecords.filter(record => record.status === 'Hadir').length;
        const sedangPiket = dayRecords.filter(record => record.status === 'Sedang Piket').length;
        const tidakPiket = dayRecords.filter(record => record.status === 'Tidak Piket').length;
        
        chartData.push({
          tanggal: dateStr,
          hadir,
          sedangPiket,
          tidakPiket,
          total: hadir + sedangPiket + tidakPiket,
          day: date.format('ddd')
        });
      }

      // Response with updated structure
      const responseData = {
        stats: {
          totalMembers,
          totalAttendance,
          hadir: hadirRecords.length,
          sedangPiket: sedangPiketRecords.length,
          belumPiket: belumPiketRecords.length,
          tidakPiket: tidakPiketRecords.length,
          todayHadir,
          todaySedangPiket,
          todayBelumPiket,
          todayTidakPiket,
          todayTotal: todayRecords.length
        },
        recentAttendance: recentAttendance.map(record => ({
          ...record,
          tanggalFormatted: moment(record.tanggal).format('DD/MM/YYYY')
        })),
        chartData,
        lastUpdate: moment().format('YYYY-MM-DD HH:mm:ss')
      };

      return ResponseHelper.success(res, responseData, 'Dashboard data retrieved successfully');
      
    } catch (error) {
      console.error('Dashboard data error:', error);
      return ResponseHelper.error(res, 'Terjadi kesalahan saat mengambil data dashboard.');
    }
  }
  
  /**
   * Get chart data dengan filter periode (mingguan, bulanan, tahunan)
   */
  static async getChartData(req, res) {
    try {
      const { period = 'weekly' } = req.query; // weekly, monthly, yearly
      
      // Get all attendance records
      let attendanceRecords = await FirebaseService.getDocuments('attendance');
      
      // Update status automatically based on current conditions
      attendanceRecords = attendanceRecords.map(record => {
        const autoStatus = AttendanceController.determineStatus(record.jamDatang, record.jamPulang, record.tanggal);
        return {
          ...record,
          status: autoStatus
        };
      });
      
      let chartData = [];
      
      if (period === 'weekly') {
        // Generate chart data (last 7 days)
        for (let i = 6; i >= 0; i--) {
          const date = moment().subtract(i, 'days');
          const dateStr = date.format('YYYY-MM-DD');
          
          const dayRecords = attendanceRecords.filter(record => record.tanggal === dateStr);
          const hadir = dayRecords.filter(record => record.status === 'Hadir').length;
          const sedangPiket = dayRecords.filter(record => record.status === 'Sedang Piket').length;
          const tidakPiket = dayRecords.filter(record => record.status === 'Tidak Piket').length;
          
          chartData.push({
            tanggal: dateStr,
            hadir,
            sedangPiket,
            tidakPiket,
            total: hadir + sedangPiket + tidakPiket,
            day: date.format('ddd'),
            label: date.format('DD/MM')
          });
        }
      } else if (period === 'monthly') {
        // Generate chart data (last 4 weeks)
        for (let i = 3; i >= 0; i--) {
          const weekStart = moment().subtract(i, 'weeks').startOf('week');
          const weekEnd = moment().subtract(i, 'weeks').endOf('week');
          
          const weekRecords = attendanceRecords.filter(record => {
            const recordDate = moment(record.tanggal);
            return recordDate.isBetween(weekStart, weekEnd, 'day', '[]');
          });
          
          const hadir = weekRecords.filter(record => record.status === 'Hadir').length;
          const sedangPiket = weekRecords.filter(record => record.status === 'Sedang Piket').length;
          const tidakPiket = weekRecords.filter(record => record.status === 'Tidak Piket').length;
          
          chartData.push({
            tanggal: weekStart.format('YYYY-MM-DD'),
            hadir,
            sedangPiket,
            tidakPiket,
            total: hadir + sedangPiket + tidakPiket,
            day: `Week ${4-i}`,
            label: `${weekStart.format('DD/MM')} - ${weekEnd.format('DD/MM')}`
          });
        }
      } else if (period === 'yearly') {
        // Generate chart data (last 12 months)
        for (let i = 11; i >= 0; i--) {
          const monthStart = moment().subtract(i, 'months').startOf('month');
          const monthEnd = moment().subtract(i, 'months').endOf('month');
          
          const monthRecords = attendanceRecords.filter(record => {
            const recordDate = moment(record.tanggal);
            return recordDate.isBetween(monthStart, monthEnd, 'day', '[]');
          });
          
          const hadir = monthRecords.filter(record => record.status === 'Hadir').length;
          const sedangPiket = monthRecords.filter(record => record.status === 'Sedang Piket').length;
          const tidakPiket = monthRecords.filter(record => record.status === 'Tidak Piket').length;
          
          chartData.push({
            tanggal: monthStart.format('YYYY-MM-DD'),
            hadir,
            sedangPiket,
            tidakPiket,
            total: hadir + sedangPiket + tidakPiket,
            day: monthStart.format('MMM'),
            label: monthStart.format('MMM YYYY')
          });
        }
      }

      return ResponseHelper.success(res, {
        chartData,
        period,
        lastUpdate: moment().format('YYYY-MM-DD HH:mm:ss')
      }, `Chart data for ${period} period retrieved successfully`);
      
    } catch (error) {
      console.error('Chart data error:', error);
      return ResponseHelper.error(res, 'Terjadi kesalahan saat mengambil data chart.');
    }
  }

  /**
   * Get attendance summary untuk periode tertentu
   */
  static async getAttendanceSummary(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const db = admin.firestore();
      
      let query = db.collection('attendance');
      
      if (startDate) {
        query = query.where('tanggal', '>=', startDate);
      }
      
      if (endDate) {
        query = query.where('tanggal', '<=', endDate);
      }
      
      const snapshot = await query.get();
      const records = [];
      
      snapshot.forEach(doc => {
        records.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Group by member
      const memberSummary = {};
      records.forEach(record => {
        if (!memberSummary[record.nama]) {
          memberSummary[record.nama] = {
            nama: record.nama,
            totalHadir: 0,
            totalSedangPiket: 0,
            totalBelumPiket: 0,
            totalTidakPiket: 0,
            totalRecords: 0
          };
        }
        
        memberSummary[record.nama].totalRecords++;
        if (record.status === 'Hadir') {
          memberSummary[record.nama].totalHadir++;
        } else if (record.status === 'Sedang Piket') {
          memberSummary[record.nama].totalSedangPiket++;
        } else if (record.status === 'Belum Piket') {
          memberSummary[record.nama].totalBelumPiket++;
        } else if (record.status === 'Tidak Piket') {
          memberSummary[record.nama].totalTidakPiket++;
        }
      });
      
      res.json({
        success: true,
        data: {
          summary: Object.values(memberSummary),
          totalRecords: records.length,
          dateRange: {
            startDate: startDate || 'all',
            endDate: endDate || 'all'
          }
        }
      });
      
    } catch (error) {
      console.error('Attendance summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil ringkasan kehadiran.'
      });
    }
  }
}

module.exports = DashboardController;
