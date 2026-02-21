

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');


const AuthMiddleware = require('../middleware/auth');
const AuthorizationMiddleware = require('../middleware/authorization');
const ValidationMiddleware = require('../middleware/inputValidation');


const verifyToken = AuthMiddleware.verifyToken;
const requireAdmin = AuthorizationMiddleware.requireAdmin;
const validateLogin = ValidationMiddleware.validateLogin;
const validateUserRegistration = ValidationMiddleware.validateUserRegistration;
const validateChangePassword = ValidationMiddleware.validateChangePassword;
const sanitizeInput = ValidationMiddleware.sanitizeInput;


const loginRateLimit = AuthMiddleware.loginRateLimit();





router.post('/login', 
  loginRateLimit,
  sanitizeInput,
  validateLogin,
  AuthController.login
);



router.post('/register',
  sanitizeInput,
  verifyToken,
  requireAdmin,
  validateUserRegistration,
  AuthController.register
);



router.post('/logout',
  verifyToken,
  AuthController.logout
);



router.get('/verify',
  verifyToken,
  AuthController.verifyToken
);



router.post('/refresh',
  verifyToken,
  AuthController.refreshToken
);



router.post('/change-password',
  sanitizeInput,
  verifyToken,
  validateChangePassword,
  AuthController.changePassword
);





router.get('/users',
  verifyToken,
  requireAdmin,
  AuthController.getAllUsers
);



router.put('/users/:userId/status',
  sanitizeInput,
  verifyToken,
  requireAdmin,
  AuthController.updateUserStatus
);

module.exports = router;
