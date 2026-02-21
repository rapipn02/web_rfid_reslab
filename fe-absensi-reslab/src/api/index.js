


import AuthApi from './authApi.js';
import DashboardApi from './dashboardApi.js';
import MembersApi from './membersApi.js';
import AttendanceApi from './attendanceApi.js';
import RfidApi from './rfidApi.js';


export { default as httpClient } from './httpClient.js';
export { API_CONFIG, API_ENDPOINTS, HTTP_STATUS } from './config.js';


export { AuthApi, DashboardApi, MembersApi, AttendanceApi, RfidApi };


export { default as storeManager } from './storeManager.js';


export { 
  ApiError, 
  NetworkError, 
  ValidationError, 
  handleApiError,
  isNetworkError,
  isValidationError 
} from './errorHandler.js';


const api = {
  dashboard: DashboardApi,
  members: MembersApi,
  attendance: AttendanceApi,
  rfid: RfidApi
};

export default api;