

import React, { createContext, useState, useEffect } from 'react';
import { AuthApi } from '../api/index.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        if (AuthApi.isAuthenticated()) {
          const currentUser = AuthApi.getCurrentUser();
          
          
          const result = await AuthApi.verifyToken();
          
          if (result.success) {
            setUser(currentUser);
            setIsAuthenticated(true);
          } else {
            
            clearAuthState();
          }
        } else {
          clearAuthState();
        }
      } catch (error) {
        console.error('Auth check error:', error);
        clearAuthState();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (credentials) => {
    try {
      setIsLoading(true);
      const result = await AuthApi.login(credentials);
      
      if (result.success) {
        setUser(result.data.user);
        setIsAuthenticated(true);
        return { success: true, message: result.message };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Terjadi kesalahan saat login' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      if (AuthApi.logout) {
        await AuthApi.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      
      clearAuthState();
      setIsLoading(false);
      
      
      window.location.href = '/login';
    }
  };

  const clearAuthState = () => {
    setUser(null);
    setIsAuthenticated(false);
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  };

  const checkAuthStatus = async () => {
    try {
      if (AuthApi.isAuthenticated()) {
        const currentUser = AuthApi.getCurrentUser();
        
        
        const result = await AuthApi.verifyToken();
        
        if (result.success) {
          setUser(currentUser);
          setIsAuthenticated(true);
          return true;
        } else {
          
          clearAuthState();
          return false;
        }
      } else {
        clearAuthState();
        return false;
      }
    } catch (error) {
      console.error('Auth check error:', error);
      clearAuthState();
      return false;
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading: isLoading,  
    isLoading,
    login,
    logout,
    checkAuthStatus, 
    
    hasRole: (role) => user?.role === role,
    isAdmin: () => user?.role === 'admin',
    isMember: () => user?.role === 'member'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
