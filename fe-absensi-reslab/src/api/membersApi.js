/**
 * Members API Service
 * Service untuk handle members/anggota dengan backend
 */

import httpClient from './httpClient.js';
import { API_ENDPOINTS } from './config.js';

class MembersApi {
  /**
   * Get all members
   */
  static async getAll() {
    try {
      console.log('👥 MembersApi.getAll');
      console.log('👥 Endpoint URL:', API_ENDPOINTS.members.getAll);
      
      const response = await httpClient.get(API_ENDPOINTS.members.getAll);
      
      console.log('👥 MembersApi.getAll response:', response);
      
      // Handle different response formats
      let members = [];
      if (response.data && response.data.members) {
        // Backend returns { data: { members: [...] } }
        members = response.data.members;
      } else if (response.data && Array.isArray(response.data)) {
        // Backend returns { data: [...] }
        members = response.data;
      } else if (Array.isArray(response)) {
        // Direct array response
        members = response;
      }
      
      console.log('👥 Processed members data:', members);
      
      return {
        success: true,
        data: members
      };
    } catch (error) {
      console.error('MembersApi.getAll error:', error);
      return {
        success: false,
        message: error.message || 'Gagal mengambil data anggota',
        data: []
      };
    }
  }

  /**
   * Get member by ID
   */
  static async getById(id) {
    try {
      console.log('👥 MembersApi.getById:', id);
      
      const response = await httpClient.get(API_ENDPOINTS.members.getById(id));
      
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('MembersApi.getById error:', error);
      return {
        success: false,
        message: error.message || 'Gagal mengambil data anggota',
        data: null
      };
    }
  }

  /**
   * Create new member
   */
  static async create(memberData) {
    try {
      console.log('👥 MembersApi.create:', memberData);
      
      const response = await httpClient.post(API_ENDPOINTS.members.create, memberData);
      
      return {
        success: true,
        data: response.data || response,
        message: 'Anggota berhasil ditambahkan'
      };
    } catch (error) {
      console.error('MembersApi.create error:', error);
      return {
        success: false,
        message: error.message || 'Gagal menambahkan anggota',
        data: null
      };
    }
  }

  /**
   * Update member
   */
  static async update(id, memberData) {
    try {
      console.log('👥 MembersApi.update:', id, memberData);
      
      const response = await httpClient.put(API_ENDPOINTS.members.update(id), memberData);
      
      return {
        success: true,
        data: response.data || response,
        message: 'Anggota berhasil diupdate'
      };
    } catch (error) {
      console.error('MembersApi.update error:', error);
      return {
        success: false,
        message: error.message || 'Gagal mengupdate anggota',
        data: null
      };
    }
  }

  /**
   * Delete member
   */
  static async delete(id) {
    try {
      console.log('👥 MembersApi.delete:', id);
      
      await httpClient.delete(API_ENDPOINTS.members.delete(id));
      
      return {
        success: true,
        message: 'Anggota berhasil dihapus'
      };
    } catch (error) {
      console.error('MembersApi.delete error:', error);
      return {
        success: false,
        message: error.message || 'Gagal menghapus anggota'
      };
    }
  }
}

export default MembersApi;
