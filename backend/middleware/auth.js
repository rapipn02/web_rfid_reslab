/**
 * Authentication Middleware
 * Middleware untuk validasi token JWT dan otorisasi user
 */

const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');

class AuthMiddleware {
  /**
   * Middleware untuk verifikasi JWT token
   */
  static verifyToken(req, res, next) {
    try {
      // Ambil token dari header Authorization
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Token tidak ditemukan. Silakan login terlebih dahulu.'
        });
      }

      // Extract token dari "Bearer <token>"
      const token = authHeader.substring(7);

      // Verifikasi token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Simpan user info ke request object
      req.user = decoded;
      
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token telah expired. Silakan login kembali.'
        });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Token tidak valid.'
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Error dalam verifikasi token.'
        });
      }
    }
  }

  /**
   * Middleware untuk verifikasi role admin
   */
  static requireAdmin(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User tidak terautentikasi.'
        });
      }

      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Akses ditolak. Hanya admin yang diizinkan.'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error dalam verifikasi role.'
      });
    }
  }

  /**
   * Middleware untuk verifikasi user aktif
   */
  static requireActiveUser(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User tidak terautentikasi.'
        });
      }

      if (req.user.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'Akun tidak aktif. Hubungi administrator.'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error dalam verifikasi status user.'
      });
    }
  }

  /**
   * Middleware optional auth - tidak error jika tidak ada token
   */
  static optionalAuth(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
      }
      
      next();
    } catch (error) {
      // Jika ada error, tetap lanjut tanpa user info
      next();
    }
  }

  /**
   * Middleware untuk validasi Firebase ID Token (jika menggunakan Firebase Auth)
   */
  static async verifyFirebaseToken(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Token tidak ditemukan.'
        });
      }

      const idToken = authHeader.substring(7);

      // Verifikasi Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      
      // Simpan user info dari Firebase
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        firebaseUser: decodedToken
      };
      
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token Firebase tidak valid.',
        error: error.message
      });
    }
  }

  /**
   * Middleware untuk rate limiting login attempts
   */
  static loginRateLimit() {
    const attempts = new Map();
    const MAX_ATTEMPTS = 5;
    const BLOCK_TIME = 15 * 60 * 1000; // 15 menit

    return (req, res, next) => {
      const ip = req.ip || req.connection.remoteAddress;
      const now = Date.now();
      
      if (attempts.has(ip)) {
        const attemptData = attempts.get(ip);
        
        // Reset jika sudah lewat waktu block
        if (now - attemptData.lastAttempt > BLOCK_TIME) {
          attempts.delete(ip);
        } else if (attemptData.count >= MAX_ATTEMPTS) {
          const remainingTime = Math.ceil((BLOCK_TIME - (now - attemptData.lastAttempt)) / 1000 / 60);
          return res.status(429).json({
            success: false,
            message: `Terlalu banyak percobaan login. Coba lagi dalam ${remainingTime} menit.`
          });
        }
      }
      
      next();
    };
  }

  /**
   * Helper untuk record failed login attempt
   */
  static recordFailedAttempt(req) {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    const attempts = req.app.locals.loginAttempts || new Map();
    
    if (attempts.has(ip)) {
      const attemptData = attempts.get(ip);
      attempts.set(ip, {
        count: attemptData.count + 1,
        lastAttempt: now
      });
    } else {
      attempts.set(ip, {
        count: 1,
        lastAttempt: now
      });
    }
    
    req.app.locals.loginAttempts = attempts;
  }

  /**
   * Helper untuk clear successful login attempt
   */
  static clearFailedAttempts(req) {
    const ip = req.ip || req.connection.remoteAddress;
    const attempts = req.app.locals.loginAttempts || new Map();
    
    if (attempts.has(ip)) {
      attempts.delete(ip);
    }
  }
}

module.exports = AuthMiddleware;
