

import MembersApi from './membersApi.js';
import AttendanceApi from './attendanceApi.js';

class StoreManager {
  constructor() {
    this.cache = {
      members: [],
      attendance: [],
      attendanceStats: null,
      lastUpdated: {
        members: null,
        attendance: null,
        attendanceStats: null
      }
    };

    this.subscribers = new Set();
    this.isLoading = {
      members: false,
      attendance: false,
      attendanceStats: false
    };
    this.errors = {
      members: null,
      attendance: null,
      attendanceStats: null
    };

    
    this.CACHE_DURATION = 5 * 60 * 1000;
  }

  
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  
  notify(dataType = null) {
    this.subscribers.forEach(callback => {
      try {
        callback(dataType);
      } catch (error) {
        console.error('Error in subscriber callback:', error);
      }
    });
  }

  
  isCacheValid(dataType) {
    const lastUpdated = this.cache.lastUpdated[dataType];
    if (!lastUpdated) return false;
    return (Date.now() - lastUpdated) < this.CACHE_DURATION;
  }

  
  setLoading(dataType, isLoading) {
    this.isLoading[dataType] = isLoading;
  }

  
  setError(dataType, error) {
    this.errors[dataType] = error;
  }

  
  clearError(dataType) {
    this.errors[dataType] = null;
  }

  
  async getMembers(forceRefresh = false) {
    if (!forceRefresh && this.isCacheValid('members')) {
      return this.cache.members;
    }

    if (this.isLoading.members) {
      return this.cache.members;
    }

    try {
      this.setLoading('members', true);
      this.clearError('members');

      const response = await MembersApi.getAll();
      
      this.cache.members = response.data || [];
      this.cache.lastUpdated.members = Date.now();
      
      this.setLoading('members', false);
      this.notify('members');
      
      return this.cache.members;
    } catch (error) {
      this.setError('members', error);
      this.setLoading('members', false);
      console.error('Error fetching members:', error);
      return this.cache.members; 
    }
  }

  
  async getAttendance(forceRefresh = false) {
    if (!forceRefresh && this.isCacheValid('attendance')) {
      return this.cache.attendance;
    }

    if (this.isLoading.attendance) {
      return this.cache.attendance;
    }

    try {
      this.setLoading('attendance', true);
      this.clearError('attendance');

      const response = await AttendanceApi.getAll();
      
      this.cache.attendance = response.data || [];
      this.cache.lastUpdated.attendance = Date.now();
      
      this.setLoading('attendance', false);
      this.notify('attendance');
      
      return this.cache.attendance;
    } catch (error) {
      this.setError('attendance', error);
      this.setLoading('attendance', false);
      console.error('Error fetching attendance:', error);
      return this.cache.attendance; 
    }
  }

  
  async getAttendanceStats(forceRefresh = false) {
    if (!forceRefresh && this.isCacheValid('attendanceStats')) {
      return this.cache.attendanceStats;
    }

    if (this.isLoading.attendanceStats) {
      return this.cache.attendanceStats;
    }

    try {
      this.setLoading('attendanceStats', true);
      this.clearError('attendanceStats');

      const response = await AttendanceApi.getStats();
      
      this.cache.attendanceStats = response.data || {
        hadir: 0,
        tidakHadir: 0,
        todayHadir: 0,
        todayTidakHadir: 0
      };
      this.cache.lastUpdated.attendanceStats = Date.now();
      
      this.setLoading('attendanceStats', false);
      this.notify('attendanceStats');
      
      return this.cache.attendanceStats;
    } catch (error) {
      this.setError('attendanceStats', error);
      this.setLoading('attendanceStats', false);
      console.error('Error fetching attendance stats:', error);
      return this.cache.attendanceStats; 
    }
  }

  
  getChartData() {
    const attendance = this.cache.attendance;
    if (!attendance || attendance.length === 0) {
      return [];
    }

    
    const groupedByDate = attendance.reduce((acc, record) => {
      const date = record.tanggal;
      if (!acc[date]) {
        acc[date] = { tanggal: date, hadir: 0, tidakHadir: 0 };
      }
      
      if (record.status === 'hadir') {
        acc[date].hadir++;
      } else {
        acc[date].tidakHadir++;
      }
      
      return acc;
    }, {});

    
    return Object.values(groupedByDate)
      .sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal))
      .slice(-7); 
  }

  
  async addMember(memberData) {
    try {
      const response = await MembersApi.create(memberData);
      
      if (response.success) {
        
        this.cache.members.push(response.data);
        this.cache.lastUpdated.members = Date.now();
        this.notify('members');
      }
      
      return response;
    } catch (error) {
      console.error('Error adding member:', error);
      throw error;
    }
  }

  
  async updateMember(id, memberData) {
    try {
      const response = await MembersApi.update(id, memberData);
      
      if (response.success) {
        
        const index = this.cache.members.findIndex(m => m.id === id);
        if (index !== -1) {
          this.cache.members[index] = response.data;
          this.cache.lastUpdated.members = Date.now();
          this.notify('members');
        }
      }
      
      return response;
    } catch (error) {
      console.error('Error updating member:', error);
      throw error;
    }
  }

  
  async deleteMember(id) {
    try {
      const response = await MembersApi.delete(id);
      
      if (response.success) {
        
        this.cache.members = this.cache.members.filter(m => m.id !== id);
        this.cache.lastUpdated.members = Date.now();
        this.notify('members');
      }
      
      return response;
    } catch (error) {
      console.error('Error deleting member:', error);
      throw error;
    }
  }

  
  async refreshAll() {
    await Promise.all([
      this.getMembers(true),
      this.getAttendance(true),
      this.getAttendanceStats(true)
    ]);
  }

  
  clearCache() {
    this.cache = {
      members: [],
      attendance: [],
      attendanceStats: null,
      lastUpdated: {
        members: null,
        attendance: null,
        attendanceStats: null
      }
    };
    this.notify();
  }
}


const storeManager = new StoreManager();
export default storeManager;
