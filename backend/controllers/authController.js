/**
 * Authentication Controller
 * Controller untuk handle login, register, dan authentication
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const admin = require('firebase-admin');
const AuthMiddleware = require('../middleware/auth');

class AuthController {
  /**
   * Login user dengan email dan password
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Cari user di Firestore
      const usersRef = admin.firestore().collection('users');
      const userQuery = await usersRef.where('email', '==', email).get();

      if (userQuery.empty) {
        AuthMiddleware.recordFailedAttempt(req);
        return res.status(401).json({
          success: false,
          message: 'Email atau password salah.'
        });
      }

      const userDoc = userQuery.docs[0];
      const userData = userDoc.data();

      // Verifikasi password
      const isPasswordValid = await bcrypt.compare(password, userData.password);
      
      if (!isPasswordValid) {
        AuthMiddleware.recordFailedAttempt(req);
        return res.status(401).json({
          success: false,
          message: 'Email atau password salah.'
        });
      }

      // Check status user
      if (userData.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'Akun tidak aktif. Hubungi administrator.'
        });
      }

      // Clear failed attempts on successful login
      AuthMiddleware.clearFailedAttempts(req);

      // Generate JWT token
      const tokenPayload = {
        id: userDoc.id,
        email: userData.email,
        nama: userData.nama,
        role: userData.role,
        status: userData.status
      };

      const token = jwt.sign(
        tokenPayload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      // Update last login
      await userDoc.ref.update({
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginIP: req.ip || req.connection.remoteAddress
      });

      // Response sukses
      res.json({
        success: true,
        message: 'Login berhasil.',
        data: {
          user: {
            id: userDoc.id,
            email: userData.email,
            nama: userData.nama,
            role: userData.role,
            status: userData.status
          },
          token,
          expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat login.'
      });
    }
  }

  /**
   * Register user baru (hanya admin yang bisa)
   */
  static async register(req, res) {
    try {
      const { nama, email, password, role = 'viewer' } = req.body;

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
        role,
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: req.user.id,
        lastLogin: null,
        lastLoginIP: null
      };

      // Simpan ke Firestore
      const userDoc = await usersRef.add(newUser);

      res.status(201).json({
        success: true,
        message: 'User berhasil didaftarkan.',
        data: {
          id: userDoc.id,
          nama,
          email,
          role,
          status: 'active'
        }
      });

    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mendaftarkan user.'
      });
    }
  }

  /**
   * Logout user
   */
  static async logout(req, res) {
    try {
      // Update last logout di database
      const usersRef = admin.firestore().collection('users');
      await usersRef.doc(req.user.id).update({
        lastLogout: admin.firestore.FieldValue.serverTimestamp()
      });

      res.json({
        success: true,
        message: 'Logout berhasil.'
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat logout.'
      });
    }
  }

  /**
   * Verify token dan get user info
   */
  static async verifyToken(req, res) {
    try {
      // Token sudah diverifikasi di middleware
      const usersRef = admin.firestore().collection('users');
      const userDoc = await usersRef.doc(req.user.id).get();

      if (!userDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'User tidak ditemukan.'
        });
      }

      const userData = userDoc.data();

      res.json({
        success: true,
        data: {
          id: userDoc.id,
          email: userData.email,
          nama: userData.nama,
          role: userData.role,
          status: userData.status,
          lastLogin: userData.lastLogin
        }
      });

    } catch (error) {
      console.error('Verify token error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat verifikasi token.'
      });
    }
  }

  /**
   * Refresh token
   */
  static async refreshToken(req, res) {
    try {
      // Generate token baru dengan data user yang sama
      const tokenPayload = {
        id: req.user.id,
        email: req.user.email,
        nama: req.user.nama,
        role: req.user.role,
        status: req.user.status
      };

      const newToken = jwt.sign(
        tokenPayload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      res.json({
        success: true,
        message: 'Token berhasil di-refresh.',
        data: {
          token: newToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        }
      });

    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat refresh token.'
      });
    }
  }

  /**
   * Change password
   */
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      // Get user data
      const usersRef = admin.firestore().collection('users');
      const userDoc = await usersRef.doc(req.user.id).get();

      if (!userDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'User tidak ditemukan.'
        });
      }

      const userData = userDoc.data();

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userData.password);
      
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Password lama tidak sesuai.'
        });
      }

      // Hash new password
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await userDoc.ref.update({
        password: hashedNewPassword,
        passwordChangedAt: admin.firestore.FieldValue.serverTimestamp(),
        passwordChangedBy: req.user.id
      });

      res.json({
        success: true,
        message: 'Password berhasil diubah.'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengubah password.'
      });
    }
  }

  /**
   * Get all users (admin only)
   */
  static async getAllUsers(req, res) {
    try {
      const usersRef = admin.firestore().collection('users');
      const snapshot = await usersRef.orderBy('createdAt', 'desc').get();

      const users = [];
      snapshot.forEach(doc => {
        const userData = doc.data();
        users.push({
          id: doc.id,
          nama: userData.nama,
          email: userData.email,
          role: userData.role,
          status: userData.status,
          lastLogin: userData.lastLogin,
          createdAt: userData.createdAt
        });
      });

      res.json({
        success: true,
        data: users,
        total: users.length
      });

    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil data users.'
      });
    }
  }

  /**
   * Update user status (admin only)
   */
  static async updateUserStatus(req, res) {
    try {
      const { userId } = req.params;
      const { status } = req.body;

      if (!['active', 'inactive', 'suspended'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status tidak valid.'
        });
      }

      const usersRef = admin.firestore().collection('users');
      const userDoc = await usersRef.doc(userId).get();

      if (!userDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'User tidak ditemukan.'
        });
      }

      await userDoc.ref.update({
        status,
        statusChangedAt: admin.firestore.FieldValue.serverTimestamp(),
        statusChangedBy: req.user.id
      });

      res.json({
        success: true,
        message: 'Status user berhasil diupdate.'
      });

    } catch (error) {
      console.error('Update user status error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengupdate status user.'
      });
    }
  }
}

module.exports = AuthController;
