

require('dotenv').config();
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');


const serviceAccount = require('../config/absensi-reslab-db-firebase-adminsdk-fbsvc-b5a3a5b423.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

async function createInitialAdmin() {
  try {
    console.log('Starting initial admin setup...');

    const usersRef = admin.firestore().collection('users');
    
    
    const adminQuery = await usersRef.where('email', '==', 'admin@reslab.com').get();
    
    if (!adminQuery.empty) {
      console.log('Admin user already exists!');
      console.log('Email: admin@reslab.com');
      process.exit(0);
    }

    
    const adminPassword = 'admin123456'; 
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    const adminData = {
      nama: 'Administrator',
      email: 'admin@reslab.com',
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'system',
      lastLogin: null,
      lastLoginIP: null
    };

    const adminDoc = await usersRef.add(adminData);

    console.log('Initial admin user created successfully!');
    console.log('Email: admin@reslab.com');
    console.log('Password: admin123456');
    console.log('User ID:', adminDoc.id);
    console.log('');
    console.log('IMPORTANT: Please change the default password after first login!');
    console.log('');

    
    const sampleUsers = [
      {
        nama: 'Operator Reslab',
        email: 'operator@reslab.com',
        password: await bcrypt.hash('operator123', saltRounds),
        role: 'operator',
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: adminDoc.id
      },
      {
        nama: 'Viewer Reslab',
        email: 'viewer@reslab.com',
        password: await bcrypt.hash('viewer123', saltRounds),
        role: 'viewer',
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: adminDoc.id
      }
    ];

    console.log('Creating sample users...');
    
    for (const userData of sampleUsers) {
      const userDoc = await usersRef.add(userData);
      console.log(`Created ${userData.role}: ${userData.email} (ID: ${userDoc.id})`);
    }

    console.log('');
    console.log('Setup completed successfully!');
    console.log('');
    console.log('Login credentials:');
    console.log('Admin: admin@reslab.com / admin123456');
    console.log('Operator: operator@reslab.com / operator123');
    console.log('Viewer: viewer@reslab.com / viewer123');

  } catch (error) {
    console.error('Error creating initial admin:', error);
    process.exit(1);
  }

  process.exit(0);
}


createInitialAdmin();
