/**
 * Dashboard API Service
 * Service untuk mengakses API dashboard
 */

import httpClient from './httpClient.js';
import { API_ENDPOINTS } from './config.js';

class DashboardApi {
  /**
   * Get dashboard data (stats, recent attendance, chart data)
   */
  static async getDashboardData() {
    try {
      const response = await httpClient.get('/dashboard');
      return response;
    } catch (error) {
      console.error('Dashboard API - Get dashboard data error:', error);
      throw error;
    }
  }

  /**
   * Get attendance summary untuk periode tertentu
   */
  static async getAttendanceSummary(startDate = null, endDate = null) {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const response = await httpClient.get('/dashboard/summary', params);
      return response;
    } catch (error) {
      console.error('Dashboard API - Get attendance summary error:', error);
      throw error;
    }
  }

  /**
   * Get quick stats untuk widget dashboard
   */
  static async getQuickStats() {
    try {
      const response = await this.getDashboardData();
      return response.data?.stats || {};
    } catch (error) {
      console.error('Dashboard API - Get quick stats error:', error);
      throw error;
    }
  }

  /**
   * Get chart data untuk dashboard
   */
  static async getChartData() {
    try {
      const response = await this.getDashboardData();
      return response.data?.chartData || [];
    } catch (error) {
      console.error('Dashboard API - Get chart data error:', error);
      throw error;
    }
  }

  /**
   * Get chart data dengan filter periode
   */
  static async getChartDataWithFilter(period = 'weekly') {
    try {
      const response = await httpClient.get(`/dashboard/chart?period=${period}`);
      return response.data || {};
    } catch (error) {
      console.error('Dashboard API - Get chart data with filter error:', error);
      throw error;
    }
  }

  /**
   * Get recent attendance untuk dashboard
   */
  static async getRecentAttendance() {
    try {
      const response = await this.getDashboardData();
      return response.data?.recentAttendance || [];
    } catch (error) {
      console.error('Dashboard API - Get recent attendance error:', error);
      throw error;
    }
  }
}

export default DashboardApi;
