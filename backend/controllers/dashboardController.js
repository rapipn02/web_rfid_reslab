

const FirebaseService = require('../services/firebaseService');
const ResponseHelper = require('../utils/responseHelper');
const AttendanceController = require('./attendanceController');
const moment = require('moment-timezone');


moment.tz.setDefault('Asia/Jakarta');

class DashboardController {
  
  
  static determineStatus(jamDatang, jamPulang, tanggal = null) {
    
    return AttendanceController.determineStatus(jamDatang, jamPulang, tanggal);
  }

  
  static getStatusBadge(status) {
    const badges = {
      'Hadir': { color: 'success', text: 'Hadir', icon: 'check-circle' },
      'Sedang Piket': { color: 'primary', text: 'Sedang Piket', icon: 'clock' },
      'Belum Piket': { color: 'warning', text: 'Belum Piket', icon: 'clock' },
      'Tidak Piket': { color: 'danger', text: 'Tidak Piket', icon: 'x-circle' },
      'Tidak Hadir': { color: 'danger', text: 'Tidak Hadir', icon: 'x-circle' }
    };
    return badges[status] || { color: 'secondary', text: status, icon: 'question-circle' };
  }

  
  static async getDashboardData(req, res) {
    try {
      
      const members = await FirebaseService.getDocuments('members');
      const totalMembers = members.length;
      
      
      const today = moment().tz('Asia/Jakarta').format('YYYY-MM-DD');
      
      
      let attendanceRecords = await FirebaseService.getDocuments('attendance');
      
      
      
      attendanceRecords = attendanceRecords.map(record => {
        const autoStatus = AttendanceController.determineStatus(record.jamDatang, record.jamPulang, record.tanggal);
        return {
          ...record,
          status: autoStatus,
          
          tanggal: record.tanggal || today
        };
      });
      
      
      const totalAttendance = attendanceRecords.length;
      const hadirRecords = attendanceRecords.filter(record => record.status === 'Hadir');
      const sedangPiketRecords = attendanceRecords.filter(record => record.status === 'Sedang Piket');
      const belumPiketRecords = attendanceRecords.filter(record => record.status === 'Belum Piket');
      const tidakPiketRecords = attendanceRecords.filter(record => record.status === 'Tidak Piket' || record.status === 'Tidak Hadir');
      
      
      const todayRecords = attendanceRecords.filter(record => record.tanggal === today);
      const todayHadir = todayRecords.filter(record => record.status === 'Hadir').length;
      const todaySedangPiket = todayRecords.filter(record => record.status === 'Sedang Piket').length;
      const todayBelumPiket = todayRecords.filter(record => record.status === 'Belum Piket').length;
      const todayTidakPiket = todayRecords.filter(record => 
        record.status === 'Tidak Piket' || record.status === 'Tidak Hadir'
      ).length;
      
      
      const recentAttendance = attendanceRecords
        .filter(record => record.tanggal) 
        .sort((a, b) => {
          
          const dateA = moment(a.tanggal).tz('Asia/Jakarta');
          const dateB = moment(b.tanggal).tz('Asia/Jakarta');
          
          if (dateA.format('YYYY-MM-DD') === dateB.format('YYYY-MM-DD')) {
            
            const timeA = moment(a.updatedAt || a.createdAt).tz('Asia/Jakarta');
            const timeB = moment(b.updatedAt || b.createdAt).tz('Asia/Jakarta');
            return timeB - timeA;
          }
          
          return dateB - dateA;
        })
        .slice(0, 10);
      
      
      const chartData = [];
      for (let i = 6; i >= 0; i--) {
        const date = moment().tz('Asia/Jakarta').subtract(i, 'days');
        const dateStr = date.format('YYYY-MM-DD');
        
        const dayRecords = attendanceRecords.filter(record => record.tanggal === dateStr);
        const hadir = dayRecords.filter(record => record.status === 'Hadir').length;
        const sedangPiket = dayRecords.filter(record => record.status === 'Sedang Piket').length;
        const belumPiket = dayRecords.filter(record => record.status === 'Belum Piket').length;
        const tidakPiket = dayRecords.filter(record => 
          record.status === 'Tidak Piket' || record.status === 'Tidak Hadir'
        ).length;
        
        chartData.push({
          tanggal: dateStr,
          hadir,
          sedangPiket,
          belumPiket,
          tidakPiket,
          total: hadir + sedangPiket + belumPiket + tidakPiket,
          day: date.format('ddd'),
          dayName: date.format('dddd')
        });
      }

      
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
          todayTotal: todayRecords.length,
          
          percentageHadir: totalAttendance > 0 ? ((hadirRecords.length / totalAttendance) * 100).toFixed(1) : 0,
          percentageTodayActive: todayRecords.length > 0 ? (((todayHadir + todaySedangPiket) / todayRecords.length) * 100).toFixed(1) : 0
        },
        recentAttendance: recentAttendance.map(record => ({
          ...record,
          tanggalFormatted: moment(record.tanggal).tz('Asia/Jakarta').format('DD/MM/YYYY'),
          tanggalLengkap: moment(record.tanggal).tz('Asia/Jakarta').format('dddd, DD MMMM YYYY'),
          jam: record.jamDatang || record.jamPulang || '-',
          durasi: record.durasi || '-',
          statusBadge: DashboardController.getStatusBadge(record.status)
        })),
        chartData,
        lastUpdate: moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss'),
        timezone: 'Asia/Jakarta'
      };

