import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute.jsx'
import MainLayout from './layouts/MainLayout.jsx'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import AnggotaPage from './pages/AnggotaPage.jsx'
import TambahAnggota from './pages/TambahAnggotaPage.jsx'
import EditAnggota from './pages/EditAnggotaPage.jsx'
import AbsensiPage from './pages/AbsensiPage.jsx'
import LaporanPage from './pages/LaporanPage.jsx'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {}
        <Route 
          path="/" 
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } 
        />
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } 
        />

        {}
        <Route 
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/anggota" element={<AnggotaPage />} />
          <Route path="/anggota/tambah-anggota" element={<TambahAnggota />} />
          <Route path="/anggota/edit-anggota/:id" element={<EditAnggota />} />
          <Route path="/absensi" element={<AbsensiPage />} />
          <Route path="/laporan" element={<LaporanPage />} />
        </Route>

        {}
        <Route 
          path="*" 
          element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                <p className="text-gray-600 mb-4">Halaman tidak ditemukan</p>
                <a href="/" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                  Kembali ke Beranda
                </a>
              </div>
            </div>
          } 
        />
      </Routes>
    </AuthProvider>
  )
}