/**
 * Authentication API Service
 * Service untuk handle authentication dengan backend
 */

import httpClient from './httpClient.js';
import { API_ENDPOINTS } from './config.js';

class AuthApi {
  /**
   * Login user dengan email dan password
   */
  static async login(credentials) {
    try {
      console.log('🔐 AuthApi.login:', credentials);
      
      const response = await httpClient.post(API_ENDPOINTS.auth.login, {
        email: credentials.email,
        password: credentials.password
      });

      // Simpan token ke localStorage
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      return {
        success: true,
        data: response.data,
        message: response.message || 'Login berhasil'
      };
    } catch (error) {
      console.error('❌ AuthApi.login error:', error);
      return {
        success: false,
        data: null,
        message: error.message || 'Login gagal. Silakan coba lagi.'
      };
    }
  }

  /**
   * Logout user
   */
  static async logout() {
    try {
      const token = localStorage.getItem('token');
      
      if (token) {
        await httpClient.post(API_ENDPOINTS.auth.logout);
      }

      // Hapus token dari localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      return {
        success: true,
        message: 'Logout berhasil'
      };
    } catch (error) {
      console.error('❌ AuthApi.logout error:', error);
      
      // Tetap hapus token meski API call gagal
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      return {
        success: true,
        message: 'Logout berhasil'
      };
    }
  }

  /**
   * Verify token
   */
  static async verifyToken() {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return {
          success: false,
          message: 'Token tidak ditemukan'
        };
      }

      const response = await httpClient.get(API_ENDPOINTS.auth.verify);

      return {
        success: true,
        data: response.data,
        message: 'Token valid'
      };
    } catch (error) {
      console.error('❌ AuthApi.verifyToken error:', error);
      
      // Hapus token jika tidak valid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      return {
        success: false,
        message: 'Token tidak valid'
      };
    }
  }

  /**
   * Get current user dari localStorage
   */
  static getCurrentUser() {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('❌ AuthApi.getCurrentUser error:', error);
      return null;
    }
  }

  /**
   * Check apakah user sudah login
   */
  static isAuthenticated() {
    const token = localStorage.getItem('token');
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  /**
   * Get token dari localStorage
   */
  static getToken() {
    return localStorage.getItem('token');
  }

  /**
   * Register user baru (admin only)
   */
  static async register(userData) {
    try {
      const response = await httpClient.post(API_ENDPOINTS.auth.register, userData);

      return {
        success: true,
        data: response.data,
        message: response.message || 'Registrasi berhasil'
      };
    } catch (error) {
      console.error('❌ AuthApi.register error:', error);
      return {
        success: false,
        data: null,
        message: error.message || 'Registrasi gagal. Silakan coba lagi.'
      };
    }
  }

  /**
   * Change password
   */
  static async changePassword(passwordData) {
    try {
      const response = await httpClient.post(API_ENDPOINTS.auth.changePassword, passwordData);

      return {
        success: true,
        data: response.data,
        message: response.message || 'Password berhasil diubah'
      };
    } catch (error) {
      console.error('❌ AuthApi.changePassword error:', error);
      return {
        success: false,
        data: null,
        message: error.message || 'Gagal mengubah password. Silakan coba lagi.'
      };
    }
  }
}

export default AuthApi;
