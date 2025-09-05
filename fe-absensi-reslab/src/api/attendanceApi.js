/**
 * Attendance API Service
 * Service untuk handle attendance/absensi dengan backend
 */

import httpClient from './httpClient.js';
import { API_ENDPOINTS } from './config.js';

class AttendanceApi {
  /**
   * Get all attendance records
   */
  static async getAll() {
    try {
      console.log('📋 AttendanceApi.getAll');
      
      const response = await httpClient.get(API_ENDPOINTS.attendance.getAll);
      
      console.log('📋 AttendanceApi.getAll response:', response);
      
      // Backend returns { attendance, count }, we need attendance array
      const attendanceData = response.data?.attendance || response.attendance || response.data || [];
      
      return {
        success: true,
        data: attendanceData
      };
    } catch (error) {
      console.error('AttendanceApi.getAll error:', error);
      return {
        success: false,
        message: error.message || 'Gagal mengambil data absensi',
        data: []
      };
    }
  }

  /**
   * Get attendance by ID
   */
  static async getById(id) {
    try {
      console.log('📋 AttendanceApi.getById:', id);
      
      const response = await httpClient.get(API_ENDPOINTS.attendance.getById(id));
      
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('AttendanceApi.getById error:', error);
      return {
        success: false,
        message: error.message || 'Gagal mengambil data absensi',
        data: null
      };
    }
  }

  /**
   * Get attendance by member ID
   */
  static async getByMember(memberId) {
    try {
      console.log('📋 AttendanceApi.getByMember:', memberId);
      
      const response = await httpClient.get(API_ENDPOINTS.attendance.getByMember(memberId));
      
      return {
        success: true,
        data: response.data || response || []
      };
    } catch (error) {
      console.error('AttendanceApi.getByMember error:', error);
      return {
        success: false,
        message: error.message || 'Gagal mengambil data absensi member',
        data: []
      };
    }
  }

  /**
   * Get today's attendance
   */
  static async getToday() {
    try {
      console.log('📋 AttendanceApi.getToday');
      
      const response = await httpClient.get(API_ENDPOINTS.attendance.getToday);
      
      console.log('📋 AttendanceApi.getToday response:', response);
      
      // Backend returns { date, attendance, stats }, we need attendance array
      const attendanceData = response.data?.attendance || response.attendance || response.data || [];
      
      return {
        success: true,
        data: attendanceData
      };
    } catch (error) {
      console.error('AttendanceApi.getToday error:', error);
      return {
        success: false,
        message: error.message || 'Gagal mengambil data absensi hari ini',
        data: []
      };
    }
  }

  /**
   * Get attendance statistics
   */
  static async getStats() {
    try {
      console.log('📊 AttendanceApi.getStats');
      
      const response = await httpClient.get(API_ENDPOINTS.attendance.getStats);
      
      return {
        success: true,
        data: response.data || response || {
          hadir: 0,
          tidakHadir: 0,
          todayHadir: 0,
          todayTidakHadir: 0
        }
      };
    } catch (error) {
      console.error('AttendanceApi.getStats error:', error);
      return {
        success: false,
        message: error.message || 'Gagal mengambil statistik absensi',
        data: {
          hadir: 0,
          tidakHadir: 0,
          todayHadir: 0,
          todayTidakHadir: 0
        }
      };
    }
  }

  /**
   * Create new attendance record
   */
  static async create(attendanceData) {
    try {
      console.log('📋 AttendanceApi.create:', attendanceData);
      
      const response = await httpClient.post(API_ENDPOINTS.attendance.create, attendanceData);
      
      return {
        success: true,
        data: response.data || response,
        message: 'Absensi berhasil dicatat'
      };
    } catch (error) {
      console.error('AttendanceApi.create error:', error);
      return {
        success: false,
        message: error.message || 'Gagal mencatat absensi',
        data: null
      };
    }
  }

  /**
   * Update attendance record
   */
  static async update(id, attendanceData) {
    try {
      console.log('📋 AttendanceApi.update:', id, attendanceData);
      
      const response = await httpClient.put(API_ENDPOINTS.attendance.update(id), attendanceData);
      
      return {
        success: true,
        data: response.data || response,
        message: 'Absensi berhasil diupdate'
      };
    } catch (error) {
      console.error('AttendanceApi.update error:', error);
      return {
        success: false,
        message: error.message || 'Gagal mengupdate absensi',
        data: null
      };
    }
  }

  /**
   * Delete attendance record
   */
  static async delete(id) {
    try {
      console.log('📋 AttendanceApi.delete:', id);
      
      await httpClient.delete(API_ENDPOINTS.attendance.delete(id));
      
      return {
        success: true,
        message: 'Absensi berhasil dihapus'
      };
    } catch (error) {
      console.error('AttendanceApi.delete error:', error);
      return {
        success: false,
        message: error.message || 'Gagal menghapus absensi'
      };
    }
  }
}

export default AttendanceApi;
