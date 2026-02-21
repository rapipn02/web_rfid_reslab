import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState, useEffect } from 'react';


const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, isAuthenticated, loading, checkAuthStatus } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        await checkAuthStatus();
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setIsChecking(false);
      }
    };

    if (loading) {
      verifyAuth();
    } else {
      setIsChecking(false);
    }
  }, [loading, checkAuthStatus]);

  
  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memverifikasi akses...</p>
        </div>
      </div>
    );
  }

  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  
  if (requiredRole && user?.role !== requiredRole && user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl text-red-500 mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h1>
          <p className="text-gray-600 mb-4">
            Anda tidak memiliki izin untuk mengakses halaman ini.
          </p>
          <p className="text-sm text-gray-500">
            Role yang dibutuhkan: <span className="font-medium">{requiredRole}</span>
            <br />
            Role Anda: <span className="font-medium">{user?.role || 'Tidak diketahui'}</span>
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  
  return children;
};


const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};


const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Akses Ditolak</h1>
          <p className="text-gray-600 mb-4">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
          <button 
            onClick={() => window.history.back()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export { ProtectedRoute, PublicRoute, AdminRoute };
