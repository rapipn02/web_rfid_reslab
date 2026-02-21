const admin = require('firebase-admin');


const firebaseConfig = {
  apiKey: "AIzaSyB6-iFaq4yYvjytbzvei4_VPggyf97oZ8s",
  authDomain: "absensi-reslab-db.firebaseapp.com",
  projectId: "absensi-reslab-db",
  storageBucket: "absensi-reslab-db.firebasestorage.app",
  messagingSenderId: "15706123253",
  appId: "1:15706123253:web:0b7b210384d34cf85f8ebc"
};


if (!admin.apps.length) {
  try {
    admin.initializeApp({
      projectId: firebaseConfig.projectId
    });
    console.log('Firebase Admin initialized');
  } catch (error) {
    console.log('Firebase already initialized or error:', error.message);
  }
}

const db = admin.firestore();

async function initAttendanceCollection() {
  console.log('\n Initializing Attendance Collection in Firestore...\n');
  console.log('Project ID:', firebaseConfig.projectId);
  console.log('');

  try {
    
    console.log('Checking existing attendance data...');
    const attendanceRef = db.collection('attendance');
    const snapshot = await attendanceRef.limit(10).get();
    
    if (!snapshot.empty) {
      console.log('Attendance collection already exists!');
      console.log('Current document count:', snapshot.size);
      
      const forceMode = process.argv.includes('--force');
      
      if (!forceMode) {
        console.log('\n Aborted. Use --force to add sample data anyway.');
        console.log('Example: node scripts/initAttendance-firestore.js --force\n');
        process.exit(0);
      }
      
      console.log('Force mode enabled. Adding sample data...\n');
    }

    
    console.log('Creating sample attendance records...');
    
    const today = new Date();
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    
    const sampleRecords = [
      {
        memberId: 'sample_member_001',
        nama: 'Sample User 1',
        nim: '2111000001',
        checkIn: admin.firestore.Timestamp.fromDate(new Date(today.setHours(8, 0, 0))),
        checkOut: admin.firestore.Timestamp.fromDate(new Date(today.setHours(17, 0, 0))),
        status: 'present',
        isLate: false,
        date: new Date().toISOString().split('T')[0],
        day: dayNames[new Date().getDay()],
        deviceId: 'ESP32_RFID_001',
        rfidId: '1234567890AB',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        memberId: 'sample_member_002',
        nama: 'Sample User 2',
        nim: '2111000002',
        checkIn: admin.firestore.Timestamp.fromDate(new Date(today.setHours(18, 30, 0))),
        checkOut: null,
        status: 'late',
        isLate: true,
        date: new Date().toISOString().split('T')[0],
        day: dayNames[new Date().getDay()],
        deviceId: 'ESP32_RFID_001',
        rfidId: 'ABCDEF123456',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];

    const createdIds = [];
    
    for (const record of sampleRecords) {
      const docRef = await attendanceRef.add(record);
      createdIds.push(docRef.id);
      console.log('Created:', record.nama, '→', docRef.id);
    }

    console.log('\n Sample attendance records created!');
    
    
    console.log('\n Verifying structure...');
    const verifySnapshot = await attendanceRef.get();
    
    console.log('\n Final Structure:');
    console.log('Total documents:', verifySnapshot.size);
    console.log('Sample IDs:', createdIds.join(','));
    
    console.log('\n Attendance collection initialization complete!');
    console.log('\n Next steps:');
    console.log('1. Check Firebase Console: https://console.firebase.google.com');
    console.log('2. Navigate to Firestore Database');
    console.log('3. Verify "attendance" collection exists');
    console.log('4. Test ESP32 RFID scan\n');
    
  } catch (error) {
    console.error('\n Error initializing attendance:', error.message);
    console.error('\n Troubleshooting:');
    console.error('1. Check Firestore is enabled in Firebase Console');
    console.error('2. Verify Firestore Security Rules allow write access');
    console.error('3. Check network connection');
    console.error('4. Make sure Firebase project is active');
    
    if (error.code === 'permission-denied') {
      console.error('\n Permission denied! Update Firestore Rules:');
      console.error(`rules_version = '2'; service cloud.firestore { match /databases/{database}/documents { match /{document=**} { allow read, write: if true; } } }`);
    }
    
    if (error.code) {
      console.error('\nError code:', error.code);
    }
    
    process.exit(1);
  }

  process.exit(0);
}


if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`Usage: node scripts/initAttendance-firestore.js [options] Options: --force Add sample data even if collection exists --help Show this help message Examples: node scripts/initAttendance-firestore.js # Create sample data node scripts/initAttendance-firestore.js --force # Force create`);
  process.exit(0);
}


initAttendanceCollection();