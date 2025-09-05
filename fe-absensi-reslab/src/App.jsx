import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext.jsx'
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
        {/* Route tanpa layout */}
        <Route path="/" element={<LoginPage />} />

        {/* Route dengan MainLayout */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/anggota" element={<AnggotaPage />} />
          <Route path="/anggota/tambah-anggota" element={<TambahAnggota />} />
          <Route path="/anggota/edit-anggota/:id" element={<EditAnggota />} />
          <Route path="/absensi" element={<AbsensiPage />} />
          <Route path="/laporan" element={<LaporanPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}