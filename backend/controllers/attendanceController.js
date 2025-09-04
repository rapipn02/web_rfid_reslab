const FirebaseService = require('../services/firebaseService');
const ResponseHelper = require('../utils/responseHelper');
const moment = require('moment');

/**
 * Attendance Controller
 */
class AttendanceController {
    
    // GET /api/attendance - Get all attendance records
    static async getAllAttendance(req, res) {
        try {
            const { startDate, endDate, memberId, status } = req.query;
            
            const conditions = [];
            
            // Filter by date range
            if (startDate) {
                conditions.push({ field: 'tanggal', operator: '>=', value: startDate });
            }
            if (endDate) {
                conditions.push({ field: 'tanggal', operator: '<=', value: endDate });
            }
            
            // Filter by member
            if (memberId) {
                conditions.push({ field: 'memberId', operator: '==', value: memberId });
            }
            
            // Filter by status
            if (status) {
                conditions.push({ field: 'status', operator: '==', value: status });
            }

            let attendance = await FirebaseService.getDocuments('attendance', conditions);
            
            // Sort by date and time (newest first)
            attendance.sort((a, b) => {
                const dateA = new Date(`${a.tanggal} ${a.jamDatang || '00:00:00'}`);
                const dateB = new Date(`${b.tanggal} ${b.jamDatang || '00:00:00'}`);
                return dateB - dateA;
            });

            return ResponseHelper.success(res, {
                attendance,
                count: attendance.length
            }, 'Attendance records retrieved successfully');
            
        } catch (error) {
            console.error('Error in getAllAttendance:', error);
            return ResponseHelper.error(res, 'Failed to retrieve attendance records');
        }
    }

    // GET /api/attendance/:id - Get attendance by ID
    static async getAttendanceById(req, res) {
        try {
            const { id } = req.params;
            
            const attendance = await FirebaseService.getDocumentById('attendance', id);
            
            if (!attendance) {
                return ResponseHelper.notFound(res, 'Attendance record not found');
            }

            return ResponseHelper.success(res, attendance, 'Attendance record retrieved successfully');
            
        } catch (error) {
            console.error('Error in getAttendanceById:', error);
            return ResponseHelper.error(res, 'Failed to retrieve attendance record');
        }
    }

    // GET /api/attendance/today - Get today's attendance
    static async getTodayAttendance(req, res) {
        try {
            const today = moment().format('YYYY-MM-DD');
            
            const conditions = [
                { field: 'tanggal', operator: '==', value: today }
            ];

            const attendance = await FirebaseService.getDocuments('attendance', conditions);
            
            // Calculate statistics
            const stats = {
                total: attendance.length,
                hadir: attendance.filter(a => a.status === 'Hadir').length,
                tidakHadir: attendance.filter(a => a.status === 'Tidak Hadir').length,
                terlambat: attendance.filter(a => a.status === 'Terlambat').length,
                checkedIn: attendance.filter(a => a.jamDatang && !a.jamPulang).length,
                checkedOut: attendance.filter(a => a.jamDatang && a.jamPulang).length
            };

            return ResponseHelper.success(res, {
                date: today,
                attendance,
                stats
            }, 'Today\'s attendance retrieved successfully');
            
        } catch (error) {
            console.error('Error in getTodayAttendance:', error);
            return ResponseHelper.error(res, 'Failed to retrieve today\'s attendance');
        }
    }

    // GET /api/attendance/member/:memberId - Get attendance by member
    static async getAttendanceByMember(req, res) {
        try {
            const { memberId } = req.params;
            const { startDate, endDate, limit = 50 } = req.query;
            
            const conditions = [
                { field: 'memberId', operator: '==', value: memberId }
            ];
            
            if (startDate) {
                conditions.push({ field: 'tanggal', operator: '>=', value: startDate });
            }
            if (endDate) {
                conditions.push({ field: 'tanggal', operator: '<=', value: endDate });
            }

            let attendance = await FirebaseService.getDocuments('attendance', conditions);
            
            // Sort by date (newest first) and limit results
            attendance.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
            attendance = attendance.slice(0, parseInt(limit));

            return ResponseHelper.success(res, {
                memberId,
                attendance,
                count: attendance.length
            }, 'Member attendance retrieved successfully');
            
        } catch (error) {
            console.error('Error in getAttendanceByMember:', error);
            return ResponseHelper.error(res, 'Failed to retrieve member attendance');
        }
    }

    // POST /api/attendance - Create manual attendance record
    static async createAttendance(req, res) {
        try {
            const { memberId, tanggal, jamDatang, jamPulang, status } = req.body;

            // Validate member exists
            const member = await FirebaseService.getDocumentById('members', memberId);
            if (!member) {
                return ResponseHelper.notFound(res, 'Member not found');
            }

            // Check if attendance already exists for this member and date
            const existingAttendance = await FirebaseService.getDocuments('attendance', [
                { field: 'memberId', operator: '==', value: memberId },
                { field: 'tanggal', operator: '==', value: tanggal }
            ]);

            if (existingAttendance.length > 0) {
                return ResponseHelper.error(res, 'Attendance record already exists for this date', 400);
            }

            // Calculate duration if both times provided
            let durasi = null;
            if (jamDatang && jamPulang) {
                durasi = this.calculateDuration(jamDatang, jamPulang);
            }

            const attendanceData = {
                memberId,
                nama: member.nama,
                nim: member.nim,
                idRfid: member.idRfid,
                tanggal,
                jamDatang: jamDatang || null,
                jamPulang: jamPulang || null,
                durasi,
                status: status || 'Hadir'
            };

            const newAttendance = await FirebaseService.addDocument('attendance', attendanceData);
            
            return ResponseHelper.success(res, newAttendance, 'Attendance record created successfully', 201);
            
        } catch (error) {
            console.error('Error in createAttendance:', error);
            return ResponseHelper.error(res, 'Failed to create attendance record');
        }
    }

