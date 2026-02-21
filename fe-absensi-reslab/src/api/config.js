


const config = {
  development: {
    baseURL: import.meta.env.VITE_API_URL || '',
    timeout: 10000,
    retries: 3,
    retryDelay: 1000
  },
  production: {
    baseURL: import.meta.env.VITE_API_URL || '',
    timeout: 15000,
    retries: 3,
    retryDelay: 2000
  }
};


const environment = import.meta.env.MODE || 'development';
const currentConfig = config[environment];


export const API_CONFIG = {
  ...currentConfig,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
};


export const API_ENDPOINTS = {
  
  dashboard: {
    getData: '/dashboard',
    getSummary: '/dashboard/summary'
  },
  
  
  attendance: {
    getAll: '/attendance',
    getById: (id) => `/attendance/${id}`,
    getByMember: (memberId) => `/attendance/member/${memberId}`,
    getToday: '/attendance/today',
    getTodayWithMembers: '/attendance/today-with-members',
    getStats: '/attendance/stats',
    create: '/attendance',
    update: (id) => `/attendance/${id}`,
    delete: (id) => `/attendance/${id}`,
    generateAbsent: '/attendance/generate-absent',
    autoCheckout: '/attendance/auto-checkout'
  },
  
  
  members: {
    getAll: '/members',
    getById: (id) => `/members/${id}`,
    create: '/members',
    update: (id) => `/members/${id}`,
    delete: (id) => `/members/${id}`
  },
  
  
  rfid: {
    scan: '/rfid/scan',
    scanInfo: '/rfid/scan-info',
    register: '/rfid/register',
    unregister: '/rfid/unregister',
    getRegistered: '/rfid/registered',
    getAll: '/rfid',
    getLatestScans: '/rfid/scans/latest',
    getUnknownScans: '/rfid/scans/unknown',
    getDeviceStatus: (deviceId) => `/rfid/device/${deviceId}/status`,
    deviceHeartbeat: (deviceId) => `/rfid/device/${deviceId}/heartbeat`
  },

  
  realtime: {
    getLatest: '/realtime/latest',
    getAll: '/realtime',
    stream: '/realtime/stream'
  },
  
  
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    verify: '/auth/verify',
    refresh: '/auth/refresh',
    register: '/auth/register',
    changePassword: '/auth/change-password'
  },
  
  
  device: {
    getStatus: '/device/status',
    updateStatus: '/device/status'
  },
  
  
  health: '/health'
};


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