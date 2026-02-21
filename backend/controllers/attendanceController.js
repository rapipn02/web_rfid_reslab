const FirebaseService = require('../services/firebaseService');
const ResponseHelper = require('../utils/responseHelper');
const moment = require('moment-timezone');


moment.tz.setDefault('Asia/Jakarta');


class AttendanceController {
    
    
    static determineStatus(jamDatang, jamPulang, tanggal = null) {
        const recordDate = tanggal || moment().tz('Asia/Jakarta').format('YYYY-MM-DD');
        const currentTime = moment().tz('Asia/Jakarta');
        const cutoffTime = moment(`${recordDate} 18:00:00`).tz('Asia/Jakarta');
        
        
        if (jamPulang) {
            return 'Hadir';
        }
        
        
        if (jamDatang) {
            
            if (currentTime.isAfter(cutoffTime)) {
                
                return 'Tidak Piket';
            } else {
                
                return 'Sedang Piket';
            }
        }
        
        
        if (!jamDatang && currentTime.isAfter(cutoffTime)) {
            return 'Tidak Piket';
        }
        
        
        return 'Belum Piket';
    }
    
    
    static async getAllAttendance(req, res) {
        try {
            const { startDate, endDate, memberId, status } = req.query;
            
            const conditions = [];
            
            
            if (startDate) {
                conditions.push({ field: 'tanggal', operator: '>=', value: startDate });
            }
            if (endDate) {
                conditions.push({ field: 'tanggal', operator: '<=', value: endDate });
            }
            
            
            if (memberId) {
                conditions.push({ field: 'memberId', operator: '==', value: memberId });
            }
            
            
            if (status) {
                conditions.push({ field: 'status', operator: '==', value: status });
            }

            let attendance = await FirebaseService.getDocuments('attendance', conditions);
            
            
            attendance = attendance.map(record => {
                const autoStatus = AttendanceController.determineStatus(record.jamDatang, record.jamPulang, record.tanggal);
                return {
                    ...record,
                    status: autoStatus
                };
            });
            
            
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

    
    static async getTodayAttendance(req, res) {
        try {
            const today = moment().tz('Asia/Jakarta').format('YYYY-MM-DD');
            
            const conditions = [
                { field: 'tanggal', operator: '==', value: today }
            ];

            let attendance = await FirebaseService.getDocuments('attendance', conditions);
            
            
            attendance = attendance.map(record => {
                const autoStatus = AttendanceController.determineStatus(record.jamDatang, record.jamPulang, record.tanggal);
                return {
                    ...record,
                    status: autoStatus
                };
            });
            
            
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

    
    static async getTodayAttendanceWithMembers(req, res) {
        try {
            const today = moment().tz('Asia/Jakarta').format('YYYY-MM-DD');
            
            
            
            
            
            const attendanceConditions = [
                { field: 'tanggal', operator: '==', value: today }
            ];

            let attendance = await FirebaseService.getDocuments('attendance', attendanceConditions);
            
            
            attendance = attendance.map(record => {
                const autoStatus = AttendanceController.determineStatus(record.jamDatang, record.jamPulang, record.tanggal);
                return {
                    ...record,
                    status: autoStatus
                };
            });

            
            const allMembers = await FirebaseService.getDocuments('members');
            
            
            const attendanceWithMembers = attendance.map(att => {
                const member = allMembers.find(m => m.id === att.anggotaId);
                return {
                    ...att,
                    member: member || null,
                    nama: member?.nama || 'Unknown Member',
                    nim: member?.nim || 'N/A',
                    idRfid: member?.idRfid || 'N/A'
                };
            });

            
            attendanceWithMembers.sort((a, b) => {
                const timeA = a.jamPulang || a.jamDatang || '00:00:00';
                const timeB = b.jamPulang || b.jamDatang || '00:00:00';
                return timeB.localeCompare(timeA);
            });
            
            
            const stats = {
                total: attendanceWithMembers.length,
                hadir: attendanceWithMembers.filter(a => a.status === 'Hadir').length,
                sedangPiket: attendanceWithMembers.filter(a => a.status === 'Sedang Piket').length,
                belumPiket: attendanceWithMembers.filter(a => a.status === 'Belum Piket').length,
                tidakPiket: attendanceWithMembers.filter(a => a.status === 'Tidak Piket').length,
                checkedIn: attendanceWithMembers.filter(a => a.jamDatang && !a.jamPulang).length,
                checkedOut: attendanceWithMembers.filter(a => a.jamDatang && a.jamPulang).length
            };

            console.log('Today attendance with members loaded:', { date: today, totalRecords: attendanceWithMembers.length, stats });

            return ResponseHelper.success(res, {
                date: today,
                attendance: attendanceWithMembers,
                stats
            }, 'Today\'s attendance with members retrieved successfully');
            
        } catch (error) {
            console.error('Error in getTodayAttendanceWithMembers:', error);
            return ResponseHelper.error(res, 'Failed to retrieve today\'s attendance with members');
        }
    }

    
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

    
    static async createAttendance(req, res) {
        try {
            const { memberId, tanggal, jamDatang, jamPulang, status } = req.body;

            
            const member = await FirebaseService.getDocumentById('members', memberId);
            if (!member) {
                return ResponseHelper.notFound(res, 'Member not found');
            }

            
            const existingAttendance = await FirebaseService.getDocuments('attendance', [
                { field: 'memberId', operator: '==', value: memberId },
                { field: 'tanggal', operator: '==', value: tanggal }
            ]);

            if (existingAttendance.length > 0) {
                return ResponseHelper.error(res, 'Attendance record already exists for this date', 400);
            }

            
            let durasi = null;
            if (jamDatang && jamPulang) {
                durasi = AttendanceController.calculateDuration(jamDatang, jamPulang);
            }

            
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
                status: autoStatus 
            };

            const newAttendance = await FirebaseService.addDocument('attendance', attendanceData);
            
            return ResponseHelper.success(res, newAttendance, 'Attendance record created successfully', 201);
            
        } catch (error) {
            console.error('Error in createAttendance:', error);
            return ResponseHelper.error(res, 'Failed to create attendance record');
        }
    }

    
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

            
            const finalJamDatang = jamDatang || existingAttendance.jamDatang;
            const finalJamPulang = jamPulang || existingAttendance.jamPulang;
            
            if (finalJamDatang && finalJamPulang) {
                updateData.durasi = AttendanceController.calculateDuration(finalJamDatang, finalJamPulang);
            }

            
            updateData.status = AttendanceController.determineStatus(finalJamDatang, finalJamPulang, existingAttendance.tanggal);

            const updatedAttendance = await FirebaseService.updateDocument('attendance', id, updateData);
            
            return ResponseHelper.success(res, updatedAttendance, 'Attendance record updated successfully');
            
        } catch (error) {
            console.error('Error in updateAttendance:', error);
            return ResponseHelper.error(res, 'Failed to update attendance record');
        }
    }

    
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

    
    static async getAttendanceStats(req, res) {
        try {
            const { period = 'month' } = req.query;
            
            let startDate, endDate;
            
            switch (period) {
                case 'today':
                    startDate = endDate = moment().tz('Asia/Jakarta').format('YYYY-MM-DD');
                    break;
                case 'week':
                    startDate = moment().tz('Asia/Jakarta').startOf('week').format('YYYY-MM-DD');
                    endDate = moment().tz('Asia/Jakarta').endOf('week').format('YYYY-MM-DD');
                    break;
                case 'month':
                default:
                    startDate = moment().tz('Asia/Jakarta').startOf('month').format('YYYY-MM-DD');
                    endDate = moment().tz('Asia/Jakarta').endOf('month').format('YYYY-MM-DD');
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

    
    static calculateDuration(jamDatang, jamPulang) {
        try {
            const datang = moment(jamDatang, 'HH:mm:ss');
            const pulang = moment(jamPulang, 'HH:mm:ss');
            
            if (pulang.isBefore(datang)) {
                
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

    
    static async createManualAttendance(req, res) {
        try {
            console.log('createManualAttendance called with body:', req.body);
            
            const { 
                memberId, 
                nim, 
                nama,
                tanggal = moment().tz('Asia/Jakarta').format('YYYY-MM-DD'),
                jamDatang,
                jamPulang,
                status = 'Hadir',
                mode = 'datang' 
            } = req.body;

            console.log('Parsed data:', { memberId, nim, nama, tanggal, jamDatang, jamPulang, status, mode });

            
            if (!memberId && !nim && !nama) {
                console.log('Validation error: No identifier provided');
                return ResponseHelper.error(res, 'Provide either memberId, nim, or nama to identify member', 400);
            }

            
            let member = null;
            console.log('Searching for member...');
            
            if (memberId) {
                console.log('Searching by memberId:', memberId);
                member = await FirebaseService.getDocumentById('members', memberId);
            } else if (nim) {
                console.log('Searching by nim:', nim);
                const members = await FirebaseService.getDocuments('members', [
                    { field: 'nim', operator: '==', value: nim }
                ]);
                console.log('Found members by nim:', members.length);
                member = members[0];
            } else if (nama) {
                console.log('Searching by nama:', nama);
                const members = await FirebaseService.getDocuments('members', [
                    { field: 'nama', operator: '==', value: nama }
                ]);
                console.log('Found members by nama:', members.length);
                member = members[0];
            }

            if (!member) {
                console.log('Member not found');
                return ResponseHelper.notFound(res, 'Member not found');
            }

            console.log('Member found:', { id: member.id, nama: member.nama, nim: member.nim });

            
            console.log('Checking existing attendance for date:', tanggal);
            const existingAttendance = await FirebaseService.getDocuments('attendance', [
                { field: 'memberId', operator: '==', value: member.id },
                { field: 'tanggal', operator: '==', value: tanggal }
            ]);

            console.log('Existing attendance records found:', existingAttendance.length);

            let attendanceData = {};
            let isUpdate = false;

            if (existingAttendance.length > 0) {
                
                console.log('Updating existing record');
                isUpdate = true;
                attendanceData = existingAttendance[0];
                console.log('Existing record:', attendanceData);
            } else {
                
                console.log('Creating new record');
                attendanceData = {
                    memberId: member.id,
                    nama: member.nama,
                    nim: member.nim,
                    idRfid: member.idRfid,
                    tanggal,
                    jamDatang: null,
                    jamPulang: null,
                    durasi: null,
                    status: 'Belum Piket' 
                };
            }

            console.log('Processing mode:', mode);
            
            if (mode === 'datang' || mode === 'full') {
                attendanceData.jamDatang = jamDatang || moment().tz('Asia/Jakarta').format('HH:mm:ss');
                console.log('Set jamDatang:', attendanceData.jamDatang);
            }

            if (mode === 'pulang' || mode === 'full') {
                attendanceData.jamPulang = jamPulang || moment().tz('Asia/Jakarta').format('HH:mm:ss');
                console.log('Set jamPulang:', attendanceData.jamPulang);
                
                
                if (attendanceData.jamDatang && attendanceData.jamPulang) {
                    attendanceData.durasi = AttendanceController.calculateDuration(attendanceData.jamDatang, attendanceData.jamPulang);
                    console.log('⏱ Calculated duration:', attendanceData.durasi);
                }
            }

            
            attendanceData.status = AttendanceController.determineStatus(attendanceData.jamDatang, attendanceData.jamPulang, tanggal);
            console.log('Determined status:', attendanceData.status);

            console.log('Final attendance data:', attendanceData);

            let result;
            if (isUpdate) {
                console.log('Updating document with ID:', attendanceData.id);
                result = await FirebaseService.updateDocument('attendance', attendanceData.id, attendanceData);
            } else {
                console.log('Adding new document');
                result = await FirebaseService.addDocument('attendance', attendanceData);
            }

            console.log('Operation result:', result);

            return ResponseHelper.success(res, result, 
                `Attendance ${isUpdate ? 'updated' : 'created'} successfully for ${member.nama}`, 
                isUpdate ? 200 : 201
            );
            
        } catch (error) {
            console.error('Error in createManualAttendance:', error);
            console.error('Error stack:', error.stack);
            return ResponseHelper.error(res, 'Failed to process manual attendance');
        }
    }

    
    static async autoUpdateStatus(req, res) {
        try {
            const today = moment().tz('Asia/Jakarta').format('YYYY-MM-DD');
            const currentTime = moment().tz('Asia/Jakarta');
            const cutoffTime = moment(`${today} 18:00:00`).tz('Asia/Jakarta');

            
            if (!currentTime.isAfter(cutoffTime)) {
                return ResponseHelper.success(res, {
                    message: 'Auto update belum waktunya (belum lewat jam 18:00)',
                    currentTime: currentTime.format('HH:mm:ss'),
                    cutoffTime: '18:00:00'
                });
            }

            
            const todayAttendance = await FirebaseService.getDocuments('attendance', [
                { field: 'tanggal', operator: '==', value: today }
            ]);

            
            const allMembers = await FirebaseService.getDocuments('members');
            
            let updatedRecords = [];
            let createdRecords = [];

            for (const member of allMembers) {
                
                const memberAttendance = todayAttendance.find(att => att.memberId === member.id);
                
                if (memberAttendance) {
                    
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

    
    static async streamAttendanceUpdates(req, res) {
        try {
            const { adminDb: db } = require('../config/firebase');
            
            
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Cache-Control'
            });

            const today = moment().format('YYYY-MM-DD');
            
            
            const attendance = await FirebaseService.getDocuments('attendance', [
                { field: 'tanggal', operator: '==', value: today }
            ]);

            const updatedAttendance = attendance.map(record => {
                const autoStatus = AttendanceController.determineStatus(record.jamDatang, record.jamPulang, record.tanggal);
                return { ...record, status: autoStatus };
            });

            res.write(`data: ${JSON.stringify({
                type: 'initial',
                attendance: updatedAttendance,
                timestamp: new Date().toISOString()
            })}\n\n`);

            
            
            const unsubscribe = db.collection('attendance')
                .where('tanggal', '==', today)
                .onSnapshot((snapshot) => {
                    try {
                        const currentAttendance = [];
                        snapshot.forEach(doc => {
                            const data = doc.data();
                            const autoStatus = AttendanceController.determineStatus(data.jamDatang, data.jamPulang, data.tanggal);
                            currentAttendance.push({ id: doc.id, ...data, status: autoStatus });
                        });

                        res.write(`data: ${JSON.stringify({
                            type: 'update',
                            attendance: currentAttendance,
                            timestamp: new Date().toISOString()
                        })}\n\n`);
                    } catch (error) {
                        console.error('Error in SSE Firestore listener:', error);
                        res.write(`data: ${JSON.stringify({
                            type: 'error',
                            message: 'Failed to fetch updates',
                            timestamp: new Date().toISOString()
                        })}\n\n`);
                    }
                }, (error) => {
                    console.error('Error in Firestore listener:', error);
                });

            
            req.on('close', () => {
                unsubscribe(); 
                console.log('SSE client disconnected, Firestore listener stopped');
            });

        } catch (error) {
            console.error('Error in streamAttendanceUpdates:', error);
            return ResponseHelper.error(res, 'Failed to start attendance stream');
        }
    }

    
    static async checkIn(req, res) {
        try {
            const { member_id, rfid_tag } = req.body;
            const currentTime = moment();
            const today = currentTime.format('YYYY-MM-DD');
            const jamMasuk = currentTime.format('HH:mm:ss');

            
            const member = await FirebaseService.getMemberById(member_id);
            if (!member) {
                return ResponseHelper.error(res, 'Member tidak ditemukan', 404);
            }

            
            const existingAttendance = await FirebaseService.getAttendanceByMemberAndDate(member_id, today);
            if (existingAttendance && existingAttendance.jam_masuk) {
                return ResponseHelper.error(res, 'Sudah melakukan check-in hari ini', 400);
            }

            
            const attendanceData = {
                member_id,
                nama: member.nama,
                tanggal: today,
                jam_masuk: jamMasuk,
                jam_keluar: null,
                status: 'Sedang Piket',
                keterangan: 'Check-in normal',
                created_at: currentTime.toISOString(),
                updated_at: currentTime.toISOString()
            };

            const result = await FirebaseService.createAttendance(attendanceData);

            return ResponseHelper.success(res, {
                attendance: result,
                message: `Check-in berhasil pada ${jamMasuk}`
            }, 'Check-in berhasil');

        } catch (error) {
            console.error('Error in checkIn:', error);
            return ResponseHelper.error(res, 'Gagal melakukan check-in');
        }
    }

    
    static async checkOut(req, res) {
        try {
            const { member_id } = req.body;
            const currentTime = moment();
            const today = currentTime.format('YYYY-MM-DD');
            const jamKeluar = currentTime.format('HH:mm:ss');

            
            const { status, keterangan, durasi_kerja, warning } = req.attendanceStatus || {};

            
            const member = await FirebaseService.getMemberById(member_id);
            if (!member) {
                return ResponseHelper.error(res, 'Member tidak ditemukan', 404);
            }

            
            const existingAttendance = await FirebaseService.getAttendanceByMemberAndDate(member_id, today);
            if (!existingAttendance || !existingAttendance.jam_masuk) {
                return ResponseHelper.error(res, 'Belum melakukan check-in hari ini', 400);
            }

            if (existingAttendance.jam_keluar) {
                return ResponseHelper.error(res, 'Sudah melakukan check-out hari ini', 400);
            }

            
            const updateData = {
                jam_keluar: jamKeluar,
                status: status || 'Hadir',
                keterangan: keterangan || 'Check-out normal',
                durasi_kerja: durasi_kerja || 0,
                updated_at: currentTime.toISOString()
            };

            await FirebaseService.updateAttendance(existingAttendance.id, updateData);

            const response = {
                attendance: { ...existingAttendance, ...updateData },
                message: `Check-out berhasil pada ${jamKeluar}`,
                durasi_kerja: `${durasi_kerja} jam`,
                status_kehadiran: status
            };

            if (warning) {
                response.warning = warning;
            }

            return ResponseHelper.success(res, response, 'Check-out berhasil');

        } catch (error) {
            console.error('Error in checkOut:', error);
            return ResponseHelper.error(res, 'Gagal melakukan check-out');
        }
    }

    
    static async forceAutoCheckout(req, res) {
        try {
            const AttendanceMiddleware = require('../middleware/attendanceMiddleware');
            const result = await AttendanceMiddleware.autoCheckoutAfter6PM();

            if (result.success) {
                return ResponseHelper.success(res, {
                    updated_count: result.updated,
                    message: result.message
                }, 'Auto checkout berhasil dijalankan');
            } else {
                return ResponseHelper.error(res, result.error || 'Gagal menjalankan auto checkout');
            }

        } catch (error) {
            console.error('Error in forceAutoCheckout:', error);
            return ResponseHelper.error(res, 'Gagal menjalankan force auto checkout');
        }
    }

    
    static async checkIn(req, res) {
        try {
            const { member_id, rfid_card } = req.body;
            
            if (!member_id) {
                return ResponseHelper.error(res, 'Member ID wajib diisi', 400);
            }

            
            const member = await FirebaseService.getMemberById(member_id);
            if (!member) {
                return ResponseHelper.error(res, 'Member tidak ditemukan', 404);
            }

            const today = moment().format('YYYY-MM-DD');
            const currentTime = moment().format('HH:mm:ss');

            
            const attendanceData = {
                member_id: member_id,
                nama: member.nama,
                tanggal: today,
                jam_masuk: currentTime,
                jam_keluar: null,
                status: 'Sedang Piket',
                rfid_card: rfid_card || null,
                created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
                updated_at: moment().format('YYYY-MM-DD HH:mm:ss')
            };

            const result = await FirebaseService.createAttendance(attendanceData);

            return ResponseHelper.success(res, {
                id: result.id,
                ...attendanceData
            }, 'Check-in berhasil');

        } catch (error) {
            console.error('Error in checkIn:', error);
            return ResponseHelper.error(res, 'Gagal melakukan check-in');
        }
    }

    
    static async checkOut(req, res) {
        try {
            const { member_id } = req.body;
            
            if (!member_id) {
                return ResponseHelper.error(res, 'Member ID wajib diisi', 400);
            }

            const today = moment().format('YYYY-MM-DD');
            const currentTime = moment().format('HH:mm:ss');

            
            const attendanceRecords = await FirebaseService.getAttendanceByMemberAndDate(member_id, today);
            
            if (!attendanceRecords || attendanceRecords.length === 0) {
                return ResponseHelper.error(res, 'Tidak ada record check-in untuk hari ini', 404);
            }

            const attendance = attendanceRecords[0];
            
            if (attendance.jam_keluar) {
                return ResponseHelper.error(res, 'Anda sudah melakukan check-out hari ini', 400);
            }

            
            const updateData = {
                jam_keluar: currentTime,
                status: 'Hadir',
                updated_at: moment().format('YYYY-MM-DD HH:mm:ss')
            };

            await FirebaseService.updateAttendance(attendance.id, updateData);

            return ResponseHelper.success(res, {
                id: attendance.id,
                jam_keluar: currentTime,
                status: 'Hadir'
            }, 'Check-out berhasil');

        } catch (error) {
            console.error('Error in checkOut:', error);
            return ResponseHelper.error(res, 'Gagal melakukan check-out');
        }
    }

    
    static async getTodayAttendance(req, res) {
        try {
            const { memberId } = req.params;
            const today = moment().format('YYYY-MM-DD');

            const attendanceRecords = await FirebaseService.getAttendanceByMemberAndDate(memberId, today);
            
            if (!attendanceRecords || attendanceRecords.length === 0) {
                return ResponseHelper.success(res, null, 'Belum ada attendance hari ini');
            }

            const attendance = attendanceRecords[0];
            
            return ResponseHelper.success(res, attendance, 'Data attendance hari ini');

        } catch (error) {
            console.error('Error in getTodayAttendance:', error);
            return ResponseHelper.error(res, 'Gagal mengambil data attendance hari ini');
        }
    }

    
    static async generateAbsentRecords(req, res) {
        try {
            const AutoAttendanceService = require('../services/autoAttendanceService');
            
            console.log('Manual trigger for auto attendance generation requested');
            
            
            const autoService = new AutoAttendanceService();
            const result = await autoService.manualTrigger();
            
            if (result.autoCheckout && result.absentGeneration) {
                return ResponseHelper.success(res, result, 
                    `Auto checkout: ${result.summary.autoCheckedOut} records | ` +
                    `Absent generated: ${result.summary.absentGenerated} records`);
            } else {
                return ResponseHelper.error(res, 'Failed to process auto attendance', 400);
            }
            
        } catch (error) {
            console.error('Error in generateAbsentRecords:', error);
            return ResponseHelper.error(res, 'Gagal generate absent records: ' + error.message);
        }
    }

    
    static async manualAutoCheckout(req, res) {
        try {
            const AutoAttendanceService = require('../services/autoAttendanceService');
            const { targetDate } = req.body;
            
            console.log('Manual auto checkout trigger requested for date:', targetDate);
            
            const autoService = new AutoAttendanceService();
            const today = targetDate || moment().tz('Asia/Jakarta').format('YYYY-MM-DD');
            const result = await autoService.autoCheckoutIncompleteAttendance(today);
            
            if (result.success) {
                return ResponseHelper.success(res, result, 
                    `Auto checkout completed: ${result.processedRecords} records processed on ${result.date}`);
            } else {
                return ResponseHelper.error(res, result.error || 'Failed to auto checkout', 400);
            }
            
        } catch (error) {
            console.error('Error in manualAutoCheckout:', error);
            return ResponseHelper.error(res, 'Gagal auto checkout: ' + error.message);
        }
    }

    
    static async cleanDuplicateAttendance(req, res) {
        try {
            const AutoAttendanceService = require('../services/autoAttendanceService');
            const { targetDate } = req.body;
            
            console.log('Clean duplicate attendance requested for date:', targetDate);
            
            const autoService = new AutoAttendanceService();
            const result = await autoService.cleanDuplicateAttendance(targetDate);
            
            if (result.success) {
                return ResponseHelper.success(res, result, 
                    `Duplicate cleanup completed: ${result.duplicatesRemoved} duplicates removed from ${result.totalRecords} records`);
            } else {
                return ResponseHelper.error(res, result.error || 'Failed to clean duplicates', 400);
            }
            
        } catch (error) {
            console.error('Error in cleanDuplicateAttendance:', error);
            return ResponseHelper.error(res, 'Gagal clean duplicates: ' + error.message);
        }
    }

    
    static async fixTodayDuplicates(req, res) {
        try {
            console.log('Fix today duplicates requested');
            
            const today = moment().tz('Asia/Jakarta').format('YYYY-MM-DD');
            
            
            const todayRecords = await FirebaseService.getDocuments('attendance', [
                { field: 'tanggal', operator: '==', value: today }
            ]);
            
            console.log(`Found ${todayRecords.length} records for ${today}`);
            
            
            const memberGroups = {};
            todayRecords.forEach(record => {
                const keys = [record.nim, record.anggotaId, record.memberId, record.idRfid].filter(Boolean);
                const memberKey = keys[0] || record.nama;
                
                if (!memberGroups[memberKey]) {
                    memberGroups[memberKey] = [];
                }
                memberGroups[memberKey].push(record);
            });
            
            let fixed = 0;
            let removed = 0;
            
            for (const [memberKey, records] of Object.entries(memberGroups)) {
                if (records.length > 1) {
                    console.log(`Member ${memberKey} has ${records.length} records`);
                    
                    
                    const realRecords = records.filter(r => !r.autoGenerated);
                    const autoRecords = records.filter(r => r.autoGenerated);
                    
                    console.log(`Real records: ${realRecords.length}, Auto records: ${autoRecords.length}`);
                    
                    if (realRecords.length > 0) {
                        
                        const bestReal = realRecords.sort((a, b) => {
                            const scoreA = (a.jamDatang ? 1 : 0) + (a.jamPulang ? 1 : 0);
                            const scoreB = (b.jamDatang ? 1 : 0) + (b.jamPulang ? 1 : 0);
                            if (scoreA !== scoreB) return scoreB - scoreA;
                            return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
                        })[0];
                        
                        console.log(`Keeping real record: ${bestReal.id} (${bestReal.status})`);
                        
                        
                        const toDelete = records.filter(r => r.id !== bestReal.id);
                        for (const deleteRecord of toDelete) {
                            try {
                                await FirebaseService.deleteDocument('attendance', deleteRecord.id);
                                removed++;
                                console.log(` Deleted: ${deleteRecord.id} (${deleteRecord.status}, Auto: ${deleteRecord.autoGenerated})`);
                            } catch (error) {
                                console.error(`Failed to delete ${deleteRecord.id}:`, error.message);
                            }
                        }
                        fixed++;
                    }
                }
            }
            
            const result = {
                success: true,
                date: today,
                totalRecords: todayRecords.length,
                membersFixed: fixed,
                recordsRemoved: removed,
                uniqueMembers: Object.keys(memberGroups).length
            };
            
            return ResponseHelper.success(res, result, 
                `Fixed duplicates for ${fixed} members, removed ${removed} duplicate records`);
            
        } catch (error) {
            console.error('Error in fixTodayDuplicates:', error);
            return ResponseHelper.error(res, 'Gagal fix duplicates: ' + error.message);
        }
    }
}

module.exports = AttendanceController;
