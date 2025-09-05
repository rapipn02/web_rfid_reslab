/**
 * Authentication Routes
 * Routes untuk authentication dan user management
 */

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

// Import middleware secara langsung untuk debugging
const AuthMiddleware = require('../middleware/auth');
const AuthorizationMiddleware = require('../middleware/authorization');
const ValidationMiddleware = require('../middleware/inputValidation');

// Assign middleware functions
const verifyToken = AuthMiddleware.verifyToken;
const requireAdmin = AuthorizationMiddleware.requireAdmin;
const validateLogin = ValidationMiddleware.validateLogin;
const validateUserRegistration = ValidationMiddleware.validateUserRegistration;
const validateChangePassword = ValidationMiddleware.validateChangePassword;
const sanitizeInput = ValidationMiddleware.sanitizeInput;

// Rate limiting untuk login
const loginRateLimit = AuthMiddleware.loginRateLimit();

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User email
 *           example: admin@reslab.com
 *         password:
 *           type: string
 *           format: password
 *           description: User password
 *           example: password123
 *     
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Login berhasil
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 nama:
 *                   type: string
 *                 role:
 *                   type: string
 *                 status:
 *                   type: string
 *             token:
 *               type: string
 *             expiresIn:
 *               type: string
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user and receive access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Too many login attempts
 *       500:
 *         description: Internal server error
 */
// POST /api/auth/login - User login dengan rate limiting
router.post('/login', 
  loginRateLimit,
  sanitizeInput,
  validateLogin,
  AuthController.login
);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register new user (Admin only)
 *     description: Register a new user account (requires admin privileges)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nama
 *               - email
 *               - password
 *             properties:
 *               nama:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@reslab.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *               role:
 *                 type: string
 *                 enum: [admin, operator, viewer]
 *                 example: viewer
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or email already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Internal server error
 */
// POST /api/auth/register - Register user baru (admin only)
router.post('/register',
  sanitizeInput,
  verifyToken,
  requireAdmin,
  validateUserRegistration,
  AuthController.register
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: User logout
 *     description: Logout current user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
// POST /api/auth/logout - User logout
router.post('/logout',
  verifyToken,
  AuthController.logout
);

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Verify JWT token
 *     description: Verify current token and get user information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     nama:
 *                       type: string
 *                     role:
 *                       type: string
 *                     status:
 *                       type: string
 *       401:
 *         description: Invalid or expired token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
// GET /api/auth/verify - Verify JWT token
router.get('/verify',
  verifyToken,
  AuthController.verifyToken
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh JWT token
 *     description: Get a new JWT token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid token
 *       500:
 *         description: Internal server error
 */
// POST /api/auth/refresh - Refresh JWT token
router.post('/refresh',
  verifyToken,
  AuthController.refreshToken
);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change user password
 *     description: Change current user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Validation error or wrong current password
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
// POST /api/auth/change-password - Change password
router.post('/change-password',
  sanitizeInput,
  verifyToken,
  validateChangePassword,
  AuthController.changePassword
);

// ===== ADMIN ROUTES =====

/**
 * @swagger
 * /api/auth/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     description: Retrieve list of all users
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       nama:
 *                         type: string
 *                       email:
 *                         type: string
 *                       role:
 *                         type: string
 *                       status:
 *                         type: string
 *                 total:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Internal server error
 */
// GET /api/auth/users - Get all users (admin only)
router.get('/users',
  verifyToken,
  requireAdmin,
  AuthController.getAllUsers
);

/**
 * @swagger
 * /api/auth/users/{userId}/status:
 *   put:
 *     summary: Update user status (Admin only)
 *     description: Update status of a specific user
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended]
 *                 example: active
 *     responses:
 *       200:
 *         description: User status updated successfully
 *       400:
 *         description: Invalid status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
// PUT /api/auth/users/:userId/status - Update user status (admin only)
router.put('/users/:userId/status',
  sanitizeInput,
  verifyToken,
  requireAdmin,
  AuthController.updateUserStatus
);

module.exports = router;
