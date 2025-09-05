const FirebaseService = require('../services/firebaseService');
const ResponseHelper = require('../utils/responseHelper');
const moment = require('moment');

/**
 * Attendance Controller
 */
class AttendanceController {
    
    /**
     * Determine status based on attendance conditions
     * Rules:
     * - sudah datang = "Sedang Piket"
     * - sudah pulang = "Hadir" 
     * - belum datang = "Belum Piket"
     * - sampai 18:00 tidak piket = "Tidak Piket"
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
            
            // Update status automatically based on current conditions
            attendance = attendance.map(record => {
                const autoStatus = AttendanceController.determineStatus(record.jamDatang, record.jamPulang, record.tanggal);
                return {
                    ...record,
                    status: autoStatus
                };
            });
            
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

            let attendance = await FirebaseService.getDocuments('attendance', conditions);
            
            // Update status automatically based on current conditions (sama seperti getAllAttendance)
            attendance = attendance.map(record => {
                const autoStatus = AttendanceController.determineStatus(record.jamDatang, record.jamPulang, record.tanggal);
                return {
                    ...record,
                    status: autoStatus
                };
            });
            
            // Calculate statistics with updated status
            const stats = {
                total: attendance.length,
                hadir: attendance.filter(a => a.status === 'Hadir').length,
                sedangPiket: attendance.filter(a => a.status === 'Sedang Piket').length,
                belumPiket: attendance.filter(a => a.status === 'Belum Piket').length,
                tidakPiket: attendance.filter(a => a.status === 'Tidak Piket').length,
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
                durasi = AttendanceController.calculateDuration(jamDatang, jamPulang);
            }

            // Determine status automatically based on attendance data
            const autoStatus = AttendanceController.determineStatus(jamDatang, jamPulang, tanggal);

            const attendanceData = {
                memberId,
                nama: member.nama,
                nim: member.nim,
                idRfid: member.idRfid,
                tanggal,
                jamDatang: jamDatang || null,
                jamPulang: jamPulang || null,
                durasi,
                status: autoStatus // Use automatic status instead of manual
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

            // Recalculate duration if times are provided
            const finalJamDatang = jamDatang || existingAttendance.jamDatang;
            const finalJamPulang = jamPulang || existingAttendance.jamPulang;
            
            if (finalJamDatang && finalJamPulang) {
                updateData.durasi = AttendanceController.calculateDuration(finalJamDatang, finalJamPulang);
            }

            // Determine status automatically based on updated attendance data
            updateData.status = AttendanceController.determineStatus(finalJamDatang, finalJamPulang, existingAttendance.tanggal);

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

    // POST /api/attendance/manual - Create/Update manual attendance with simplified interface
    static async createManualAttendance(req, res) {
        try {
            console.log('🔍 createManualAttendance called with body:', req.body);
            
            const { 
                memberId, 
                nim, 
                nama,
                tanggal = moment().format('YYYY-MM-DD'),
                jamDatang,
                jamPulang,
                status = 'Hadir',
                mode = 'datang' // 'datang', 'pulang', atau 'full'
            } = req.body;

            console.log('📋 Parsed data:', { memberId, nim, nama, tanggal, jamDatang, jamPulang, status, mode });

            // Validate input
            if (!memberId && !nim && !nama) {
                console.log('❌ Validation error: No identifier provided');
                return ResponseHelper.error(res, 'Provide either memberId, nim, or nama to identify member', 400);
            }

            // Find member by any identifier provided
            let member = null;
            console.log('🔍 Searching for member...');
            
            if (memberId) {
                console.log('🔍 Searching by memberId:', memberId);
                member = await FirebaseService.getDocumentById('members', memberId);
            } else if (nim) {
                console.log('🔍 Searching by nim:', nim);
                const members = await FirebaseService.getDocuments('members', [
                    { field: 'nim', operator: '==', value: nim }
                ]);
                console.log('📊 Found members by nim:', members.length);
                member = members[0];
            } else if (nama) {
                console.log('🔍 Searching by nama:', nama);
                const members = await FirebaseService.getDocuments('members', [
                    { field: 'nama', operator: '==', value: nama }
                ]);
                console.log('📊 Found members by nama:', members.length);
                member = members[0];
            }

            if (!member) {
                console.log('❌ Member not found');
                return ResponseHelper.notFound(res, 'Member not found');
            }

            console.log('✅ Member found:', { id: member.id, nama: member.nama, nim: member.nim });

            // Check existing attendance for today
            console.log('🔍 Checking existing attendance for date:', tanggal);
            const existingAttendance = await FirebaseService.getDocuments('attendance', [
                { field: 'memberId', operator: '==', value: member.id },
                { field: 'tanggal', operator: '==', value: tanggal }
            ]);

            console.log('📊 Existing attendance records found:', existingAttendance.length);

            let attendanceData = {};
            let isUpdate = false;

            if (existingAttendance.length > 0) {
                // Update existing record
                console.log('🔄 Updating existing record');
                isUpdate = true;
                attendanceData = existingAttendance[0];
                console.log('📄 Existing record:', attendanceData);
            } else {
                // Create new record
                console.log('➕ Creating new record');
                attendanceData = {
                    memberId: member.id,
                    nama: member.nama,
                    nim: member.nim,
                    idRfid: member.idRfid,
                    tanggal,
                    jamDatang: null,
                    jamPulang: null,
                    durasi: null,
                    status: 'Belum Piket' // Start with default status
                };
            }

            console.log('🕐 Processing mode:', mode);
            // Update based on mode
            if (mode === 'datang' || mode === 'full') {
                attendanceData.jamDatang = jamDatang || moment().format('HH:mm:ss');
                console.log('✅ Set jamDatang:', attendanceData.jamDatang);
            }

            if (mode === 'pulang' || mode === 'full') {
                attendanceData.jamPulang = jamPulang || moment().format('HH:mm:ss');
                console.log('✅ Set jamPulang:', attendanceData.jamPulang);
                
                // Calculate duration if both times exist
                if (attendanceData.jamDatang && attendanceData.jamPulang) {
                    attendanceData.durasi = AttendanceController.calculateDuration(attendanceData.jamDatang, attendanceData.jamPulang);
                    console.log('⏱️ Calculated duration:', attendanceData.durasi);
                }
            }

            // Always determine status automatically based on attendance data
            attendanceData.status = AttendanceController.determineStatus(attendanceData.jamDatang, attendanceData.jamPulang, tanggal);
            console.log('🎯 Determined status:', attendanceData.status);

            console.log('💾 Final attendance data:', attendanceData);

            let result;
            if (isUpdate) {
                console.log('🔄 Updating document with ID:', attendanceData.id);
                result = await FirebaseService.updateDocument('attendance', attendanceData.id, attendanceData);
            } else {
                console.log('➕ Adding new document');
                result = await FirebaseService.addDocument('attendance', attendanceData);
            }

            console.log('✅ Operation result:', result);

            return ResponseHelper.success(res, result, 
                `Attendance ${isUpdate ? 'updated' : 'created'} successfully for ${member.nama}`, 
                isUpdate ? 200 : 201
            );
            
        } catch (error) {
            console.error('❌ Error in createManualAttendance:', error);
            console.error('❌ Error stack:', error.stack);
            return ResponseHelper.error(res, 'Failed to process manual attendance');
        }
    }

    // GET /api/attendance/auto-update-status - Update status otomatis untuk semua anggota
    static async autoUpdateStatus(req, res) {
        try {
            const today = moment().format('YYYY-MM-DD');
            const currentTime = moment();
            const cutoffTime = moment(`${today} 18:00:00`);

            // Hanya jalankan jika sudah lewat jam 18:00
            if (!currentTime.isAfter(cutoffTime)) {
                return ResponseHelper.success(res, {
                    message: 'Auto update belum waktunya (belum lewat jam 18:00)',
                    currentTime: currentTime.format('HH:mm:ss'),
                    cutoffTime: '18:00:00'
                });
            }

            // Get all attendance records for today
            const todayAttendance = await FirebaseService.getDocuments('attendance', [
                { field: 'tanggal', operator: '==', value: today }
            ]);

            // Get all members to check who haven't attended
            const allMembers = await FirebaseService.getDocuments('members');
            
            let updatedRecords = [];
            let createdRecords = [];

            for (const member of allMembers) {
                // Check if member has attendance record today
                const memberAttendance = todayAttendance.find(att => att.memberId === member.id);
                
                if (memberAttendance) {
                    // Update existing record status
                    const newStatus = AttendanceController.determineStatus(
                        memberAttendance.jamDatang, 
                        memberAttendance.jamPulang, 
                        today
                    );
                    
                    if (memberAttendance.status !== newStatus) {
                        await FirebaseService.updateDocument('attendance', memberAttendance.id, {
                            status: newStatus
                        });
                        updatedRecords.push({
                            nama: member.nama,
                            oldStatus: memberAttendance.status,
                            newStatus: newStatus
                        });
                    }
                } else {
                    // Create new record for member who never attended (mark as "Tidak Piket")
                    const newAttendance = await FirebaseService.addDocument('attendance', {
                        memberId: member.id,
                        nama: member.nama,
                        nim: member.nim,
                        idRfid: member.idRfid,
                        tanggal: today,
                        jamDatang: null,
                        jamPulang: null,
                        durasi: null,
                        status: 'Tidak Piket'
                    });
                    
                    createdRecords.push({
                        nama: member.nama,
                        status: 'Tidak Piket'
                    });
                }
            }

            return ResponseHelper.success(res, {
                updateTime: currentTime.format('YYYY-MM-DD HH:mm:ss'),
                updatedRecords,
                createdRecords,
                summary: {
                    totalUpdated: updatedRecords.length,
                    totalCreated: createdRecords.length
                }
            }, 'Auto status update completed successfully');

        } catch (error) {
            console.error('Error in autoUpdateStatus:', error);
            return ResponseHelper.error(res, 'Failed to auto update status');
        }
    }

    // GET /api/attendance/stream - Server-Sent Events for real-time updates
    static async streamAttendanceUpdates(req, res) {
        try {
            // Set headers for SSE
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Cache-Control'
            });

            // Send initial data
            const today = moment().format('YYYY-MM-DD');
            const attendance = await FirebaseService.getDocuments('attendance', [
                { field: 'tanggal', operator: '==', value: today }
            ]);

            // Update status for initial data
            const updatedAttendance = attendance.map(record => {
                const autoStatus = AttendanceController.determineStatus(record.jamDatang, record.jamPulang, record.tanggal);
                return { ...record, status: autoStatus };
            });

            res.write(`data: ${JSON.stringify({
                type: 'initial',
                attendance: updatedAttendance,
                timestamp: new Date().toISOString()
            })}\n\n`);

            // Send periodic updates every 30 seconds
            const interval = setInterval(async () => {
                try {
                    const currentAttendance = await FirebaseService.getDocuments('attendance', [
                        { field: 'tanggal', operator: '==', value: today }
                    ]);

                    const currentUpdated = currentAttendance.map(record => {
                        const autoStatus = AttendanceController.determineStatus(record.jamDatang, record.jamPulang, record.tanggal);
                        return { ...record, status: autoStatus };
                    });

                    res.write(`data: ${JSON.stringify({
                        type: 'update',
                        attendance: currentUpdated,
                        timestamp: new Date().toISOString()
                    })}\n\n`);
                } catch (error) {
                    console.error('Error in SSE update:', error);
                    res.write(`data: ${JSON.stringify({
                        type: 'error',
                        message: 'Failed to fetch updates',
                        timestamp: new Date().toISOString()
                    })}\n\n`);
                }
            }, 30000); // 30 seconds

            // Cleanup on client disconnect
            req.on('close', () => {
                clearInterval(interval);
                console.log('SSE client disconnected');
            });

        } catch (error) {
            console.error('Error in streamAttendanceUpdates:', error);
            return ResponseHelper.error(res, 'Failed to start attendance stream');
        }
    }
}

module.exports = AttendanceController;
