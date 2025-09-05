# Authentication Middleware Documentation

Dokumentasi lengkap untuk sistem authentication dan authorization dalam backend Absensi Reslab.

## Overview

Sistem authentication terdiri dari beberapa komponen:
- **Authentication Middleware**: Verifikasi JWT token
- **Authorization Middleware**: Role-based access control (RBAC)
- **Input Validation Middleware**: Validasi dan sanitasi input
- **Auth Controller**: Handler untuk login, register, dll

## Quick Start

### 1. Setup Initial Admin User

```bash
npm run setup-admin
```

Ini akan membuat user admin default:
- Email: `admin@reslab.com`
- Password: `admin123456`

### 2. Login dan Mendapatkan Token

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@reslab.com",
  "password": "admin123456"
}
```

Response:
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "user": {
      "id": "...",
      "email": "admin@reslab.com",
      "nama": "Administrator",
      "role": "admin",
      "status": "active"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  }
}
```

### 3. Menggunakan Token

Sertakan token di header Authorization:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Middleware Types

### 1. Authentication Middleware

#### `verifyToken`
Verifikasi JWT token yang valid.

```javascript
const { verifyToken } = require('../middleware');

router.get('/protected-route', verifyToken, (req, res) => {
  // req.user berisi informasi user yang sudah login
  res.json({ user: req.user });
});
```

#### `requireAdmin`
Membutuhkan role admin.

```javascript
router.post('/admin-only', verifyToken, requireAdmin, controller);
```

#### `requireActiveUser`
Membutuhkan user dengan status active.

```javascript
router.get('/data', verifyToken, Auth.requireActiveUser, controller);
```

#### `optionalAuth`
Authentication opsional (tidak error jika tidak ada token).

```javascript
router.get('/public-data', Auth.optionalAuth, controller);
```

### 2. Authorization Middleware

#### `requireRoles(...roles)`
Membutuhkan salah satu dari role yang disebutkan.

```javascript
const { requireRoles } = require('../middleware');

// Hanya admin atau operator
router.put('/members/:id', verifyToken, requireRoles('admin', 'operator'), controller);
```

#### `requirePermission(permission)`
Membutuhkan permission spesifik.

```javascript
const { requirePermission } = require('../middleware');

// Butuh permission read:members
router.get('/members', verifyToken, requirePermission('read:members'), controller);
```

#### `requireOwnership(resourceParam)`
Membutuhkan ownership resource (user hanya bisa akses data sendiri, kecuali admin).

```javascript
// User hanya bisa edit profile sendiri
router.put('/users/:id', verifyToken, Authorization.requireOwnership('id'), controller);
```

### 3. Validation Middleware

#### `validateLogin`
Validasi input login.

```javascript
router.post('/login', validateLogin, AuthController.login);
```

#### `validateMemberData`
Validasi data member.

```javascript
router.post('/members', validateMemberData, controller);
```

#### `sanitizeInput`
Sanitasi input untuk mencegah XSS.

```javascript
router.post('/data', sanitizeInput, controller);
```

## Role System

### Roles Available
- **admin**: Full access ke semua fitur
- **operator**: Bisa CRUD members, attendance, dan reports
- **viewer**: Hanya bisa read data

### Permission Matrix

| Permission | Admin | Operator | Viewer |
|------------|-------|----------|--------|
| read:members | ✅ | ✅ | ✅ |
| create:members | ✅ | ✅ | ❌ |
| update:members | ✅ | ✅ | ❌ |
| delete:members | ✅ | ❌ | ❌ |
| read:attendance | ✅ | ✅ | ✅ |
| create:attendance | ✅ | ✅ | ❌ |
| update:attendance | ✅ | ✅ | ❌ |
| delete:attendance | ✅ | ❌ | ❌ |
| read:reports | ✅ | ✅ | ✅ |
| manage:system | ✅ | ❌ | ❌ |

## Protected Routes Example

```javascript
const express = require('express');
const router = express.Router();
const { 
  verifyToken, 
  requireAdmin, 
  requirePermission,
  validateMemberData,
  sanitizeInput 
} = require('../middleware');

// Public endpoint (tidak butuh auth)
router.get('/public-data', controller.getPublicData);

// Protected endpoint (butuh login)
router.get('/user-data', verifyToken, controller.getUserData);

// Admin only
router.post('/admin-action', verifyToken, requireAdmin, controller.adminAction);

// Permission-based
router.get('/members', verifyToken, requirePermission('read:members'), controller.getMembers);
router.post('/members', 
  sanitizeInput,
  verifyToken, 
  requirePermission('create:members'),
  validateMemberData,
  controller.createMember
);

// Multiple middleware
router.put('/sensitive-data/:id',
  sanitizeInput,           // 1. Sanitasi input
  verifyToken,            // 2. Verifikasi login
  requireAdmin,           // 3. Cek role admin
  validateData,           // 4. Validasi data
  controller.updateData   // 5. Execute controller
);
```

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Token tidak ditemukan. Silakan login terlebih dahulu."
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Akses ditolak. Hanya admin yang diizinkan."
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "message": "Terlalu banyak percobaan login. Coba lagi dalam 15 menit."
}
```

## Environment Variables

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-key-here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
```

## Security Features

1. **Rate Limiting**: Maksimal 5 percobaan login per 15 menit per IP
2. **Password Hashing**: Menggunakan bcryptjs dengan salt rounds 12
3. **Input Sanitization**: Membersihkan input dari script tags dan karakter berbahaya
4. **CORS Protection**: Konfigurasi CORS yang ketat
5. **Helmet Security**: Security headers
6. **JWT Expiration**: Token otomatis expired setelah 24 jam

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify token
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/change-password` - Change password

### User Management (Admin Only)
- `POST /api/auth/register` - Register new user
- `GET /api/auth/users` - Get all users
- `PUT /api/auth/users/:id/status` - Update user status

## Testing Authentication

### 1. Login Test
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@reslab.com","password":"admin123456"}'
```

### 2. Access Protected Route
```bash
curl -X GET http://localhost:5000/api/members \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Test Invalid Token
```bash
curl -X GET http://localhost:5000/api/members \
  -H "Authorization: Bearer invalid_token"
```

## Troubleshooting

### Token Expired
- Solution: Login ulang atau gunakan refresh token

### Permission Denied
- Check role user di database
- Pastikan endpoint membutuhkan permission yang sesuai

### Rate Limited
- Tunggu 15 menit atau gunakan IP lain untuk testing

### CORS Error
- Pastikan frontend URL sudah ditambahkan di CORS configuration

## Development Tips

1. Gunakan Postman atau insomnia untuk testing API
2. Check network tab di browser untuk melihat request/response
3. Monitor server logs untuk error details
4. Gunakan JWT debugger (jwt.io) untuk decode token
