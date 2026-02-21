

const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');

class AuthMiddleware {
  
  static verifyToken(req, res, next) {
    try {
      
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Token tidak ditemukan. Silakan login terlebih dahulu.'
        });
      }

      
      const token = authHeader.substring(7);

      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      
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
      
      next();
    }
  }

  
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

      
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      
      
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

  
  static loginRateLimit() {
    const attempts = new Map();
    const MAX_ATTEMPTS = 5;
    const BLOCK_TIME = 15 * 60 * 1000; 

    return (req, res, next) => {
      const ip = req.ip || req.connection.remoteAddress;
      const now = Date.now();
      
      if (attempts.has(ip)) {
        const attemptData = attempts.get(ip);
        
        
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

  
  static clearFailedAttempts(req) {
    const ip = req.ip || req.connection.remoteAddress;
    const attempts = req.app.locals.loginAttempts || new Map();
    
    if (attempts.has(ip)) {
      attempts.delete(ip);
    }
  }
}

module.exports = AuthMiddleware;
