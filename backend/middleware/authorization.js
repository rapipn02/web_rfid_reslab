/**
 * Authorization Middleware
 * Middleware untuk otorisasi berdasarkan role dan permission
 */

class AuthorizationMiddleware {
  /**
   * Middleware untuk check multiple roles
   */
  static requireRoles(...roles) {
    return (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: 'User tidak terautentikasi.'
          });
        }

        if (!roles.includes(req.user.role)) {
          return res.status(403).json({
            success: false,
            message: `Akses ditolak. Role yang dibutuhkan: ${roles.join(', ')}`
          });
        }

        next();
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error dalam verifikasi role.'
        });
      }
    };
  }

  /**
   * Middleware untuk check permission spesifik
   */
  static requirePermission(permission) {
    return (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: 'User tidak terautentikasi.'
          });
        }

        // Define permissions untuk setiap role
        const rolePermissions = {
          admin: [
            'read:members',
            'create:members', 
            'update:members',
            'delete:members',
            'read:attendance',
            'create:attendance',
            'update:attendance',
            'delete:attendance',
            'read:reports',
            'manage:system'
          ],
          operator: [
            'read:members',
            'create:members',
            'update:members',
            'read:attendance',
            'create:attendance',
            'update:attendance',
            'read:reports'
          ],
          viewer: [
            'read:members',
            'read:attendance',
            'read:reports'
          ]
        };

        const userPermissions = rolePermissions[req.user.role] || [];

        if (!userPermissions.includes(permission)) {
          return res.status(403).json({
            success: false,
            message: `Akses ditolak. Permission '${permission}' tidak dimiliki.`
          });
        }

        next();
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error dalam verifikasi permission.'
        });
      }
    };
  }

  /**
   * Middleware untuk check ownership resource
   */
  static requireOwnership(resourceParam = 'id') {
    return (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: 'User tidak terautentikasi.'
          });
        }

        // Admin bisa mengakses semua resource
        if (req.user.role === 'admin') {
          return next();
        }

        const resourceId = req.params[resourceParam];
        const userId = req.user.id || req.user.uid;

        if (resourceId !== userId) {
          return res.status(403).json({
            success: false,
            message: 'Akses ditolak. Anda hanya bisa mengakses data sendiri.'
          });
        }

        next();
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error dalam verifikasi ownership.'
        });
      }
    };
  }

  /**
   * Middleware untuk check time-based access
   */
  static requireTimeAccess(startHour = 6, endHour = 22) {
    return (req, res, next) => {
      try {
        const currentHour = new Date().getHours();

        if (currentHour < startHour || currentHour > endHour) {
          return res.status(403).json({
            success: false,
            message: `Akses hanya diizinkan antara jam ${startHour}:00 - ${endHour}:00`
          });
        }

        next();
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error dalam verifikasi waktu akses.'
        });
      }
    };
  }

  /**
   * Middleware untuk check IP whitelist (opsional)
   */
  static requireWhitelistedIP(whitelist = []) {
    return (req, res, next) => {
      try {
        if (whitelist.length === 0) {
          return next(); // Skip jika tidak ada whitelist
        }

        const clientIP = req.ip || req.connection.remoteAddress;
        
        if (!whitelist.includes(clientIP)) {
          return res.status(403).json({
            success: false,
            message: 'Akses ditolak dari IP ini.'
          });
        }

        next();
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error dalam verifikasi IP.'
        });
      }
    };
  }

  /**
   * Middleware untuk check admin role
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
          message: 'Akses ditolak. Hanya admin yang dapat mengakses.'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error dalam verifikasi admin.'
      });
    }
  }
}

module.exports = AuthorizationMiddleware;
