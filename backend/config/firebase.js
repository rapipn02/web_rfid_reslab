const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getDatabase } = require('firebase/database');
const { getFirestore } = require('firebase/firestore');


require('dotenv').config();



let serviceAccount;
try {
  serviceAccount = require('./absensi-reslab-db-firebase-adminsdk-fbsvc-b5a3a5b423.json');
} catch (error) {
  console.error('Service Account Key not found!');
  console.log('Please put your downloaded serviceAccountKey.json file in backend/config/ folder');
  process.exit(1);
}


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});


const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};


const app = initializeApp(firebaseConfig);


module.exports = {
  
  adminDb: admin.firestore(),
  adminRtdb: admin.database(),
  admin,
  
  
  clientDb: getFirestore(app),
  clientRtdb: getDatabase(app),
  
  
  firebaseConfig
};

console.log('Firebase configuration loaded successfully!');
