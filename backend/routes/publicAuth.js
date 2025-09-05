/**
 * Public Auth Routes
 * Routes untuk public registration (development)
 */

const express = require('express');
const router = express.Router();
const PublicAuthController = require('../controllers/publicAuthController');
const ValidationMiddleware = require('../middleware/inputValidation');

/**
 * @swagger
 * /api/public/register:
 *   post:
 *     summary: Public user registration
 *     description: Register new user (development only)
 *     tags: [Public Auth]
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
 *                 description: User's full name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: User's password
 *               role:
 *                 type: string
 *                 enum: [user, operator, viewer]
 *                 default: user
 *                 description: User role
 */
router.post('/register',
  ValidationMiddleware.sanitizeInput,
  ValidationMiddleware.validateUserRegistration,
  PublicAuthController.publicRegister
);

/**
 * @swagger
 * /api/public/check-admin:
 *   get:
 *     summary: Check if admin exists
 *     description: Check if any admin user exists in the system
 *     tags: [Public Auth]
 */
router.get('/check-admin',
  PublicAuthController.checkAdminExists
);

module.exports = router;
