/**
 * Auth Hook
 * Hook untuk menggunakan AuthContext
 */

import { useContext } from 'react';
import AuthContext from '../contexts/AuthContext.jsx';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