    // PUT /api/attendance/:id - Update attendance record
    static async updateAttendance(req, res) {
        try {
            const { id } = req.params;
            const { jamDatang, jamPulang, status } = req.body;

            const existingAttendance = await FirebaseService.getDocumentById('attendance', id);
            if (!existingAttendance) {
                return ResponseHelper.notFound(res, 'Attendance record not found');
            }

            const updateData = {};
            
            if (jamDatang !== undefined) updateData.jamDatang = jamDatang;
            if (jamPulang !== undefined) updateData.jamPulang = jamPulang;
            if (status !== undefined) updateData.status = status;

            // Recalculate duration if times are provided
            const finalJamDatang = jamDatang || existingAttendance.jamDatang;
            const finalJamPulang = jamPulang || existingAttendance.jamPulang;
            
            if (finalJamDatang && finalJamPulang) {
                updateData.durasi = this.calculateDuration(finalJamDatang, finalJamPulang);
            }

            const updatedAttendance = await FirebaseService.updateDocument('attendance', id, updateData);
            
            return ResponseHelper.success(res, updatedAttendance, 'Attendance record updated successfully');
            
        } catch (error) {
            console.error('Error in updateAttendance:', error);
            return ResponseHelper.error(res, 'Failed to update attendance record');
        }
    }

    // DELETE /api/attendance/:id - Delete attendance record
    static async deleteAttendance(req, res) {
        try {
            const { id } = req.params;

            const deletedAttendance = await FirebaseService.deleteDocument('attendance', id);
            
            return ResponseHelper.success(res, deletedAttendance, 'Attendance record deleted successfully');
            
        } catch (error) {
            console.error('Error in deleteAttendance:', error);
            if (error.message.includes('not found')) {
                return ResponseHelper.notFound(res, 'Attendance record not found');
            }
            return ResponseHelper.error(res, 'Failed to delete attendance record');
        }
    }

    // GET /api/attendance/stats - Get attendance statistics
    static async getAttendanceStats(req, res) {
        try {
            const { period = 'month' } = req.query;
            
            let startDate, endDate;
            
            switch (period) {
                case 'today':
                    startDate = endDate = moment().format('YYYY-MM-DD');
                    break;
                case 'week':
                    startDate = moment().startOf('week').format('YYYY-MM-DD');
                    endDate = moment().endOf('week').format('YYYY-MM-DD');
                    break;
                case 'month':
                default:
                    startDate = moment().startOf('month').format('YYYY-MM-DD');
                    endDate = moment().endOf('month').format('YYYY-MM-DD');
                    break;
            }

            const conditions = [
                { field: 'tanggal', operator: '>=', value: startDate },
                { field: 'tanggal', operator: '<=', value: endDate }
            ];

            const attendance = await FirebaseService.getDocuments('attendance', conditions);
            
            const stats = {
                period,
                startDate,
                endDate,
                total: attendance.length,
                hadir: attendance.filter(a => a.status === 'Hadir').length,
                tidakHadir: attendance.filter(a => a.status === 'Tidak Hadir').length,
                terlambat: attendance.filter(a => a.status === 'Terlambat').length,
                dailyStats: {}
            };

            // Group by date for daily statistics
            attendance.forEach(record => {
                if (!stats.dailyStats[record.tanggal]) {
                    stats.dailyStats[record.tanggal] = {
                        total: 0,
                        hadir: 0,
                        tidakHadir: 0,
                        terlambat: 0
                    };
                }
                stats.dailyStats[record.tanggal].total++;
                stats.dailyStats[record.tanggal][record.status.toLowerCase().replace(' ', '')]++;
            });

            return ResponseHelper.success(res, stats, 'Attendance statistics retrieved successfully');
            
        } catch (error) {
            console.error('Error in getAttendanceStats:', error);
            return ResponseHelper.error(res, 'Failed to retrieve attendance statistics');
        }
    }

    // Helper method to calculate duration
    static calculateDuration(jamDatang, jamPulang) {
        try {
            const datang = moment(jamDatang, 'HH:mm:ss');
            const pulang = moment(jamPulang, 'HH:mm:ss');
            
            if (pulang.isBefore(datang)) {
                // Handle next day scenario
                pulang.add(1, 'day');
            }
            
            const duration = moment.duration(pulang.diff(datang));
            const hours = Math.floor(duration.asHours());
            const minutes = duration.minutes();
            
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
        } catch (error) {
            return null;
        }
    }
}

module.exports = AttendanceController;
