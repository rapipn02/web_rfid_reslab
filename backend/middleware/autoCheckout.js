const cron = require('node-cron');
const moment = require('moment');
const { adminDb: db } = require('../config/firebase');


class AutoCheckoutService {
  constructor() {
    this.isRunning = false;
  }

  
  init() {
    
    cron.schedule('1 18 * * *', async () => {
      console.log('Running auto checkout at 18:01...');
      await this.runAutoCheckout();
    }, {
      scheduled: true,
      timezone: "Asia/Jakarta"
    });

    
    
    
    
    

    console.log('⏰ Auto checkout service initialized - will run daily at 18:01');
  }

  
  async runAutoCheckout() {
    try {
      if (this.isRunning) {
        console.log('Auto checkout already running, skipping...');
        return;
      }

      this.isRunning = true;
      const today = moment().format('YYYY-MM-DD');
      console.log(`Starting auto checkout for date: ${today}`);

      
      const attendanceRef = db.collection('attendance');
      const snapshot = await attendanceRef
        .where('tanggal', '==', today)
        .where('jam_keluar', '==', null)
        .get();

      if (snapshot.empty) {
        console.log('No members need auto checkout');
        this.isRunning = false;
        return;
      }

      let processedCount = 0;
      const batch = db.batch();

      snapshot.forEach(doc => {
        const attendanceData = doc.data();
        
        
        batch.update(doc.ref, {
          status: 'Tidak Hadir',
          jam_keluar: '18:00:00',
          auto_checkout: true,
          auto_checkout_reason: 'Tidak checkout sebelum jam 18:00',
          updated_at: moment().format('YYYY-MM-DD HH:mm:ss')
        });

        processedCount++;
        console.log(`Auto checkout for member ID: ${attendanceData.member_id}`);
      });

      
      await batch.commit();
      
      console.log(`Auto checkout completed for ${processedCount} members`);
      
      
      await this.logAutoCheckout(processedCount, today);

    } catch (error) {
      console.error('Error during auto checkout:', error);
    } finally {
      this.isRunning = false;
    }
  }

  
  async logAutoCheckout(count, date) {
    try {
      const logRef = db.collection('auto_checkout_logs');
      await logRef.add({
        date: date,
        members_affected: count,
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
        status: 'completed'
      });
    } catch (error) {
      console.error('Error logging auto checkout:', error);
    }
  }

  
  async triggerManualCheckout() {
    console.log('Manual auto checkout triggered');
    await this.runAutoCheckout();
  }
}


const validateWorkingHours = (req, res, next) => {
  const currentTime = moment();
  const currentHour = currentTime.hour();
  const currentMinute = currentTime.minute();

  
  const startHour = 8;
  const endHour = 18;

  
  if (req.path.includes('/checkin') || req.path.includes('/check-in')) {
    if (currentHour < startHour) {
      return res.status(400).json({
        success: false,
        message: `Check-in hanya dapat dilakukan mulai jam ${startHour}:00`
      });
    }
  }

  
  if (req.path.includes('/checkout') || req.path.includes('/check-out')) {
    if (currentHour >= endHour) {
      return res.status(400).json({
        success: false,
        message: `Check-out harus dilakukan sebelum jam ${endHour}:00. Setelah jam tersebut akan dianggap tidak hadir.`
      });
    }
  }

  next();
};


const checkDuplicateAttendance = async (req, res, next) => {
  try {
    const { member_id } = req.body;
    const today = moment().format('YYYY-MM-DD');

    
    if (req.path.includes('/checkin') || req.path.includes('/check-in')) {
      const attendanceRef = db.collection('attendance');
      const snapshot = await attendanceRef
        .where('member_id', '==', member_id)
        .where('tanggal', '==', today)
        .get();

      if (!snapshot.empty) {
        return res.status(400).json({
          success: false,
          message: 'Anda sudah melakukan check-in hari ini'
        });
      }
    }

    
    if (req.path.includes('/checkout') || req.path.includes('/check-out')) {
      const attendanceRef = db.collection('attendance');
      const snapshot = await attendanceRef
        .where('member_id', '==', member_id)
        .where('tanggal', '==', today)
        .where('jam_keluar', '!=', null)
        .get();

      if (!snapshot.empty) {
        return res.status(400).json({
          success: false,
          message: 'Anda sudah melakukan check-out hari ini'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Error checking duplicate attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating attendance'
    });
  }
};

module.exports = {
  AutoCheckoutService,
  validateWorkingHours,
  checkDuplicateAttendance
};
