

const express = require('express');
const router = express.Router();
const PublicAuthController = require('../controllers/publicAuthController');
const ValidationMiddleware = require('../middleware/inputValidation');


router.post('/register',
  ValidationMiddleware.sanitizeInput,
  ValidationMiddleware.validateUserRegistration,
  PublicAuthController.publicRegister
);


router.get('/check-admin',
  PublicAuthController.checkAdminExists
);

module.exports = router;
