

import httpClient from './httpClient.js';
import { API_ENDPOINTS } from './config.js';

class RfidApi {
  
  static async scan(rfidData) {
    try {
      console.log('RfidApi.scan:', rfidData);
      
      const response = await httpClient.post(API_ENDPOINTS.rfid.scan, rfidData);
      
      return {
        success: true,
        data: response.data || response,
        message: 'RFID scan berhasil'
      };
    } catch (error) {
      console.error('RfidApi.scan error:', error);
      return {
        success: false,
        message: error.message || 'Gagal scan RFID',
        data: null
      };
    }
  }

  
  static async startRealtimeScan(deviceId) {
    try {
      console.log('RfidApi.startRealtimeScan:', deviceId);
      
      const response = await httpClient.post(`/rfid/devices/${deviceId}/realtime-mode`, { 
        isActive: true 
      });
      
      return {
        success: true,
        data: response.data || response,
        message: 'Realtime scan mode activated'
      };
    } catch (error) {
      console.error('RfidApi.startRealtimeScan error:', error);
      return {
        success: false,
        message: error.message || 'Gagal mengaktifkan realtime scan mode',
        data: null
      };
    }
  }

  
  static async stopRealtimeScan(deviceId) {
    try {
      console.log('RfidApi.stopRealtimeScan:', deviceId);
      
      const response = await httpClient.post(`/rfid/devices/${deviceId}/realtime-mode`, { 
        isActive: false 
      });
      
      return {
        success: true,
        data: response.data || response,
        message: 'Realtime scan mode deactivated'
      };
    } catch (error) {
      console.error('RfidApi.stopRealtimeScan error:', error);
      return {
        success: false,
        message: error.message || 'Gagal menonaktifkan realtime scan mode',
        data: null
      };
    }
  }

  
  static async getLatestScans(limit = 10) {
    try {
      console.log('RfidApi.getLatestScans');
      
      const response = await httpClient.get(API_ENDPOINTS.rfid.getLatestScans);
      
      return {
        success: true,
        data: response.data || response || []
      };
    } catch (error) {
      console.error('RfidApi.getLatestScans error:', error);
      return {
        success: false,
        message: error.message || 'Gagal mengambil data scan terbaru',
        data: []
      };
    }
  }

  
  static async getUnknownScans() {
    try {
      console.log('RfidApi.getUnknownScans');
      
      const response = await httpClient.get(API_ENDPOINTS.rfid.getUnknownScans);
      
      return {
        success: true,
        data: response.data || response || []
      };
    } catch (error) {
      console.error('RfidApi.getUnknownScans error:', error);
      return {
        success: false,
        message: error.message || 'Gagal mengambil data scan tidak dikenal',
        data: []
      };
    }
  }











  
  static async toggleRegistrationMode(deviceId, isActive) {
    try {
      console.log('RfidApi.toggleRegistrationMode:', { deviceId, isActive });
      
      const response = await httpClient.post(
        `/rfid/devices/${deviceId}/registration-mode`,
        { isActive }
      );
      
      return {
        success: true,
        data: response.data || response,
        message: `Registration mode ${isActive ? 'activated' : 'deactivated'}`
      };
    } catch (error) {
      console.error('RfidApi.toggleRegistrationMode error:', error);
      return {
        success: false,
        message: error.message || 'Gagal mengubah registration mode',
        data: null
      };
    }
  }

  
  static async getDeviceStatus(deviceId) {
    try {
      console.log('RfidApi.getDeviceStatus:', deviceId);
      
      const response = await httpClient.get(API_ENDPOINTS.rfid.getDeviceStatus(deviceId));
      
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('RfidApi.getDeviceStatus error:', error);
      return {
        success: false,
        message: error.message || 'Gagal mengambil status device',
        data: null
      };
    }
  }

  
  static async deviceHeartbeat(deviceId, heartbeatData) {
    try {
      console.log('RfidApi.deviceHeartbeat:', deviceId, heartbeatData);
      
      const response = await httpClient.post(API_ENDPOINTS.rfid.deviceHeartbeat(deviceId), heartbeatData);
      
      return {
        success: true,
        data: response.data || response,
        message: 'Heartbeat berhasil dikirim'
      };
    } catch (error) {
      console.error('RfidApi.deviceHeartbeat error:', error);
      return {
        success: false,
        message: error.message || 'Gagal mengirim heartbeat',
        data: null
      };
    }
  }
}

export default RfidApi;
