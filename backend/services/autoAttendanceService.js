const FirebaseService = require('./firebaseService');
const moment = require('moment-timezone');

const AttendanceController = require('../controllers/attendanceController');


class AutoAttendanceService {
    constructor() {
        this.isRunning = false;
        this.timezone = 'Asia/Jakarta';
        
        
        moment.tz.setDefault(this.timezone);
        
        
        this.startAutoService();
    }

    
    startAutoService() {
        const cron = require('node-cron');
        
        console.log('Auto Attendance Service started - scheduled for 18:01 WIB daily');
        
        
        cron.schedule('1 18 * * *', async () => {
            console.log('Running scheduled auto attendance check at 18:01 WIB...');
            await this.checkAndGenerateAbsentRecords();
        }, {
            scheduled: true,
            timezone: this.timezone
        });
        
        console.log('Auto Attendance Service cron job configured successfully');
    }

    
    stopAutoService() {
        console.log('ℹ Auto Attendance Service uses cron job (cannot be stopped manually)');
    }

    
    async checkAndGenerateAbsentRecords() {
        try {
            const now = moment().tz(this.timezone);
            const today = now.format('YYYY-MM-DD');
            
            console.log(`Auto checking for absent members at ${now.format('HH:mm')} WIB`);
            
            
            await this.autoCheckoutIncompleteAttendance(today);
            
            
            await this.generateAbsentRecordsForToday(today);
            
        } catch (error) {
            console.error('Error in auto attendance check:', error);
        }
    }

    
    async autoCheckoutIncompleteAttendance(today) {
        try {
            console.log(`Auto checkout check for incomplete attendance on ${today}`);
            
            
            const incompleteAttendance = await FirebaseService.getDocuments('attendance', [
                { field: 'tanggal', operator: '==', value: today },
                { field: 'jamDatang', operator: '!=', value: null },
                { field: 'jamPulang', operator: '==', value: null }
            ]);
            
            console.log(`Found ${incompleteAttendance.length} incomplete attendance records`);
            
            if (incompleteAttendance.length === 0) {
                return { success: true, processedRecords: 0 };
            }
            
            const now = moment().tz(this.timezone);
            const processedRecords = [];
            
            for (const record of incompleteAttendance) {
                
                
                const currentStatus = AttendanceController.determineStatus(record.jamDatang, record.jamPulang, record.tanggal);
                
                console.log(`Checking record for ${record.nama}: currentStatus=${currentStatus}, jamDatang=${record.jamDatang}, jamPulang=${record.jamPulang}`);
                
                if (currentStatus !== 'Sedang Piket') {
                    console.log(` Skip ${record.nama} - Status bukan 'Sedang Piket' (actual: ${currentStatus})`);
                    continue;
                }
                
                try {
                    
                    const updateData = {
                        status: 'Tidak Piket', 
                        autoCheckedOut: true,
                        autoCheckedOutAt: now.toISOString(),
                        autoCheckedOutReason: 'Failed to checkout before 18:00 - changed from Sedang Piket to Tidak Piket',
                        updatedAt: now.toISOString()
                    };
                    
                    await FirebaseService.updateDocument('attendance', record.id, updateData);
                    
                    console.log(`Auto checkout (Sedang Piket → Tidak Piket): ${record.nama} - Check-in: ${record.jamDatang}`);
                    
                    processedRecords.push({
                        id: record.id,
                        nama: record.nama,
                        nim: record.nim,
                        jamDatang: record.jamDatang,
                        originalStatus: record.status
                    });
                    
                    
                    try {
                        await FirebaseService.sendRealtimeUpdate('attendance_auto_checkout', {
                            id: record.id,
                            nama: record.nama,
                            nim: record.nim,
                            tanggal: today,
                            jamDatang: record.jamDatang,
                            jamPulang: null,
                            status: 'Tidak Piket',
                            reason: 'Auto checkout - tidak checkout sebelum 18:00, status berubah dari Sedang Piket ke Tidak Piket',
                            timestamp: now.toISOString()
                        });
                    } catch (realtimeError) {
                        console.warn(`Failed to send auto checkout realtime update:`, realtimeError.message);
                    }
                    
                } catch (error) {
                    console.error(`Failed to auto checkout record ${record.id}:`, error.message);
                }
            }
            
            const result = {
                success: true,
                date: today,
                totalIncompleteRecords: incompleteAttendance.length,
                processedRecords: processedRecords.length,
                processedData: processedRecords
            };
            
            console.log(`Auto checkout completed:`, result);
            return result;
            
        } catch (error) {
            console.error('Error in autoCheckoutIncompleteAttendance:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    
    async generateAbsentRecordsForToday(today) {
        try {
            
            const fullDayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            const todayDate = moment(today);
            const todayName = fullDayNames[todayDate.day()];
            
            console.log(` Generating absent records for ${today} (${todayName})`);
            
            
            const allMembers = await FirebaseService.getDocuments('members', [
                { field: 'status', operator: '==', value: 'active' }
            ]);
            
            
            const membersWithPiketToday = allMembers.filter(member => {
                return member.hariPiket && Array.isArray(member.hariPiket) && member.hariPiket.includes(todayName);
            });
            
            console.log(`Found ${membersWithPiketToday.length} members with piket on ${todayName}`);
            
            
            const todayAttendance = await FirebaseService.getDocuments('attendance', [
                { field: 'tanggal', operator: '==', value: today }
            ]);
            
            console.log(`Found ${todayAttendance.length} attendance records for today`);
            
            
            const absentMembers = [];
            
            console.log('Checking attendance for members with piket today...');
            
            for (const member of membersWithPiketToday) {
                
                const existingRecords = todayAttendance.filter(att => 
                    att.anggotaId === member.id || 
                    att.memberId === member.id ||
                    att.nim === member.nim || 
                    att.idRfid === member.idRfid ||
                    (att.nama && member.nama && att.nama.toLowerCase().trim() === member.nama.toLowerCase().trim())
                );
                
                if (existingRecords.length === 0) {
                    
                    absentMembers.push(member);
                    console.log(`Will create absent record for: ${member.nama} (${member.nim}) - NO RECORDS FOUND`);
                } else {
                    
                    console.log(` Skip ${member.nama} (${member.nim}) - Found ${existingRecords.length} existing record(s):`);
                    existingRecords.forEach((record, index) => {
                        console.log(`${index + 1}. Status: ${record.status}, JamDatang: ${record.jamDatang}, JamPulang: ${record.jamPulang}, AutoGenerated: ${record.autoGenerated}`);
                    });
                }
            }
            
            console.log(`Found ${absentMembers.length} absent members: ${absentMembers.map(m => m.nama).join(', ')}`);
            
            
            const generatedRecords = [];
            const now = moment().tz(this.timezone);
            
            for (const member of absentMembers) {
                
                console.log(`Double-checking for ${member.nama} before creating record...`);
                
                const recentCheck = await FirebaseService.getDocuments('attendance', [
                    { field: 'tanggal', operator: '==', value: today }
                ]);
                
                
                const memberRecords = recentCheck.filter(att => 
                    att.anggotaId === member.id || 
                    att.memberId === member.id ||
                    att.nim === member.nim || 
                    att.idRfid === member.idRfid ||
                    (att.nama && member.nama && att.nama.toLowerCase().trim() === member.nama.toLowerCase().trim())
                );
                
                if (memberRecords.length > 0) {
                    console.log(`Skip ${member.nama} - Found ${memberRecords.length} existing records during double-check:`);
                    memberRecords.forEach(record => {
                        console.log(`- ID: ${record.id}, Status: ${record.status}, JamDatang: ${record.jamDatang}, AutoGenerated: ${record.autoGenerated}`);
                    });
                    continue; 
                }
                
                const attendanceData = {
                    anggotaId: member.id,
                    nama: member.nama,
                    nim: member.nim,
                    idRfid: member.idRfid || null,
                    tanggal: today,
                    jamDatang: null,
                    jamPulang: null,
                    durasi: null,
                    status: 'Tidak Hadir',
                    autoGenerated: true,
                    autoGeneratedAt: now.toISOString(),
                    autoGeneratedReason: `No attendance recorded by 18:00 on ${todayName}`,
                    createdAt: now.toISOString(),
                    updatedAt: now.toISOString()
                };
                
                try {
                    const recordId = await FirebaseService.addDocument('attendance', attendanceData);
                    console.log(`Generated "Tidak Hadir" record for ${member.nama} (${recordId})`);
                    
                    generatedRecords.push({
                        id: recordId,
                        memberName: member.nama,
                        memberNim: member.nim
                    });
                    
                    
                    try {
                        await FirebaseService.sendRealtimeUpdate('attendance_auto_generated', {
                            id: recordId,
                            member: {
                                id: member.id,
                                nama: member.nama,
                                nim: member.nim
                            },
                            tanggal: today,
                            status: 'Tidak Hadir',
                            autoGenerated: true,
                            timestamp: now.toISOString()
                        });
                    } catch (realtimeError) {
                        console.warn(`Failed to send realtime update for ${member.nama}:`, realtimeError.message);
                    }
                    
                } catch (error) {
                    console.error(`Failed to generate record for ${member.nama}:`, error.message);
                }
            }
            
            const result = {
                success: true,
                date: today,
                dayName: todayName,
                totalMembersWithPiket: membersWithPiketToday.length,
                existingAttendanceRecords: todayAttendance.length,
                absentMembersFound: absentMembers.length,
                recordsGenerated: generatedRecords.length,
                generatedRecords: generatedRecords
            };
            
            console.log(`AutoAttendanceService completed:`, result);
            
            return result;
            
        } catch (error) {
            console.error('Error in generateAbsentRecordsForToday:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    
    async cleanDuplicateAttendance(targetDate) {
        try {
            const today = targetDate || moment().tz(this.timezone).format('YYYY-MM-DD');
            console.log(`Cleaning duplicate attendance records for ${today}`);
            
            
            const allRecords = await FirebaseService.getDocuments('attendance', [
                { field: 'tanggal', operator: '==', value: today }
            ]);
            
            console.log(`Found ${allRecords.length} total records for ${today}`);
            
            
            const memberRecords = {};
            allRecords.forEach(record => {
                
                const possibleKeys = [
                    record.nim,
                    record.anggotaId, 
                    record.memberId,
                    record.idRfid
                ].filter(Boolean);
                
                
                let groupKey = null;
                for (const key of possibleKeys) {
                    if (memberRecords[key]) {
                        groupKey = key;
                        break;
                    }
                }
                
                if (!groupKey) {
                    
                    groupKey = possibleKeys[0] || record.nama;
                    memberRecords[groupKey] = [];
                }
                
                memberRecords[groupKey].push(record);
            });
            
            let duplicatesFound = 0;
            let duplicatesRemoved = 0;
            
            
            for (const [memberKey, records] of Object.entries(memberRecords)) {
                if (records.length > 1) {
                    duplicatesFound += records.length - 1;
                    console.log(`Found ${records.length} records for member: ${memberKey}`);
                    
                    
                    records.forEach((record, i) => {
                        console.log(`${i + 1}. ID: ${record.id}, Status: ${record.status}, JamDatang: ${record.jamDatang}, JamPulang: ${record.jamPulang}, AutoGenerated: ${record.autoGenerated}`);
                    });
                    
                    
                    records.sort((a, b) => {
                        
                        if (a.autoGenerated !== b.autoGenerated) {
                            return a.autoGenerated ? 1 : -1; 
                        }
                        
                        
                        const completenessA = (a.jamDatang ? 1 : 0) + (a.jamPulang ? 1 : 0);
                        const completenessB = (b.jamDatang ? 1 : 0) + (b.jamPulang ? 1 : 0);
                        if (completenessA !== completenessB) {
                            return completenessB - completenessA; 
                        }
                        
                        
                        const statusPriorityA = a.status === 'Hadir' ? 3 : (a.status === 'Sedang Piket' ? 2 : 1);
                        const statusPriorityB = b.status === 'Hadir' ? 3 : (b.status === 'Sedang Piket' ? 2 : 1);
                        if (statusPriorityA !== statusPriorityB) {
                            return statusPriorityB - statusPriorityA;
                        }
                        
                        
                        return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
                    });
                    
                    
                    const keepRecord = records[0];
                    const deleteRecords = records.slice(1);
                    
                    console.log(`Keeping record ${keepRecord.id} (Status: ${keepRecord.status}, AutoGenerated: ${keepRecord.autoGenerated}) for ${memberKey}`);
                    
                    for (const deleteRecord of deleteRecords) {
                        try {
                            await FirebaseService.deleteDocument('attendance', deleteRecord.id);
                            duplicatesRemoved++;
                            console.log(` Deleted duplicate record ${deleteRecord.id} (Status: ${deleteRecord.status}, AutoGenerated: ${deleteRecord.autoGenerated})`);
                        } catch (error) {
                            console.error(`Failed to delete record ${deleteRecord.id}:`, error.message);
                        }
                    }
                }
            }
            
            const result = {
                success: true,
                date: today,
                totalRecords: allRecords.length,
                duplicatesFound,
                duplicatesRemoved,
                uniqueMembers: Object.keys(memberRecords).length
            };
            
            console.log(`Duplicate cleanup completed:`, result);
            return result;
            
        } catch (error) {
            console.error('Error in cleanDuplicateAttendance:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    
    async manualTrigger() {
        console.log('Manual trigger for auto attendance generation...');
        const today = moment().tz(this.timezone).format('YYYY-MM-DD');
        
        
        const cleanResult = await this.cleanDuplicateAttendance(today);
        
        
        const checkoutResult = await this.autoCheckoutIncompleteAttendance(today);
        
        
        const absentResult = await this.generateAbsentRecordsForToday(today);
        
        return {
            duplicateClean: cleanResult,
            autoCheckout: checkoutResult,
            absentGeneration: absentResult,
            summary: {
                date: today,
                duplicatesRemoved: cleanResult.duplicatesRemoved || 0,
                autoCheckedOut: checkoutResult.processedRecords || 0,
                absentGenerated: absentResult.recordsGenerated || 0
            }
        };
    }
}

module.exports = AutoAttendanceService;
