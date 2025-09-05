/**
 * Input Validation Middleware
 * Middleware untuk validasi dan sanitasi input data
 */

class ValidationMiddleware {
  /**
   * Middleware untuk validasi login
   */
  static validateLogin(req, res, next) {
    try {
      const { email, password } = req.body;

      // Validasi required fields
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email dan password harus diisi.'
        });
      }

      // Validasi format email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Format email tidak valid.'
        });
      }

      // Validasi panjang password
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password minimal 6 karakter.'
        });
      }

      // Sanitasi input
      req.body.email = email.trim().toLowerCase();
      req.body.password = password.trim();

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error dalam validasi login.'
      });
    }
  }

  /**
   * Middleware untuk validasi registrasi user
   */
  static validateUserRegistration(req, res, next) {
    try {
      const { nama, email, password, role = 'viewer' } = req.body;

      // Validasi required fields
      if (!nama || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Nama, email, dan password harus diisi.'
        });
      }

      // Validasi format email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Format email tidak valid.'
        });
      }

      // Validasi panjang password
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password minimal 6 karakter.'
        });
      }

      // Validasi nama
      if (nama.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Nama minimal 2 karakter.'
        });
      }

      // Validasi role
      const validRoles = ['admin', 'operator', 'viewer'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Role tidak valid. Pilih: admin, operator, atau viewer.'
        });
      }

      // Sanitasi input
      req.body.nama = nama.trim();
      req.body.email = email.trim().toLowerCase();
      req.body.password = password.trim();
      req.body.role = role;

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error dalam validasi registrasi.'
      });
    }
  }

  /**
   * Middleware untuk validasi member data
   */
  static validateMemberData(req, res, next) {
    try {
      const { nama, nim, idRfid, hariPiket } = req.body;

      // Validasi required fields
      if (!nama || !nim || !idRfid) {
        return res.status(400).json({
          success: false,
          message: 'Nama, NIM, dan ID RFID harus diisi.'
        });
      }

      // Validasi format NIM (contoh: harus angka dan 10 digit)
      if (!/^\d{8,12}$/.test(nim)) {
        return res.status(400).json({
          success: false,
          message: 'NIM harus berupa angka 8-12 digit.'
        });
      }

      // Validasi ID RFID (contoh: 8-16 karakter alphanumeric)
      if (!/^[A-Za-z0-9]{8,16}$/.test(idRfid)) {
        return res.status(400).json({
          success: false,
          message: 'ID RFID harus berupa 8-16 karakter alphanumeric.'
        });
      }

      // Validasi hari piket
      if (hariPiket) {
        const validDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
        const hariArray = Array.isArray(hariPiket) ? hariPiket : [hariPiket];
        
        for (const hari of hariArray) {
          if (!validDays.includes(hari)) {
            return res.status(400).json({
              success: false,
              message: 'Hari piket tidak valid.'
            });
          }
        }
      }

      // Sanitasi input
      req.body.nama = nama.trim();
      req.body.nim = nim.trim();
      req.body.idRfid = idRfid.trim().toUpperCase();

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error dalam validasi data member.'
      });
    }
  }

  /**
   * Middleware untuk validasi attendance data
   */
  static validateAttendanceData(req, res, next) {
    try {
      const { idRfid, status, tanggal } = req.body;

      // Validasi required fields
      if (!idRfid) {
        return res.status(400).json({
          success: false,
          message: 'ID RFID harus diisi.'
        });
      }

      // Validasi status
      const validStatus = ['hadir', 'tidak hadir', 'terlambat', 'izin'];
      if (status && !validStatus.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status tidak valid.'
        });
      }

      // Validasi format tanggal jika ada
      if (tanggal) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(tanggal)) {
          return res.status(400).json({
            success: false,
            message: 'Format tanggal harus YYYY-MM-DD.'
          });
        }
      }

      // Sanitasi input
      req.body.idRfid = idRfid.trim().toUpperCase();
      if (status) req.body.status = status.toLowerCase();

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error dalam validasi data absensi.'
      });
    }
  }

  /**
   * Middleware untuk validasi change password
   */
  static validateChangePassword(req, res, next) {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;

      // Validasi required fields
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Password lama, password baru, dan konfirmasi password harus diisi.'
        });
      }

      // Validasi panjang password baru
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password baru minimal 6 karakter.'
        });
      }

      // Validasi konfirmasi password
      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Konfirmasi password tidak sesuai.'
        });
      }

      // Validasi password tidak sama
      if (currentPassword === newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Password baru harus berbeda dengan password lama.'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error dalam validasi change password.'
      });
    }
  }

  /**
   * Middleware untuk sanitasi input umum
   */
  static sanitizeInput(req, res, next) {
    try {
      // Function untuk membersihkan string dari karakter berbahaya
      const sanitizeString = (str) => {
        if (typeof str !== 'string') return str;
        
        return str
          .trim()
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
          .replace(/[<>'"]/g, ''); // Remove potentially dangerous characters
      };

      // Sanitasi semua string dalam body
      const sanitizeObject = (obj) => {
        for (const key in obj) {
          if (typeof obj[key] === 'string') {
            obj[key] = sanitizeString(obj[key]);
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitizeObject(obj[key]);
          }
        }
      };

      if (req.body && typeof req.body === 'object') {
        sanitizeObject(req.body);
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error dalam sanitasi input.'
      });
    }
  }
}

module.exports = ValidationMiddleware;
