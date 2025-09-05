/**
 * API Index
 * Central export untuk semua API services dan utilities
 */

// Import services
import AuthApi from './authApi.js';
import DashboardApi from './dashboardApi.js';
import MembersApi from './membersApi.js';
import AttendanceApi from './attendanceApi.js';
import RfidApi from './rfidApi.js';

// Core
export { default as httpClient } from './httpClient.js';
export { API_CONFIG, API_ENDPOINTS, HTTP_STATUS } from './config.js';

// Services
export { AuthApi, DashboardApi, MembersApi, AttendanceApi, RfidApi };

// Store Management
export { default as storeManager } from './storeManager.js';

// Error Handling
export { 
  ApiError, 
  NetworkError, 
  ValidationError, 
  handleApiError,
  isNetworkError,
  isValidationError 
} from './errorHandler.js';

// Default exports untuk backward compatibility
const api = {
  dashboard: DashboardApi,
  members: MembersApi,
  attendance: AttendanceApi,
  rfid: RfidApi
};

export default api;