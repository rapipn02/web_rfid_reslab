const FirebaseService = require('../services/firebaseService');
const ResponseHelper = require('../utils/responseHelper');
const moment = require('moment');

/**
 * RFID Controller - Handle ESP32 RFID Scanner
 */
class RfidController {
    
    // POST /api/rfid/scan - Handle RFID scan from ESP32
    static async handleRfidScan(req, res) {
        try {
            const { rfidId, deviceId, timestamp } = req.body;
            const scanTime = timestamp || new Date().toISOString();

            // Find member by RFID
            const members = await FirebaseService.getDocuments('members', [
                { field: 'idRfid', operator: '==', value: rfidId },
                { field: 'status', operator: '==', value: 'active' }
            ]);

            if (members.length === 0) {
                // Log unknown RFID scan
                await FirebaseService.setRealtimeData('rfid_scans/unknown_scans/' + Date.now(), {
                    rfidId,
                    deviceId,
                    timestamp: scanTime,
                    status: 'unknown'
                });

                return ResponseHelper.error(res, 'RFID not registered or member inactive', 404);
            }

            const member = members[0];
            const today = moment(scanTime).format('YYYY-MM-DD');
            const currentTime = moment(scanTime).format('HH:mm:ss');

            // Check existing attendance for today
            const existingAttendance = await FirebaseService.getDocuments('attendance', [
                { field: 'memberId', operator: '==', value: member.id },
                { field: 'tanggal', operator: '==', value: today }
            ]);

            let attendanceRecord;
            let scanType;

            if (existingAttendance.length === 0) {
                // First scan - Check In
                scanType = 'check_in';
                
                const attendanceData = {
                    memberId: member.id,
                    nama: member.nama,
                    nim: member.nim,
                    idRfid: member.idRfid,
                    tanggal: today,
                    jamDatang: currentTime,
                    jamPulang: null,
                    durasi: null,
                    status: this.determineAttendanceStatus(currentTime),
                    deviceId,
                    scanTimestamp: scanTime
                };

                attendanceRecord = await FirebaseService.addDocument('attendance', attendanceData);

            } else {
                // Second scan - Check Out
                const existing = existingAttendance[0];
                
                if (existing.jamPulang) {
                    return ResponseHelper.error(res, 'Already checked out today', 400);
                }

                scanType = 'check_out';
                
                // Calculate duration
                const durasi = this.calculateDuration(existing.jamDatang, currentTime);
                
                const updateData = {
                    jamPulang: currentTime,
                    durasi,
                    deviceId,
                    scanTimestamp: scanTime
                };

                attendanceRecord = await FirebaseService.updateDocument('attendance', existing.id, updateData);
            }

            // Update realtime database for live notifications
            await FirebaseService.setRealtimeData('rfid_scans/latest_scan', {
                rfidId,
                memberId: member.id,
                nama: member.nama,
                nim: member.nim,
                type: scanType,
                timestamp: scanTime,
                deviceId,
                processed: true
            });

            // Update device status
            await FirebaseService.updateRealtimeData(`device_status/${deviceId}`, {
                online: true,
                lastSeen: scanTime,
                lastScanRfid: rfidId
            });

            // Update live attendance counter
            await this.updateLiveAttendanceCounter(today, scanType);

            const message = scanType === 'check_in' ? 'Check-in successful' : 'Check-out successful';
            
            return ResponseHelper.success(res, {
                attendanceRecord,
                scanType,
                member: {
                    id: member.id,
                    nama: member.nama,
                    nim: member.nim
                }
            }, message);
            
        } catch (error) {
            console.error('Error in handleRfidScan:', error);
            return ResponseHelper.error(res, 'Failed to process RFID scan');
        }
    }

    // GET /api/rfid/device/:deviceId/status - Get device status
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

    // POST /api/rfid/device/:deviceId/heartbeat - Device heartbeat
    static async deviceHeartbeat(req, res) {
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

    // GET /api/rfid/scans/latest - Get latest RFID scans
    static async getLatestScans(req, res) {
        try {
            const { limit = 10 } = req.query;
            
            // Get latest scans from realtime database
            const latestScan = await FirebaseService.getRealtimeData('rfid_scans/latest_scan');
            
            // Get recent attendance records as scan history
            const today = moment().format('YYYY-MM-DD');
            const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
            
            const recentAttendance = await FirebaseService.getDocuments('attendance', [
                { field: 'tanggal', operator: '>=', value: yesterday }
            ]);

            // Sort by creation time and limit
            recentAttendance.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            const limitedScans = recentAttendance.slice(0, parseInt(limit));

            return ResponseHelper.success(res, {
                latestScan,
                recentScans: limitedScans,
                count: limitedScans.length
            }, 'Latest scans retrieved successfully');
            
        } catch (error) {
            console.error('Error in getLatestScans:', error);
            return ResponseHelper.error(res, 'Failed to retrieve latest scans');
        }
    }

    // GET /api/rfid/scans/unknown - Get unknown RFID scans
    static async getUnknownScans(req, res) {
        try {
            const unknownScans = await FirebaseService.getRealtimeData('rfid_scans/unknown_scans');
            
            const scansArray = unknownScans ? Object.values(unknownScans) : [];
            
            // Sort by timestamp (newest first)
            scansArray.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            return ResponseHelper.success(res, {
                unknownScans: scansArray,
                count: scansArray.length
            }, 'Unknown scans retrieved successfully');
            
        } catch (error) {
            console.error('Error in getUnknownScans:', error);
            return ResponseHelper.error(res, 'Failed to retrieve unknown scans');
        }
    }

    // Helper method to determine attendance status based on time
    static determineAttendanceStatus(jamDatang) {
        const checkInTime = moment(jamDatang, 'HH:mm:ss');
        const cutoffTime = moment('09:00:00', 'HH:mm:ss'); // 9 AM cutoff
        
        if (checkInTime.isAfter(cutoffTime)) {
            return 'Terlambat';
        }
        return 'Hadir';
    }

    // Helper method to calculate duration
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

    // Helper method to update live attendance counter
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
}

module.exports = RfidController;
