/**
 * Authentication Context
 * Context untuk manage authentication state di seluruh aplikasi
 */

import React, { createContext, useState, useEffect } from 'react';
import { AuthApi } from '../api/index.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        if (AuthApi.isAuthenticated()) {
          const currentUser = AuthApi.getCurrentUser();
          
          // Verify token with backend
          const result = await AuthApi.verifyToken();
          
          if (result.success) {
            setUser(currentUser);
            setIsAuthenticated(true);
          } else {
            // Token tidak valid, clear auth state
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
      await AuthApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthState();
    }
  };

  const clearAuthState = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
