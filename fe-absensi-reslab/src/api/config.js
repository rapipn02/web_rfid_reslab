/**
 * API Configuration
 * Production-ready API configuration with environment handling
 */

// Environment configuration
const config = {
  development: {
    baseURL: 'http://localhost:5000/api',
    timeout: 10000,
    retries: 3,
    retryDelay: 1000
  },
  production: {
    baseURL: import.meta.env.VITE_API_URL || 'https://your-production-api.com/api',
    timeout: 15000,
    retries: 3,
    retryDelay: 2000
  }
};

// Get current environment
const environment = import.meta.env.MODE || 'development';
const currentConfig = config[environment];

// API Configuration
export const API_CONFIG = {
  ...currentConfig,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
};

// API Endpoints
export const API_ENDPOINTS = {
  // Dashboard endpoints
  dashboard: {
    getData: '/dashboard',
    getSummary: '/dashboard/summary'
  },
  
  // Attendance endpoints
  attendance: {
    getAll: '/attendance',
    getById: (id) => `/attendance/${id}`,
    getByMember: (memberId) => `/attendance/member/${memberId}`,
    getToday: '/attendance/today',
    getStats: '/attendance/stats',
    create: '/attendance',
    update: (id) => `/attendance/${id}`,
    delete: (id) => `/attendance/${id}`
  },
  
  // Members endpoints
  members: {
    getAll: '/members',
    getById: (id) => `/members/${id}`,
    create: '/members',
    update: (id) => `/members/${id}`,
    delete: (id) => `/members/${id}`
  },
  
  // RFID endpoints
  rfid: {
    scan: '/rfid/scan',
    getLatestScans: '/rfid/scans/latest',
    getUnknownScans: '/rfid/scans/unknown',
    getDeviceStatus: (deviceId) => `/rfid/device/${deviceId}/status`,
    deviceHeartbeat: (deviceId) => `/rfid/device/${deviceId}/heartbeat`
  },
  
  // Auth endpoints
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    verify: '/auth/verify',
    refresh: '/auth/refresh',
    register: '/auth/register',
    changePassword: '/auth/change-password'
  },
  
  // Device endpoints
  device: {
    getStatus: '/device/status',
    updateStatus: '/device/status'
  },
  
  // Health check
  health: '/health'
};

// Response status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};

export default API_CONFIG;