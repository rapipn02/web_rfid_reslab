

const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');


const serviceAccount = require('../config/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createInitialAdmin() {
  try {
    console.log('Creating initial admin user...');

    const adminEmail = 'admin@reslab.com';
    const adminPassword = 'admin123'; 
    const adminName = 'Administrator';

    
    const usersRef = db.collection('users');
    const existingAdmin = await usersRef.where('email', '==', adminEmail).get();

    if (!existingAdmin.empty) {
      console.log('Admin user already exists!');
      console.log('Email:', adminEmail);
      return;
    }

    
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    
    const adminData = {
      nama: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: null, 
      lastLogin: null,
      lastLoginIP: null
    };

    const adminDoc = await usersRef.add(adminData);

    console.log('Initial admin user created successfully!');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('User ID:', adminDoc.id);
    console.log('Please change the password after first login!');

  } catch (error) {
    console.error('Error creating initial admin:', error);
  } finally {
    process.exit(0);
  }
}

createInitialAdmin();
