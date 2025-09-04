const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Absensi Reslab API',
      version: '1.0.0',
      description: 'API Documentation untuk Sistem Absensi RFID Reslab',
      contact: {
        name: 'Reslab Team',
        email: 'admin@reslab.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://your-production-url.com',
        description: 'Production server'
      }
    ]
  },
  apis: [
    './swagger/*.js'    // Swagger documentation files
  ]
};

const specs = swaggerJsdoc(options);

module.exports = { specs, swaggerUi };
