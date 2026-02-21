

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const admin = require('firebase-admin');


router.post('/admin', async (req, res) => {
  try {
    console.log('Setup admin request:', req.body);
    
    
    const usersRef = admin.firestore().collection('users');
    const adminQuery = await usersRef.where('role', '==', 'admin').get();
    
    if (!adminQuery.empty) {
      return res.status(400).json({
        success: false,
        message: 'Admin sudah ada. Gunakan endpoint register biasa.'
      });
    }

    const { nama, email, password } = req.body;

    
    if (!nama || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nama, email, dan password harus diisi.'
      });
    }

    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format email tidak valid.'
      });
    }

    
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password minimal 6 karakter.'
      });
    }

    
    const existingUserQuery = await usersRef.where('email', '==', email).get();
    if (!existingUserQuery.empty) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar.'
      });
    }

    
    const hashedPassword = await bcrypt.hash(password, 12);

    
    const adminData = {
      nama: nama.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await usersRef.add(adminData);

    console.log('Admin created successfully:', docRef.id);

    res.status(201).json({
      success: true,
      message: 'Admin pertama berhasil dibuat.',
      data: {
        id: docRef.id,
        nama: adminData.nama,
        email: adminData.email,
        role: adminData.role,
        status: adminData.status
      }
    });

  } catch (error) {
    console.error('Setup admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membuat admin.'
    });
  }
});


router.get('/status', async (req, res) => {
  try {
    const usersRef = admin.firestore().collection('users');
    const adminQuery = await usersRef.where('role', '==', 'admin').get();
    
    const hasAdmin = !adminQuery.empty;
    const adminCount = adminQuery.size;

    res.json({
      success: true,
      data: {
        hasAdmin,
        adminCount,
        needsSetup: !hasAdmin
      }
    });

  } catch (error) {
    console.error('Setup status error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengecek status setup.'
    });
  }
});

module.exports = router;
