

const AuthMiddleware = require('./auth');
const AuthorizationMiddleware = require('./authorization');
const ValidationMiddleware = require('./inputValidation');


let ExistingValidation;
try {
  ExistingValidation = require('./validation');
} catch (error) {
  ExistingValidation = null;
}

module.exports = {
  
  Auth: AuthMiddleware,
  
  
  Authorization: AuthorizationMiddleware,
  
  
  Validation: ValidationMiddleware,
  
  
  ExistingValidation,
  
  
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
