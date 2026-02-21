const FirebaseService = require('../services/firebaseService');
const ResponseHelper = require('../utils/responseHelper');
const moment = require('moment-timezone');
const { adminDb: db } = require('../config/firebase');


moment.tz.setDefault('Asia/Jakarta');


class RfidController {
    
    
    static async checkMember(req, res) {
        try {
            const { rfidId, deviceId } = req.body;
            
            console.log(`Checking member for RFID: ${rfidId}`);

            
            const members = await FirebaseService.getDocuments('members', [
                { field: 'idRfid', operator: '==', value: rfidId },
                { field: 'status', operator: '==', value: 'active' }
            ]);

            if (members.length === 0) {
                console.log(`Member with RFID ${rfidId} not found or inactive`);
                
                
                try {
                    await FirebaseService.addDocument('rfid_scans', {
                        cardId: rfidId,
                        rfidId: rfidId,
                        deviceId: deviceId || 'ESP32_RFID_001',
                        timestamp: new Date(),
                        scanType: 'unknown',
                        memberId: null,
                        memberName: null,
                        memberNim: null,
                        attendanceId: null,
                        processed: false,
                        timezone: 'WIB',
                        reason: 'RFID not registered or member inactive',
                        endpoint: 'check-member'
                    });
                    console.log(`Logged unknown scan from check-member: ${rfidId}`);
                } catch (scanLogError) {
                    console.error('Error logging unknown scan:', scanLogError);
                }
                
                return ResponseHelper.error(res, 'RFID not registered or member inactive', 404);
            }

            const member = members[0];
            console.log(`Found member: ${member.nama} (${member.nim})`);
            
            
            const fullDayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            const currentWIB = moment().tz('Asia/Jakarta');
            const currentDay = currentWIB.day(); 
            const todayName = fullDayNames[currentDay];
            
            console.log(`Current WIB time: ${currentWIB.format('YYYY-MM-DD HH:mm:ss')} WIB`);
            console.log(`Today is: ${todayName} (day index: ${currentDay})`);
            console.log(`Member's hariPiket:`, member.hariPiket);
            
            
            let hasPiketToday = false;
            if (member.hariPiket && Array.isArray(member.hariPiket)) {
                hasPiketToday = member.hariPiket.includes(todayName);
            }
            
            console.log(`Has piket today (${todayName}): ${hasPiketToday}`);
            console.log(`Expected piket days: ${member.hariPiket ? member.hariPiket.join(',') : 'None'}`);
            console.log(`Current WIB hour: ${currentWIB.format('HH')}`);

            
            try {
                await FirebaseService.addDocument('rfid_scans', {
                    cardId: rfidId,
                    rfidId: rfidId,
                    deviceId: deviceId || 'ESP32_RFID_001',
                    timestamp: currentWIB.toDate(), 
                    scanType: 'check',
                    memberId: member.id,
                    memberName: member.nama,
                    memberNim: member.nim,
                    attendanceId: null,
                    processed: true,
                    timezone: 'WIB',
                    hasPiketToday: hasPiketToday,
                    currentDay: todayName,
                    currentHour: currentWIB.hour(),
                    endpoint: 'check-member'
                });
                console.log(`Logged member check scan: ${rfidId} - ${member.nama}`);
            } catch (scanLogError) {
                console.error('Error logging member check scan:', scanLogError);
            }

            return ResponseHelper.success(res, {
                member: {
                    id: member.id,
                    nama: member.nama,
                    nim: member.nim,
                    idRfid: member.idRfid,
                    hariPiket: member.hariPiket || []
                },
                hasPiketToday,
                todayName,
                currentWIBTime: currentWIB.format('YYYY-MM-DD HH:mm:ss'),
                currentDay: currentDay,
                currentHour: currentWIB.hour(),
                deviceId,
                debug: {
                    availableDays: member.hariPiket || [],
                    checkingDay: todayName,
                    timezone: 'Asia/Jakarta',
                    wibTime: currentWIB.format('dddd, YYYY-MM-DD HH:mm:ss')
                }
            }, `Member ${hasPiketToday ? 'has' : 'does not have'} piket today (${todayName})`, 200);

        } catch (error) {
            console.error('Error in checkMember:', error);
            return ResponseHelper.error(res, 'Internal server error', 500);
        }
    }

    
    static async handleRfidScan(req, res) {
        try {
            const { rfidId, deviceId, timestamp } = req.body;
            
            console.log(`Incoming scan data:`, { rfidId, deviceId, originalTimestamp: timestamp, requestBody: req.body });
            
            
            
            const wibTimestamp = timestamp ? 
                moment(timestamp) : 
                moment().tz('Asia/Jakarta');
            
            
            const finalWibTime = wibTimestamp.tz('Asia/Jakarta');
            
            const today = finalWibTime.format('YYYY-MM-DD');
            const currentTimeWIB = finalWibTime.format('HH:mm:ss');
            const currentHour = finalWibTime.hour();

            console.log(` Processing scan at ${finalWibTime.format('YYYY-MM-DD HH:mm:ss')} WIB`);
            console.log(`Today: ${today}, Time: ${currentTimeWIB}, Hour: ${currentHour}`);
            console.log(`Timezone conversion:`, { original: timestamp, parsedAsWIB: finalWibTime.format('YYYY-MM-DD HH:mm:ss'),
                timezone: 'Asia/Jakarta',
                utcEquivalent: finalWibTime.utc().format('YYYY-MM-DD HH:mm:ss')
            });

            
            const members = await FirebaseService.getDocuments('members', [
                { field: 'idRfid', operator: '==', value: rfidId },
                { field: 'status', operator: '==', value: 'active' }
            ]);

            if (members.length === 0) {
                
                try {
                    const unknownScanData = {
                        cardId: rfidId,
                        rfidId: rfidId,
                        deviceId: deviceId || 'ESP32_RFID_001',
                        timestamp: wibTimestamp.toDate(), 
                        scanType: 'unknown',
                        memberId: null,
                        memberName: null,
                        memberNim: null,
                        attendanceId: null,
                        processed: false,
                        timezone: 'WIB',
                        reason: 'RFID not registered or member inactive'
                    };
                    
                    const unknownScanRecord = await FirebaseService.addDocument('rfid_scans', unknownScanData);
                    console.log(`Logged unknown scan: ${rfidId}`);
                    
                    
                    await FirebaseService.updateRealtimeData(`device_status/${deviceId}`, {
                        online: true,
                        lastSeen: wibISOString, 
                        lastScanRfid: rfidId,
                        timezone: 'WIB'
                    });
                    
                    
                    if (global.realtimeService) {
                        global.realtimeService.broadcastUpdate('unknown_scan', {
                            cardId: rfidId,
                            deviceId: deviceId || 'ESP32_RFID_001',
                            timestamp: wibISOString, 
                            reason: 'RFID not registered'
                        });
                    }
                    
                    
                    return ResponseHelper.success(res, {
                        scanRecord: unknownScanRecord,
                        scanType: 'unknown',
                        cardId: rfidId,
                        registered: false,
                        wibTime: wibTimestamp.format('YYYY-MM-DD HH:mm:ss'),
                        timezone: 'WIB'
                    }, `Unknown RFID detected: ${rfidId}. Please register this card first.`);
                    
                } catch (scanLogError) {
                    console.error('Error logging unknown scan:', scanLogError);
                    return ResponseHelper.error(res, 'Failed to process unknown RFID scan', 500);
                }
            }

            const member = members[0];

            
            const existingAttendance = await FirebaseService.getDocuments('attendance', [
                { field: 'memberId', operator: '==', value: member.id },
                { field: 'tanggal', operator: '==', value: today }
            ]);

            let attendanceRecord;
            let scanType;

            if (existingAttendance.length === 0) {
                
                scanType = 'check_in';
                
                
                const status = currentHour >= 18 ? 'Terlambat' : 'Hadir';
                
                const attendanceData = {
                    memberId: member.id,
                    nama: member.nama,
                    nim: member.nim,
                    idRfid: member.idRfid,
                    tanggal: today,
                    jamDatang: currentTimeWIB,
                    jamPulang: null,
                    durasi: null,
                    status: status,
                    deviceId,
                    scanTimestamp: finalWibTime.toISOString(), 
                    timezone: 'Asia/Jakarta',
                    createdAt: finalWibTime.toDate() 
                };

                console.log(`Attendance Data to save:`, { tanggal: today, jamDatang: currentTimeWIB, scanTimestamp: finalWibTime.toISOString(),
                    wibTime: finalWibTime.format('YYYY-MM-DD HH:mm:ss'),
                    timezone: 'Asia/Jakarta',
                    timestampReceived: timestamp
                });

                attendanceRecord = await FirebaseService.addDocument('attendance', attendanceData);
                console.log(`CHECK IN: ${member.nama} at ${currentTimeWIB} WIB - Status: ${status}`);

            } else {
                
                const existing = existingAttendance[0];
                
                if (existing.jamPulang) {
                    return ResponseHelper.error(res, 'Already checked out today', 400);
                }

                

                
                if (currentHour >= 18) {
                    console.log(`CHECKOUT DENIED: ${member.nama} - After 18:00 WIB (${currentTimeWIB})`);
                    return ResponseHelper.error(res, `Tidak boleh checkout setelah jam 18:00 WIB. Sekarang jam ${currentTimeWIB} WIB.`, 400);
                }

                
                const checkinTime = moment(existing.jamDatang, 'HH:mm:ss');
                const checkoutTime = moment(currentTimeWIB, 'HH:mm:ss');
                
                
                if (checkoutTime.isBefore(checkinTime)) {
                    checkoutTime.add(1, 'day');
                }
                
                const workDurationHours = checkoutTime.diff(checkinTime, 'hours', true);
                
                if (workDurationHours < 1) {
                    const remainingMinutes = Math.ceil((1 - workDurationHours) * 60);
                    console.log(`CHECKOUT DENIED: ${member.nama} - Only worked ${Math.floor(workDurationHours * 60)} minutes`);
                    return ResponseHelper.error(res, `Checkout ditolak. Anda baru bekerja ${Math.floor(workDurationHours * 60)} menit. Minimal 1 jam (${remainingMinutes} menit lagi).`, 400);
                }

                scanType = 'check_out';
                
                
                const durasi = RfidController.calculateDuration(existing.jamDatang, currentTimeWIB);
                
                const updateData = {
                    jamPulang: currentTimeWIB,
                    durasi,
                    deviceId,
                    scanTimestamp: finalWibTime.toISOString(), 
                    timezone: 'Asia/Jakarta',
                    updatedAt: finalWibTime.toDate() 
                };

                console.log(`Checkout Data to update:`, { jamPulang: currentTimeWIB, durasi: durasi, scanTimestamp: finalWibTime.toISOString(),
                    wibTime: finalWibTime.format('YYYY-MM-DD HH:mm:ss'),
                    timezone: 'Asia/Jakarta',
                    timestampReceived: timestamp
                });

                attendanceRecord = await FirebaseService.updateDocument('attendance', existing.id, updateData);
                console.log(`CHECK OUT: ${member.nama} at ${currentTimeWIB} WIB - Duration: ${durasi}`);
            }

            

            
            try {
                await FirebaseService.addDocument('rfid_scans', {
                    cardId: rfidId,
                    rfidId: rfidId,
                    deviceId: deviceId || 'ESP32_RFID_001',
                    timestamp: wibTimestamp.toDate(), 
                    scanType,
                    memberId: member.id,
                    memberName: member.nama,
                    memberNim: member.nim,
                    attendanceId: attendanceRecord.id,
                    processed: true,
                    timezone: 'WIB',
                    createdAt: wibTimestamp.toDate() 
                });
                console.log(`Logged scan to rfid_scans collection: ${rfidId}`);
            } catch (scanLogError) {
                console.error('Error logging scan to rfid_scans:', scanLogError);
                
            }

            
            await FirebaseService.updateRealtimeData(`device_status/${deviceId}`, {
                online: true,
                lastSeen: wibISOString, 
                lastScanRfid: rfidId,
                timezone: 'WIB'
            });

            
            await RfidController.updateLiveAttendanceCounter(today, scanType);

            const message = scanType === 'check_in' ? 
                `Check-in berhasil pada ${currentTimeWIB} WIB` : 
                `Check-out berhasil pada ${currentTimeWIB} WIB`;
            
            return ResponseHelper.success(res, {
                attendanceRecord,
                scanType,
                member: {
                    id: member.id,
                    nama: member.nama,
                    nim: member.nim
                },
                wibTime: wibTimestamp.format('YYYY-MM-DD HH:mm:ss'),
                timezone: 'WIB'
            }, message);
            
        } catch (error) {
            console.error('Error in handleRfidScan:', error);
            return ResponseHelper.error(res, 'Failed to process RFID scan');
        }
    }

    
    static async getDeviceStatus(req, res) {
        try {
            const { deviceId } = req.params;
            
            const deviceStatus = await FirebaseService.getRealtimeData(`device_status/${deviceId}`);
            
            if (!deviceStatus) {
                return ResponseHelper.notFound(res, 'Device not found');
            }

            return ResponseHelper.success(res, deviceStatus, 'Device status retrieved successfully');
            
        } catch (error) {
            console.error('Error in getDeviceStatus:', error);
            return ResponseHelper.error(res, 'Failed to retrieve device status');
        }
    }



    
    static async getAllDevices(req, res) {
        try {
            const devicesSnapshot = await db.collection('devices').get();
            const devices = [];
            
            devicesSnapshot.forEach(doc => {
                devices.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return ResponseHelper.success(res, devices, 'Devices retrieved successfully', 200);
            
        } catch (error) {
            console.error('Error in getAllDevices:', error);
            return ResponseHelper.error(res, 'Internal server error', 500);
        }
    }

    
    static async getDeviceById(req, res) {
        try {
            const { deviceId } = req.params;
            
            const deviceDoc = await db.collection('devices').doc(deviceId).get();
            
            if (!deviceDoc.exists) {
                return ResponseHelper.error(res, 'Device not found', 404);
            }

            const device = {
                id: deviceDoc.id,
                ...deviceDoc.data()
            };

            return ResponseHelper.success(res, device, 'Device retrieved successfully', 200);
            
        } catch (error) {
            console.error('Error in getDeviceById:', error);
            return ResponseHelper.error(res, 'Internal server error', 500);
        }
    }

    
    static async updateDevice(req, res) {
        try {
            const { deviceId } = req.params;
            const updateData = req.body;
            
            
            delete updateData.id;
            delete updateData.lastActivity;
            delete updateData.createdAt;
            
            updateData.updatedAt = new Date();

            await db.collection('devices').doc(deviceId).update(updateData);

            return ResponseHelper.success(res, 200, 'Device updated successfully');
            
        } catch (error) {
            console.error('Error in updateDevice:', error);
            return ResponseHelper.error(res, 'Internal server error', 500);
        }
    }











    
    static async deviceHeartbeat(req, res) {
        try {
            const { deviceId } = req.params;
            const heartbeatData = req.body;
            const wibNow = moment().tz('Asia/Jakarta');
            const now = wibNow.toDate();

            
            const deviceDoc = await db.collection('devices').doc(deviceId).get();
            
            if (!deviceDoc.exists) {
                
                const deviceData = {
                    id: deviceId,
                    name: heartbeatData.name || 'RFID Scanner',
                    location: heartbeatData.location || 'Unknown',
                    ipAddress: heartbeatData.ipAddress || req.ip,
                    version: heartbeatData.version || '1.0.0',
                    status: 'active',
                    isRegistrationMode: false,
                    lastActivity: now,
                    createdAt: now,
                    updatedAt: now,
                    heartbeatCount: 1,
                    timezone: 'WIB'
                };
                
                await db.collection('devices').doc(deviceId).set(deviceData);
                console.log(`New device registered: ${deviceId}`);
            } else {
                
                const currentData = deviceDoc.data();
                const updateData = {
                    status: heartbeatData.status || 'active',
                    lastActivity: now,
                    updatedAt: now,
                    heartbeatCount: (currentData.heartbeatCount || 0) + 1,
                    timezone: 'WIB'
                };

                
                if (heartbeatData.ipAddress) updateData.ipAddress = heartbeatData.ipAddress;
                if (heartbeatData.version) updateData.version = heartbeatData.version;
                if (heartbeatData.uptime !== undefined) updateData.uptime = heartbeatData.uptime;
                if (heartbeatData.freeHeap !== undefined) updateData.freeHeap = heartbeatData.freeHeap;
                if (heartbeatData.consecutiveErrors !== undefined) updateData.consecutiveErrors = heartbeatData.consecutiveErrors;
                if (heartbeatData.wifiRSSI !== undefined) updateData.wifiRSSI = heartbeatData.wifiRSSI;

                await db.collection('devices').doc(deviceId).update(updateData);
            }

            
            const heartbeatLog = {
                deviceId,
                timestamp: now,
                status: heartbeatData.status || 'active',
                uptime: heartbeatData.uptime || 0,
                freeHeap: heartbeatData.freeHeap || 0,
                wibTime: wibNow.format('YYYY-MM-DD HH:mm:ss'),
                timezone: 'WIB',
                consecutiveErrors: heartbeatData.consecutiveErrors || 0,
                wifiRSSI: heartbeatData.wifiRSSI || 0,
                ipAddress: heartbeatData.ipAddress || req.ip
            };

            
            const heartbeatRef = db.collection('device_heartbeats').doc();
            await heartbeatRef.set(heartbeatLog);

            return ResponseHelper.success(res, {
                deviceId,
                status: 'active',
                timestamp: now
            }, 'Heartbeat recorded successfully', 200);

        } catch (error) {
            console.error('Error in deviceHeartbeat:', error);
            return ResponseHelper.error(res, 'Internal server error', 500);
        }
    }

    
    static async deviceHeartbeat_old(req, res) {
        try {
            const { deviceId } = req.params;
            const { battery, signal, version } = req.body;

            const heartbeatData = {
                online: true,
                lastSeen: new Date().toISOString(),
                battery: battery || null,
                signal: signal || null,
                version: version || null
            };

            await FirebaseService.updateRealtimeData(`device_status/${deviceId}`, heartbeatData);
            
            return ResponseHelper.success(res, heartbeatData, 'Heartbeat recorded successfully');
            
        } catch (error) {
            console.error('Error in deviceHeartbeat:', error);
            return ResponseHelper.error(res, 'Failed to record heartbeat');
        }
    }





    
    static determineAttendanceStatus(jamDatang) {
        const checkInTime = moment(jamDatang, 'HH:mm:ss');
        const cutoffTime = moment('09:00:00', 'HH:mm:ss'); 
        
        if (checkInTime.isAfter(cutoffTime)) {
            return 'Terlambat';
        }
        return 'Hadir';
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

    
    static async updateLiveAttendanceCounter(date, scanType) {
        try {
            const counterPath = `live_attendance/daily/${date}`;
            const currentData = await FirebaseService.getRealtimeData(counterPath) || {
                total_checkin: 0,
                total_checkout: 0
            };

            if (scanType === 'check_in') {
                currentData.total_checkin++;
            } else if (scanType === 'check_out') {
                currentData.total_checkout++;
            }

            currentData.last_activity = new Date().toISOString();

            await FirebaseService.setRealtimeData(counterPath, currentData);
        } catch (error) {
            console.error('Error updating live attendance counter:', error);
        }
    }

    
    static async toggleRealtimeMode(req, res) {
        try {
            const { deviceId } = req.params;
            const { isActive } = req.body;

            console.log(`Setting realtime mode for device ${deviceId}: ${isActive}`);

            
            const deviceRef = db.collection('devices').doc(deviceId);
            const deviceDoc = await deviceRef.get();

            if (!deviceDoc.exists) {
                return ResponseHelper.error(res, 'Device not found', 404);
            }

            await deviceRef.update({
                realtimeMode: isActive,
                lastUpdated: moment().toISOString(),
                updatedBy: req.user.uid || 'system'
            });

            
            if (global.realtimeService) {
                global.realtimeService.broadcastUpdate('device_realtime_mode', {
                    deviceId,
                    isActive,
                    timestamp: moment().toISOString()
                });
            }

            console.log(`Realtime mode ${isActive ? 'activated' : 'deactivated'} for device ${deviceId}`);

            return ResponseHelper.success(res, {
                deviceId,
                realtimeMode: isActive,
                message: `Realtime mode ${isActive ? 'activated' : 'deactivated'}`
            }, `Realtime mode ${isActive ? 'activated' : 'deactivated'} successfully`);

        } catch (error) {
            console.error('Error toggling realtime mode:', error);
            return ResponseHelper.error(res, 'Failed to toggle realtime mode', 500);
        }
    }

    
    static async getLatestScans(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            
            console.log(`Getting latest ${limit} RFID scans`);

            
            const twoMinutesAgo = moment().subtract(2, 'minutes').toDate();
            
            const scansSnapshot = await db.collection('rfid_scans')
                .where('timestamp', '>=', twoMinutesAgo)
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();

            const scans = [];
            scansSnapshot.forEach(doc => {
                const data = doc.data();
                scans.push({
                    id: doc.id,
                    cardId: data.cardId || data.rfidId,
                    deviceId: data.deviceId,
                    timestamp: data.timestamp,
                    scanType: data.scanType || 'unknown',
                    processed: data.processed || false,
                    memberId: data.memberId || null,
                    memberName: data.memberName || null,
                    memberNim: data.memberNim || null,
                    reason: data.reason || null,
                    ...data
                });
            });

            console.log(`Found ${scans.length} recent scans (including unknown)`);

            return ResponseHelper.success(res, scans, 'Latest scans retrieved successfully');

        } catch (error) {
            console.error('Error getting latest scans:', error);
            return ResponseHelper.error(res, 'Failed to get latest scans', 500);
        }
    }

    
    static async getUnknownScans(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 20;
            
            console.log(`Getting latest ${limit} unknown RFID scans`);

            
            const yesterday = moment().subtract(24, 'hours').toDate();
            
            const scansSnapshot = await db.collection('rfid_scans')
                .where('scanType', '==', 'unknown')
                .where('timestamp', '>=', yesterday)
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();

            const unknownScans = [];
            scansSnapshot.forEach(doc => {
                const data = doc.data();
                unknownScans.push({
                    id: doc.id,
                    cardId: data.cardId || data.rfidId,
                    deviceId: data.deviceId,
                    timestamp: data.timestamp,
                    reason: data.reason || 'Unknown RFID',
                    timezone: data.timezone || 'WIB'
                });
            });

            console.log(`Found ${unknownScans.length} unknown scans`);

            return ResponseHelper.success(res, unknownScans, 'Unknown scans retrieved successfully');

        } catch (error) {
            console.error('Error getting unknown scans:', error);
            return ResponseHelper.error(res, 'Failed to get unknown scans', 500);
        }
    }

     
    static async getLatestUnprocessedScan(req, res) {
        try {
            console.log('\n Getting latest unprocessed scan...');
            
            
            const twoMinutesAgo = moment().subtract(2, 'minutes').toDate();
            
            const scansSnapshot = await db.collection('rfid_scans')
                .where('processed', '==', false)
                .where('timestamp', '>=', twoMinutesAgo)
                .orderBy('timestamp', 'desc')
                .limit(1)
                .get();

            if (scansSnapshot.empty) {
                console.log('ℹ No recent unprocessed scans found');
                return ResponseHelper.error(res, 'No recent scans found', 404);
            }

            const latestScan = scansSnapshot.docs[0];
            const scanData = latestScan.data();
            
            console.log('Latest scan found:', scanData.cardId);
            console.log('Scan ID:', latestScan.id);
            console.log('⏰ Timestamp:', scanData.timestamp);

            return ResponseHelper.success(res, {
                id: latestScan.id,
                cardId: scanData.cardId,
                rfidId: scanData.rfidId || scanData.cardId,
                registrationId: scanData.registrationId,
                deviceId: scanData.deviceId,
                timestamp: scanData.timestamp,
                scanType: scanData.scanType,
                processed: scanData.processed,
                wibTime: moment(scanData.timestamp).tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss')
            }, 'Latest scan retrieved', 200);

        } catch (error) {
            console.error('Error getting latest scan:', error);
            return ResponseHelper.error(res, 'Error retrieving scan', 500);
        }
    }

}

module.exports = RfidController;
