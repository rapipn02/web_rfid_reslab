/**
 * RFID API Service
 * Service untuk handle RFID scanning dengan backend
 */

import httpClient from './httpClient.js';
import { API_ENDPOINTS } from './config.js';

class RfidApi {
  /**
   * Scan RFID
   */
  static async scan(rfidData) {
    try {
      console.log('📡 RfidApi.scan:', rfidData);
      
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

  /**
   * Get latest RFID scans
   */
  static async getLatestScans() {
    try {
      console.log('📡 RfidApi.getLatestScans');
      
      const response = await httpClient.get(API_ENDPOINTS.rfid.getLatestScans);
      
      return {
        success: true,
        data: response.data || response || []
      };
    } catch (error) {
      console.error('RfidApi.getLatestScans error:', error);
      return {
        success: false,
        message: error.message || 'Gagal mengambil data scan RFID',
        data: []
      };
    }
  }

  /**
   * Get unknown RFID scans
   */
  static async getUnknownScans() {
    try {
      console.log('📡 RfidApi.getUnknownScans');
      
      const response = await httpClient.get(API_ENDPOINTS.rfid.getUnknownScans);
      
      return {
        success: true,
        data: response.data || response || []
      };
    } catch (error) {
      console.error('RfidApi.getUnknownScans error:', error);
      return {
        success: false,
        message: error.message || 'Gagal mengambil data scan RFID tidak dikenal',
        data: []
      };
    }
  }

  /**
   * Get device status
   */
  static async getDeviceStatus(deviceId) {
    try {
      console.log('📡 RfidApi.getDeviceStatus:', deviceId);
      
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

  /**
   * Send device heartbeat
   */
  static async deviceHeartbeat(deviceId, heartbeatData) {
    try {
      console.log('📡 RfidApi.deviceHeartbeat:', deviceId, heartbeatData);
      
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
