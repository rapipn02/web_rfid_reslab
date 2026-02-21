# Sistem Absensi RESLAB

Sistem absensi berbasis RFID untuk Robotic and Embedded System Laboratory, Teknik Komputer. Aplikasi web modern yang dibangun dengan React.js untuk mengelola kehadiran anggota laboratorium.

## 🚀 Fitur Utama

### ✅ Fitur yang Sudah Diimplementasikan

#### 🔐 **Authentication**
- Login dengan validasi email dan password
- Demo credentials untuk testing
- Session management
- Form validation yang komprehensif

#### 📊 **Dashboard**
- Statistik kehadiran real-time (Total & Hari Ini)
- Grafik kehadiran bulanan menggunakan Recharts
- Ringkasan absensi terbaru dengan search dan pagination
- Auto-update data saat ada perubahan

#### 👥 **Manajemen Anggota**
- **Create**: Tambah anggota baru dengan validasi lengkap
- **Read**: Lihat daftar anggota dengan search dan pagination
- **Update**: Edit data anggota existing
- **Delete**: Hapus anggota dengan konfirmasi modal
- Validasi NIM dan RFID ID unik
- RFID scanner simulation
- Notifikasi real-time untuk setiap aksi

#### 📝 **Absensi**
- Tampilan data absensi dengan filter canggih
- Filter berdasarkan tanggal dan status
- Search multi-field (nama, tanggal, status)
- Statistik kehadiran dalam periode tertentu
- Pagination yang responsif

#### 📈 **Laporan**
- Filter laporan berdasarkan rentang tanggal
- Export ke multiple format (CSV, TXT, JSON)
- Statistik dengan persentase kehadiran
- Preview data sebelum export
- Clear filter functionality

### 🎨 **UI/UX Improvements**
- **Responsive Design**: Optimal di semua ukuran layar
- **Loading States**: Feedback visual untuk semua aksi
- **Error Handling**: Validasi form yang comprehensive
- **Notifications**: Alert system untuk feedback user
- **Consistent Styling**: Design system yang seragam
- **Accessibility**: Focus states dan keyboard navigation

## 🛠 Struktur File yang Diperbaiki

### **Data Management**
- `src/data/dataStore.js` - Global state management dengan subscriber pattern
- `src/utils/utils.js` - Utility functions untuk berbagai kebutuhan

### **Pages (Upgraded)**
- `src/pages/LoginPage.jsx` - Enhanced dengan validasi dan demo credentials
- `src/pages/DashboardPage.jsx` - Real-time stats dan interactive charts
- `src/pages/AnggotaPage.jsx` - CRUD operations dengan confirmations
- `src/pages/TambahAnggotaPage.jsx` - Advanced form validation
- `src/pages/EditAnggotaPage.jsx` - Change detection dan validation
- `src/pages/AbsensiPage.jsx` - Advanced filtering dan search
- `src/pages/LaporanPage.jsx` - Multiple export formats dan analytics

### **Components**
- `src/components/common/index.jsx` - Reusable UI components



## 📊 Data Structure

### **Members**
```javascript
{
  id: number,
  nama: string,
  nim: string,
  idRfid: string
}
```

### **Attendance**
```javascript
{
  id: number,
  memberId: number,
  nama: string,
  tanggal: string, // YYYY-MM-DD
  jam: string,     // HH:MM or '-'
  status: string   // 'Hadir' | 'Tidak Hadir'
}
```

## 🔧 Fitur Teknis

### **State Management**
- Centralized data store dengan subscriber pattern
- Real-time updates across all components
- Consistent data synchronization

### **Validation System**
- Email format validation
- NIM uniqueness check
- RFID ID uniqueness check
- Form field requirements
- Real-time error feedback

### **Search & Filter**
- Multi-field search functionality
- Date range filtering
- Status filtering
- Debounced search for performance
- Filter state persistence

### **Export System**
- CSV export dengan proper formatting
- JSON export dengan metadata
- TXT report dengan statistics
- Automatic filename dengan timestamp

### **Pagination**
- Smart pagination dengan ellipsis
- Responsive page size
- Page state management
- Jump to page functionality

## 📱 Responsive Design

- **Mobile First**: Optimized untuk mobile devices
- **Tablet Support**: Layout yang adaptif untuk tablet
- **Desktop Enhanced**: Full features untuk desktop
- **Touch Friendly**: Button sizes yang optimal untuk touch

## 🎯 User Experience

### **Loading States**
- Button loading indicators
- Form submission feedback
- RFID scanning simulation
- Data fetching states

### **Error Handling**
- Comprehensive form validation
- User-friendly error messages
- Graceful error recovery
- Validation on input change

### **Notifications**
- Success notifications untuk aksi berhasil
- Error notifications untuk masalah
- Auto-dismiss notifications
- Manual close option

## 🔄 Data Flow

1. **DataStore** sebagai single source of truth
2. **Subscriber Pattern** untuk real-time updates
3. **Form Validation** sebelum data manipulation
4. **Notification System** untuk user feedback
5. **State Synchronization** across components

## 📦 Dependencies

### **Core**
- React 18+
- React Router DOM
- Lucide React (icons)

### **Charts & Visualization**
- Recharts untuk grafik kehadiran

### **Styling**
- Tailwind CSS untuk styling
- Responsive design utilities

## 🎨 Design System

### **Colors**
- Primary: Orange (#f97316)
- Success: Green (#22c55e)
- Error: Red (#ef4444)
- Warning: Yellow (#eab308)
- Info: Blue (#3b82f6)

### **Typography**
- Headers: Font bold dengan hierarchy yang jelas
- Body: Font medium untuk readability
- Captions: Font small untuk metadata

### **Spacing**
- Consistent margin dan padding
- Grid system untuk layout
- Responsive breakpoints

## 🔒 Security Considerations

- Input sanitization
- XSS prevention
- CSRF protection (untuk production)
- Data validation di semua level
- Secure password handling

## 📝 Code Quality

- **Consistent Naming**: camelCase untuk variables/functions
- **Component Structure**: Reusable dan modular
- **Error Boundaries**: Graceful error handling
- **Performance**: Optimized rendering dan state updates
- **Accessibility**: ARIA labels dan keyboard navigation

## 🚀 Getting Started

1. Clone repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Login dengan demo credentials
5. Explore semua fitur yang tersedia

## 📚 Usage Guide

### **Login**
1. Gunakan email: `admin@reslab.com`
2. Password: `admin123`
3. Klik "Log in"

### **Mengelola Anggota**
1. Navigate ke halaman "Anggota"
2. Klik "Tambah Anggota" untuk menambah
3. Gunakan "Edit" untuk mengubah data
4. Gunakan "Hapus" dengan konfirmasi untuk menghapus

### **Melihat Absensi**
1. Navigate ke halaman "Absensi"
2. Gunakan filter untuk menyaring data
3. Search untuk mencari data specific

### **Generate Laporan**
1. Navigate ke halaman "Laporan"
2. Set rentang tanggal (opsional)
3. Klik "Preview" untuk melihat data
4. Klik "Export" dan pilih format
