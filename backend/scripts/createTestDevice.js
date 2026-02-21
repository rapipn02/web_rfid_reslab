const admin = require('firebase-admin');
const serviceAccount = require('./config/absensi-reslab-db-firebase-adminsdk-fbsvc-b5a3a5b423.json');


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://absensi-reslab-db-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.firestore();

async function createTestDevice() {
  try {
    console.log('Creating test device...');
    
    const deviceData = {
      id: 'ESP32_TEST_001',
      name: 'RFID Scanner Test',
      location: 'Lab Testing',
      status: 'active',
      isRegistrationMode: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      heartbeatCount: 0
    };

    await db.collection('devices').doc('ESP32_TEST_001').set(deviceData);
    console.log('Test device created successfully!');

    
    const memberData = {
      nama: 'Test User',
      nim: 'TEST001',
      prodi: 'Teknik Informatika',
      rfidCard: 'TEST12345',
      status: 'aktif',
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('members').add(memberData);
    console.log('Test member created successfully!');

    process.exit(0);
  } catch (error) {
    console.error('Error creating test data:', error);
    process.exit(1);
  }
}

createTestDevice();
