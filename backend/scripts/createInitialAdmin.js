/**
 * Script untuk membuat admin pertama
 * Jalankan: node scripts/createInitialAdmin.js
 */

const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');

// Initialize Firebase Admin (pastikan serviceAccountKey.json ada)
const serviceAccount = require('../config/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createInitialAdmin() {
  try {
    console.log('🔧 Creating initial admin user...');

    const adminEmail = 'admin@reslab.com';
    const adminPassword = 'admin123'; // Ganti dengan password yang aman
    const adminName = 'Administrator';

    // Check if admin already exists
    const usersRef = db.collection('users');
    const existingAdmin = await usersRef.where('email', '==', adminEmail).get();

    if (!existingAdmin.empty) {
      console.log('❌ Admin user already exists!');
      console.log('Email:', adminEmail);
      return;
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    // Create admin user
    const adminData = {
      nama: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: null, // Initial admin has no creator
      lastLogin: null,
      lastLoginIP: null
    };

    const adminDoc = await usersRef.add(adminData);

    console.log('✅ Initial admin user created successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('🆔 User ID:', adminDoc.id);
    console.log('⚠️  Please change the password after first login!');

  } catch (error) {
    console.error('❌ Error creating initial admin:', error);
  } finally {
    process.exit(0);
  }
}

createInitialAdmin();
