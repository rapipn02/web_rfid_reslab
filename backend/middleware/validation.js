const ResponseHelper = require('../utils/responseHelper');


class ValidationMiddleware {
    
    
    static validateMember(req, res, next) {
        const { nama, nim, idRfid, hariPiket } = req.body;
        const errors = {};

        
        if (!nama || typeof nama !== 'string' || nama.trim().length < 2) {
            errors.nama = 'Nama minimal 2 karakter';
        }

        
        if (!nim || typeof nim !== 'string') {
            errors.nim = 'NIM wajib diisi';
        } else if (!/^\d+$/.test(nim.trim())) {
            errors.nim = 'NIM hanya boleh berisi angka';
        } else if (nim.trim().length < 6) {
            errors.nim = 'NIM minimal 6 digit';
        }

        
        if (!idRfid || typeof idRfid !== 'string' || idRfid.trim().length < 4) {
            errors.idRfid = 'ID RFID minimal 4 karakter';
        }

        
        if (!hariPiket || !Array.isArray(hariPiket) || hariPiket.length === 0) {
            errors.hariPiket = 'Minimal pilih satu hari piket';
        } else {
            const validHari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
            const invalidHari = hariPiket.filter(hari => !validHari.includes(hari));
            if (invalidHari.length > 0) {
                errors.hariPiket = `Hari tidak valid: ${invalidHari.join(', ')}`;
            }
        }

        if (Object.keys(errors).length > 0) {
            return ResponseHelper.validationError(res, errors);
        }

        
        req.body.nama = nama.trim();
        req.body.nim = nim.trim();
        req.body.idRfid = idRfid.trim().toUpperCase();
        
        next();
    }

    
    static validateRfidScan(req, res, next) {
        const { rfidId, deviceId } = req.body;
        const errors = {};

        if (!rfidId || typeof rfidId !== 'string' || rfidId.trim().length < 4) {
            errors.rfidId = 'RFID ID minimal 4 karakter';
        }

        if (!deviceId || typeof deviceId !== 'string') {
            errors.deviceId = 'Device ID wajib diisi';
        }

        if (Object.keys(errors).length > 0) {
            return ResponseHelper.validationError(res, errors);
        }

        
        req.body.rfidId = rfidId.trim().toUpperCase();
        req.body.deviceId = deviceId.trim();
        
        next();
    }

    
    static validateRfidRegistration(req, res, next) {
        const { cardId, deviceId, registrationId } = req.body;
        const errors = {};

        if (!cardId || typeof cardId !== 'string' || cardId.trim().length < 4) {
            errors.cardId = 'Card ID minimal 4 karakter';
        }

        if (!deviceId || typeof deviceId !== 'string') {
            errors.deviceId = 'Device ID wajib diisi';
        }

        if (!registrationId || typeof registrationId !== 'string') {
            errors.registrationId = 'Registration ID wajib diisi';
        }

        if (Object.keys(errors).length > 0) {
            return ResponseHelper.validationError(res, errors);
        }

        
        req.body.cardId = cardId.trim().toUpperCase();
        req.body.deviceId = deviceId.trim();
        req.body.registrationId = registrationId.trim();
        
        next();
    }

    
    static validateAttendanceQuery(req, res, next) {
        const { startDate, endDate, memberId } = req.query;
        const errors = {};

        
        if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
            errors.startDate = 'Format tanggal harus YYYY-MM-DD';
        }

        if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
            errors.endDate = 'Format tanggal harus YYYY-MM-DD';
        }

        
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            errors.dateRange = 'Tanggal mulai tidak boleh lebih besar dari tanggal akhir';
        }

        if (Object.keys(errors).length > 0) {
            return ResponseHelper.validationError(res, errors);
        }

        next();
    }

    
    static validateAttendance(req, res, next) {
        const { memberId, tanggal, jamDatang, jamPulang, status } = req.body;
        const errors = {};

        
        if (!memberId || typeof memberId !== 'string') {
            errors.memberId = 'Member ID wajib diisi';
        }

        
        if (!tanggal || !/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
            errors.tanggal = 'Format tanggal harus YYYY-MM-DD';
        }

        
        if (!jamDatang || !/^\d{2}:\d{2}:\d{2}$/.test(jamDatang)) {
            errors.jamDatang = 'Format jam datang harus HH:MM:SS';
        }

        
        if (jamPulang && !/^\d{2}:\d{2}:\d{2}$/.test(jamPulang)) {
            errors.jamPulang = 'Format jam pulang harus HH:MM:SS';
        }

        
        if (status && !['hadir', 'terlambat', 'izin', 'sakit', 'alpha'].includes(status)) {
            errors.status = 'Status harus salah satu dari: hadir, terlambat, izin, sakit, alpha';
        }

        if (Object.keys(errors).length > 0) {
            return ResponseHelper.validationError(res, errors);
        }

        next();
    }

    
    static validateCheckout(req, res, next) {
        const { member_id } = req.body;
        const errors = {};

        
        if (!member_id || typeof member_id !== 'string' || member_id.trim().length === 0) {
            errors.member_id = 'Member ID wajib diisi';
        }

        if (Object.keys(errors).length > 0) {
            return ResponseHelper.validationError(res, errors);
        }

        
        req.body.member_id = member_id.trim();

        next();
    }
}

module.exports = ValidationMiddleware;
