

class AuthorizationMiddleware {
  
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

  
  static requirePermission(permission) {
    return (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: 'User tidak terautentikasi.'
          });
        }

        
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

  
  static requireOwnership(resourceParam = 'id') {
    return (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: 'User tidak terautentikasi.'
          });
        }

        
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

  
  static requireWhitelistedIP(whitelist = []) {
    return (req, res, next) => {
      try {
        if (whitelist.length === 0) {
          return next(); 
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
