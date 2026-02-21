const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const moment = require('moment-timezone');
const { AutoCheckoutService } = require('./middleware/autoCheckout');
const AutoAttendanceService = require('./services/autoAttendanceService');
require('dotenv').config();


function checkTimezoneConfiguration() {
  console.log('\n ================================');
  console.log('TIMEZONE CONFIGURATION CHECK');
  console.log('================================');
  
  
  moment.tz.setDefault('Asia/Jakarta');
  
  
  const utcTime = moment.utc();
  const wibTime = moment().tz('Asia/Jakarta');
  const serverLocal = moment();
  
  console.log(`UTC Time : ${utcTime.format('YYYY-MM-DD HH:mm:ss')} UTC`);
  console.log(`WIB Time : ${wibTime.format('YYYY-MM-DD HH:mm:ss')} WIB`);
  console.log(`Server Local : ${serverLocal.format('YYYY-MM-DD HH:mm:ss')} ${moment.tz.guess()}`);
  
  
  const wibOffset = wibTime.utcOffset() / 60;
  console.log(`WIB UTC Offset: +${wibOffset} hours`);
  
  
  if (wibOffset === 7) {
    console.log(`WIB Timezone : CONFIGURED CORRECTLY (+7 hours from UTC)`);
  } else {
    console.log(`WIB Timezone : INCORRECT! Expected +7, got +${wibOffset}`);
  }
  
  
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const currentDay = wibTime.day();
  const todayName = dayNames[currentDay];
  
  console.log(`Today (WIB)   : ${todayName} (${wibTime.format('dddd')})`);
  console.log(`Day Index : ${currentDay} (0=Minggu, 6=Sabtu)`);
  
  
  const defaultTz = moment().tz();
  console.log(`Default TZ : ${defaultTz || 'Not set - using Asia/Jakarta'}`);
  
  
  console.log(`\nSample Times for Attendance:`);
  console.log(`Check-in : ${wibTime.format('HH:mm:ss')} WIB`);
  console.log(`Date : ${wibTime.format('YYYY-MM-DD')}`);
  console.log(`ISO String: ${wibTime.toISOString()}`);
  
  console.log('================================\n');
  
  return {
    isWIBCorrect: wibOffset === 7,
    wibTime: wibTime.format('YYYY-MM-DD HH:mm:ss'),
    utcTime: utcTime.format('YYYY-MM-DD HH:mm:ss'),
    offset: wibOffset,
    todayName,
    dayIndex: currentDay
  };
}

const app = express();
const PORT = process.env.PORT || 5000;


const autoCheckoutService = new AutoCheckoutService();


const autoAttendanceService = new AutoAttendanceService();


app.set('trust proxy', 1);


app.set('x-powered-by', false); 
app.set('etag', false); 


app.use(helmet());


app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:5173', 
    'http://localhost:3000'  
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000, 
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, 
  legacyHeaders: false, 
});
app.use('/api/', limiter);


app.use(morgan('dev')); 


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


app.use('/api/auth', require('./routes/auth'));
app.use('/api/public', require('./routes/publicAuth'));
app.use('/api/setup', require('./routes/setup'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/members', require('./routes/members'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/rfid', require('./routes/rfid'));
app.use('/api/device', require('./routes/device'));


app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Absensi Reslab Backend',
    version: '1.0.0'
  });
});


app.get('/', (req, res) => {
  res.json({
    message: '🔥 Absensi Reslab API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      members: '/api/members',
      attendance: '/api/attendance',
      rfid: '/api/rfid',
      device: '/api/device'
    }
  });
});


app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({ 
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});


app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});


app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`API Base URL: http://localhost:${PORT}/api`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
  console.log(`Server accessible on: http://10.44.9.61:${PORT}/api`);
  
  
  const timezoneCheck = checkTimezoneConfiguration();
  
  if (timezoneCheck.isWIBCorrect) {
    console.log('TIMEZONE: Backend configured correctly for WIB timezone!');
  } else {
    console.log('TIMEZONE: Backend timezone configuration needs attention!');
  }
  
  
  console.log('Auto checkout service started');
});


app.get('/api/admin/trigger-auto-checkout', async (req, res) => {
  try {
    await autoCheckoutService.triggerManualCheckout();
    res.json({
      success: true,
      message: 'Auto checkout triggered successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error triggering auto checkout',
      error: error.message
    });
  }
});


app.get('/api/admin/timezone-check', (req, res) => {
  try {
    const timezoneInfo = checkTimezoneConfiguration();
    
    res.json({
      success: true,
      message: 'Timezone information retrieved',
      data: {
        ...timezoneInfo,
        serverStartTime: new Date().toISOString(),
        momentVersion: require('moment/package.json').version,
        momentTimezoneVersion: require('moment-timezone/package.json').version,
        availableTimezones: {
          jakarta: moment.tz.zone('Asia/Jakarta') ? 'Available' : 'Not Available',
          utc: moment.tz.zone('UTC') ? 'Available' : 'Not Available'
        },
        sampleConversions: {
          utcToWib: moment.utc().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss'),
          currentUTC: moment.utc().format('YYYY-MM-DD HH:mm:ss'),
          currentWIB: moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss')
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking timezone configuration',
      error: error.message
    });
  }
});

module.exports = app;