      return ResponseHelper.success(res, responseData, 'Dashboard data retrieved successfully');
      
    } catch (error) {
      console.error('Dashboard data error:', error);
      return ResponseHelper.error(res, 'Terjadi kesalahan saat mengambil data dashboard.');
    }
  }
  
  
  static async getChartData(req, res) {
    try {
      const { period = 'weekly' } = req.query; 
      
      
      let attendanceRecords = await FirebaseService.getDocuments('attendance');
      
      
      attendanceRecords = attendanceRecords.map(record => {
        const autoStatus = AttendanceController.determineStatus(record.jamDatang, record.jamPulang, record.tanggal);
        return {
          ...record,
          status: autoStatus,
          tanggal: record.tanggal || moment().tz('Asia/Jakarta').format('YYYY-MM-DD')
        };
      });
      
      let chartData = [];
      
      if (period === 'weekly') {
        
        for (let i = 6; i >= 0; i--) {
          const date = moment().tz('Asia/Jakarta').subtract(i, 'days');
          const dateStr = date.format('YYYY-MM-DD');
          
          const dayRecords = attendanceRecords.filter(record => record.tanggal === dateStr);
          const hadir = dayRecords.filter(record => record.status === 'Hadir').length;
          const sedangPiket = dayRecords.filter(record => record.status === 'Sedang Piket').length;
          const belumPiket = dayRecords.filter(record => record.status === 'Belum Piket').length;
          const tidakPiket = dayRecords.filter(record => 
            record.status === 'Tidak Piket' || record.status === 'Tidak Hadir'
          ).length;
          
          chartData.push({
            tanggal: dateStr,
            hadir,
            sedangPiket,
            belumPiket,
            tidakPiket,
            total: hadir + sedangPiket + belumPiket + tidakPiket,
            day: date.format('ddd'),
            dayName: date.format('dddd'),
            label: date.format('DD/MM')
          });
        }
      } else if (period === 'monthly') {
        
        for (let i = 3; i >= 0; i--) {
          const weekStart = moment().tz('Asia/Jakarta').subtract(i, 'weeks').startOf('week');
          const weekEnd = moment().tz('Asia/Jakarta').subtract(i, 'weeks').endOf('week');
          
          const weekRecords = attendanceRecords.filter(record => {
            const recordDate = moment(record.tanggal).tz('Asia/Jakarta');
            return recordDate.isBetween(weekStart, weekEnd, 'day', '[]');
          });
          
          const hadir = weekRecords.filter(record => record.status === 'Hadir').length;
          const sedangPiket = weekRecords.filter(record => record.status === 'Sedang Piket').length;
          const belumPiket = weekRecords.filter(record => record.status === 'Belum Piket').length;
          const tidakPiket = weekRecords.filter(record => 
            record.status === 'Tidak Piket' || record.status === 'Tidak Hadir'
          ).length;
          
          chartData.push({
            tanggal: weekStart.format('YYYY-MM-DD'),
            hadir,
            sedangPiket,
            belumPiket,
            tidakPiket,
            total: hadir + sedangPiket + belumPiket + tidakPiket,
            day: `Week ${4-i}`,
            label: `${weekStart.format('DD/MM')} - ${weekEnd.format('DD/MM')}`
          });
        }
      } else if (period === 'yearly') {
        
        for (let i = 11; i >= 0; i--) {
          const monthStart = moment().tz('Asia/Jakarta').subtract(i, 'months').startOf('month');
          const monthEnd = moment().tz('Asia/Jakarta').subtract(i, 'months').endOf('month');
          
          const monthRecords = attendanceRecords.filter(record => {
            const recordDate = moment(record.tanggal).tz('Asia/Jakarta');
            return recordDate.isBetween(monthStart, monthEnd, 'day', '[]');
          });
          
          const hadir = monthRecords.filter(record => record.status === 'Hadir').length;
          const sedangPiket = monthRecords.filter(record => record.status === 'Sedang Piket').length;
          const belumPiket = monthRecords.filter(record => record.status === 'Belum Piket').length;
          const tidakPiket = monthRecords.filter(record => 
            record.status === 'Tidak Piket' || record.status === 'Tidak Hadir'
          ).length;
          
          chartData.push({
            tanggal: monthStart.format('YYYY-MM-DD'),
            hadir,
            sedangPiket,
            belumPiket,
            tidakPiket,
            total: hadir + sedangPiket + belumPiket + tidakPiket,
            day: monthStart.format('MMM'),
            label: monthStart.format('MMM YYYY')
          });
        }
      }

      return ResponseHelper.success(res, {
        chartData,
        period,
        timezone: 'Asia/Jakarta',
        lastUpdate: moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss')
      }, `Chart data for ${period} period retrieved successfully`);
      
    } catch (error) {
      console.error('Chart data error:', error);
      return ResponseHelper.error(res, 'Terjadi kesalahan saat mengambil data chart.');
    }
  }

  
  static async getAttendanceSummary(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      
      const conditions = [];
      if (startDate) {
        conditions.push({ field: 'tanggal', operator: '>=', value: startDate });
      }
      if (endDate) {
        conditions.push({ field: 'tanggal', operator: '<=', value: endDate });
      }
      
      
      let records = await FirebaseService.getDocuments('attendance', conditions);
      
      
      records = records.map(record => {
        const autoStatus = AttendanceController.determineStatus(record.jamDatang, record.jamPulang, record.tanggal);
        return {
          ...record,
          status: autoStatus
        };
      });
      
      
      const memberSummary = {};
      records.forEach(record => {
        if (!memberSummary[record.nama]) {
          memberSummary[record.nama] = {
            nama: record.nama,
            nim: record.nim,
            totalHadir: 0,
            totalSedangPiket: 0,
            totalBelumPiket: 0,
            totalTidakPiket: 0,
            totalRecords: 0,
            attendanceRate: 0
          };
        }
        
        memberSummary[record.nama].totalRecords++;
        
        
        if (record.status === 'Hadir') {
          memberSummary[record.nama].totalHadir++;
        } else if (record.status === 'Sedang Piket') {
          memberSummary[record.nama].totalSedangPiket++;
        } else if (record.status === 'Belum Piket') {
          memberSummary[record.nama].totalBelumPiket++;
        } else if (record.status === 'Tidak Piket' || record.status === 'Tidak Hadir') {
          memberSummary[record.nama].totalTidakPiket++;
        }
      });
      
      
      Object.values(memberSummary).forEach(member => {
        const activeAttendance = member.totalHadir + member.totalSedangPiket;
        member.attendanceRate = member.totalRecords > 0 
          ? ((activeAttendance / member.totalRecords) * 100).toFixed(1) 
          : 0;
      });
      
      return ResponseHelper.success(res, {
        summary: Object.values(memberSummary),
        totalRecords: records.length,
        dateRange: {
          startDate: startDate || 'all',
          endDate: endDate || 'all'
        },
        lastUpdate: moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss'),
        timezone: 'Asia/Jakarta'
      }, 'Attendance summary retrieved successfully');
      
    } catch (error) {
      console.error('Attendance summary error:', error);
      return ResponseHelper.error(res, 'Terjadi kesalahan saat mengambil ringkasan kehadiran.');
    }
  }
}

module.exports = DashboardController;
