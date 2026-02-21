

const moment = require('moment');

class AttendanceMiddleware {
  
  static async autoCheckoutAfter6PM() {
    try {
      const admin = require('firebase-admin');
      const db = admin.firestore();
      
      
      const today = moment().format('YYYY-MM-DD');
      const cutoffTime = moment().format('YYYY-MM-DD') + ' 18:00:00';
      
      
      const attendanceRef = db.collection('attendance');
      const snapshot = await attendanceRef
        .where('tanggal', '==', today)
        .where('jam_keluar', '==', null)
        .get();

      const batch = db.batch();
      const updates = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        const jamMasuk = moment(data.jam_masuk, 'HH:mm:ss');
        const currentTime = moment();
        
        
        if (currentTime.isAfter(moment(cutoffTime))) {
          
          batch.update(doc.ref, {
            jam_keluar: '18:00:00',
            status: 'tidak_hadir',
            keterangan: 'Auto checkout - Tidak checkout sebelum jam 18:00',
            updated_at: moment().toISOString()
          });
          
          updates.push({
            id: doc.id,
            nama: data.nama,
            jam_masuk: data.jam_masuk
          });
        }
      });

      
      if (updates.length > 0) {
        await batch.commit();
        console.log(`Auto checkout untuk ${updates.length} karyawan yang belum checkout sebelum jam 18:00`);
        
        
        updates.forEach(update => {
          console.log(`- ${update.nama} (Masuk: ${update.jam_masuk})`);
        });
      }

      return {
        success: true,
        updated: updates.length,
        message: `Auto checkout berhasil untuk ${updates.length} karyawan`
      };

    } catch (error) {
      console.error('Error auto checkout:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  
  static validateWorkingHours(req, res, next) {
    try {
      const { action } = req.body; 
      const currentTime = moment();
      const currentHour = currentTime.hour();
      const currentMinutes = currentTime.minutes();

      
      const workStartHour = 7;
      const workEndHour = 18;

      if (action === 'masuk') {
        
        if (currentHour < 6 || currentHour >= 12) {
          return res.status(400).json({
            success: false,
            message: 'Jam masuk hanya diperbolehkan antara 06:00 - 12:00'
          });
        }
      } else if (action === 'keluar') {
        
        if (currentHour < 10) {
          return res.status(400).json({
            success: false,
            message: 'Jam keluar minimal jam 10:00 (minimal 4 jam kerja)'
          });
        }
        
        
        if (currentHour >= 18) {
          req.lateCheckout = true;
          req.warningMessage = 'Checkout setelah jam 18:00. Status kehadiran akan dievaluasi.';
        }
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error dalam validasi jam kerja'
      });
    }
  }

  
  static determineAttendanceStatus(req, res, next) {
    try {
      const { action, jam_masuk } = req.body;
      const currentTime = moment();

      if (action === 'keluar') {
        const jamMasukTime = moment(jam_masuk, 'HH:mm:ss');
        const jamKeluarTime = currentTime;
        
        
        const workDuration = jamKeluarTime.diff(jamMasukTime, 'hours', true);
        
        
        
        
        
        
        
        let status = 'hadir';
        let keterangan = '';

        if (workDuration < 4) {
          status = 'tidak_hadir';
          keterangan = 'Durasi kerja kurang dari 4 jam';
        } else if (workDuration < 6) {
          status = 'tidak_hadir';
          keterangan = 'Durasi kerja kurang dari 6 jam';
        } else if (workDuration < 8) {
          status = 'hadir';
          keterangan = 'Durasi kerja kurang dari 8 jam penuh';
        } else {
          status = 'hadir';
          keterangan = 'Durasi kerja normal';
        }

        
        if (req.lateCheckout) {
          if (workDuration >= 8) {
            status = 'hadir';
            keterangan = 'Checkout terlambat tapi durasi kerja cukup';
          } else {
            status = 'tidak_hadir';
            keterangan = 'Checkout terlambat dan durasi kerja kurang';
          }
        }

        
        req.attendanceStatus = {
          status,
          keterangan,
          durasi_kerja: Math.round(workDuration * 100) / 100, 
          warning: req.warningMessage || null
        };
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error dalam menentukan status kehadiran'
      });
    }
  }
}

module.exports = AttendanceMiddleware;
