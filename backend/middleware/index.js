/**
 * Middleware Index
 * Central export untuk semua middleware
 */

const AuthMiddleware = require('./auth');
const AuthorizationMiddleware = require('./authorization');
const ValidationMiddleware = require('./inputValidation');

// Import existing validation middleware if any
let ExistingValidation;
try {
  ExistingValidation = require('./validation');
} catch (error) {
  ExistingValidation = null;
}

module.exports = {
  // Authentication Middleware
  Auth: AuthMiddleware,
  
  // Authorization Middleware  
  Authorization: AuthorizationMiddleware,
  
  // Input Validation Middleware
  Validation: ValidationMiddleware,
  
  // Existing Validation (if available)
  ExistingValidation,
  
  // Quick access untuk middleware yang sering digunakan
  verifyToken: AuthMiddleware.verifyToken,
  requireAdmin: AuthorizationMiddleware.requireAdmin,
  requireRoles: AuthorizationMiddleware.requireRoles,
  requirePermission: AuthorizationMiddleware.requirePermission,
  validateLogin: ValidationMiddleware.validateLogin,
  validateUserRegistration: ValidationMiddleware.validateUserRegistration,
  validateChangePassword: ValidationMiddleware.validateChangePassword,
  validateMemberData: ValidationMiddleware.validateMemberData,
  validateAttendanceData: ValidationMiddleware.validateAttendanceData,
  sanitizeInput: ValidationMiddleware.sanitizeInput
};
