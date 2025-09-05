/**
 * Public Registration Controller (Development Only)
 * Controller untuk registrasi publik - hanya untuk development
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const admin = require('firebase-admin');

class PublicAuthController {
  /**
   * Public registration - untuk development saja
   */
  static async publicRegister(req, res) {
    try {
      const { nama, email, password, role = 'user' } = req.body;

      // Validasi input
      if (!nama || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Nama, email, dan password harus diisi.'
        });
      }

      // Validasi email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Format email tidak valid.'
        });
      }

      // Validasi password minimal 6 karakter
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password minimal 6 karakter.'
        });
      }

      // Check apakah email sudah ada
      const usersRef = admin.firestore().collection('users');
      const existingUser = await usersRef.where('email', '==', email).get();

      if (!existingUser.empty) {
        return res.status(400).json({
          success: false,
          message: 'Email sudah terdaftar.'
        });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Data user baru
      const newUser = {
        nama,
        email,
        password: hashedPassword,
        role: role === 'admin' ? 'user' : role, // Prevent admin registration via public endpoint
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: null, // Public registration
        lastLogin: null,
        lastLoginIP: null
      };

      // Simpan ke Firestore
      const userDoc = await usersRef.add(newUser);

      // Generate JWT token untuk auto-login
      const tokenPayload = {
        id: userDoc.id,
        email: newUser.email,
        nama: newUser.nama,
        role: newUser.role,
        status: newUser.status
      };

      const token = jwt.sign(
        tokenPayload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      res.status(201).json({
        success: true,
        message: 'Registrasi berhasil! Anda sudah otomatis login.',
        data: {
          user: {
            id: userDoc.id,
            nama: newUser.nama,
            email: newUser.email,
            role: newUser.role,
            status: newUser.status
          },
          token,
          expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        }
      });

    } catch (error) {
      console.error('Public register error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mendaftarkan akun.'
      });
    }
  }

  /**
   * Check if any admin exists
   */
  static async checkAdminExists(req, res) {
    try {
      const usersRef = admin.firestore().collection('users');
      const adminQuery = await usersRef.where('role', '==', 'admin').limit(1).get();

      res.json({
        success: true,
        data: {
          adminExists: !adminQuery.empty,
          canRegisterPublic: adminQuery.empty // Allow public registration only if no admin exists
        }
      });

    } catch (error) {
      console.error('Check admin exists error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengecek admin.'
      });
    }
  }
}

module.exports = PublicAuthController;
