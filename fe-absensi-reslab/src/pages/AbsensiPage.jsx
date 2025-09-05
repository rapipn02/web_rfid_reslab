import React, { useState, useEffect } from 'react';
import { Search, User, ChevronDown, ChevronLeft, ChevronRight, Filter, RotateCcw } from 'lucide-react';
import { AttendanceApi, MembersApi } from '../api/index.js';

export default function AbsensiPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [attendanceData, setAttendanceData] = useState([]);
    const [allMembers, setAllMembers] = useState([]);
    const [filterStatus, setFilterStatus] = useState('');
    const [showFilter, setShowFilter] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null); // Track last update time

    const itemsPerPage = 8;

    // Fungsi untuk menghitung durasi dalam menit
    const calculateDurationInMinutes = (jamDatang, jamPulang) => {
        if (!jamDatang || !jamPulang || jamDatang === '-' || jamPulang === '-') {
            return 0;
        }

        try {
            // Parse jam datang dan jam pulang (format: HH:mm)
            const [jamDatangHour, jamDatangMinute] = jamDatang.split(':').map(num => parseInt(num));
            const [jamPulangHour, jamPulangMinute] = jamPulang.split(':').map(num => parseInt(num));

            // Convert ke total menit
            const dataangTotalMinutes = jamDatangHour * 60 + jamDatangMinute;
            const pulangTotalMinutes = jamPulangHour * 60 + jamPulangMinute;

            // Hitung selisih dalam menit
            let durationMinutes = pulangTotalMinutes - dataangTotalMinutes;

            // Jika hasil negatif, berarti melewati tengah malam
            if (durationMinutes < 0) {
                durationMinutes += 24 * 60; // Tambah 24 jam
            }

            return durationMinutes;
        } catch {
            return 0;
        }
    };

    // Fungsi untuk validasi apakah durasi memenuhi syarat minimal 1 jam
    const isValidDuration = (jamDatang, jamPulang) => {
        const durationMinutes = calculateDurationInMinutes(jamDatang, jamPulang);
        return durationMinutes >= 60; // Minimal 60 menit (1 jam)
    };

    // Fungsi untuk menentukan status absensi berdasarkan waktu dan durasi
    // Fungsi untuk menentukan status absensi berdasarkan waktu dan durasi
    const getAttendanceStatus = (attendanceRecord) => {
        const now = new Date();
        const currentHour = now.getHours();
        
        // Jika ada record absensi, cek validitas durasi
        if (attendanceRecord) {
            const jamDatang = attendanceRecord.jamDatang;
            const jamPulang = attendanceRecord.jamPulang;
            
            // Jika sudah ada jam datang dan jam pulang
            if (jamDatang && jamPulang && jamDatang !== '-' && jamPulang !== '-') {
                // Validasi durasi minimal 1 jam
                if (isValidDuration(jamDatang, jamPulang)) {
                    return 'Hadir';
                } else {
                    // Jika durasi kurang dari 1 jam, dianggap tidak hadir (ditolak)
                    return 'Tidak Hadir';
                }
            }
            // Jika hanya ada jam datang tapi belum ada jam pulang
            else if (jamDatang && jamDatang !== '-') {
                return 'Sedang Piket';
            }
        }
        
        // Jika sudah jam 18:00 atau lebih dan belum absen
        if (currentHour >= 18) {
            return 'Tidak Hadir';
        }
        
        // Jika sebelum jam 18:00 dan belum absen
        return 'Belum Hadir';
    };

    // Fungsi untuk mendapatkan hari saat ini dalam bahasa Indonesia
    const getCurrentDay = () => {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        return days[new Date().getDay()];
    };

    // Fungsi untuk format tanggal Indonesia
    const getCurrentDate = () => {
        const today = new Date();
        const months = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        
        const day = today.getDate();
        const month = months[today.getMonth()];
        const year = today.getFullYear();
        
        return `${day} ${month} ${year}`;
    };

    // Fungsi untuk load data (bisa di-reuse) - CEPAT tanpa delay
    const loadData = async () => {
        try {
            console.log('🔄 Loading data for attendance page...');
            
            // Load semua anggota dan absensi secara parallel untuk kecepatan
            const [membersResponse, attendanceResponse] = await Promise.all([
                MembersApi.getAll(),
                AttendanceApi.getToday()
            ]);

            console.log('👥 Members response:', membersResponse);
            console.log('� Attendance response:', attendanceResponse);
            
            if (membersResponse.success && Array.isArray(membersResponse.data)) {
                setAllMembers(membersResponse.data);
                console.log('👥 Members loaded:', membersResponse.data.length, 'members');
            } else {
                console.log('⚠️ Members data not array or failed:', membersResponse);
                setAllMembers([]);
            }
            
            if (attendanceResponse.success && Array.isArray(attendanceResponse.data)) {
                setAttendanceData(attendanceResponse.data);
                setLastUpdate(new Date().toLocaleTimeString());
                console.log('📋 Attendance loaded:', attendanceResponse.data.length, 'records');
            } else {
                console.log('⚠️ Attendance data not array or failed:', attendanceResponse);
                setAttendanceData([]);
            }
        } catch (error) {
            console.error('❌ Error loading data:', error);
            setAllMembers([]);
            setAttendanceData([]);
        }
    };

    // Initial load
    useEffect(() => {
        loadData();
    }, []); // Hanya jalankan sekali saat mount

    // Auto refresh setiap 15 detik (otomatis, tanpa kontrol user)
    useEffect(() => {
        const interval = setInterval(() => {
            console.log('🔄 Auto refresh triggered');
            loadData();
        }, 15000); // 15 detik

        return () => clearInterval(interval);
    }, []);

    // Dapatkan anggota yang piket hari ini dengan useMemo untuk performance
    const currentDay = getCurrentDay();
    const todayMembers = React.useMemo(() => {
        return Array.isArray(allMembers) ? allMembers.filter(member => {
            const hasPiket = member.hariPiket && Array.isArray(member.hariPiket) && member.hariPiket.includes(currentDay);
            return hasPiket;
        }) : [];
    }, [allMembers, currentDay]);

    // Log hanya sekali untuk debugging
    React.useEffect(() => {
        if (todayMembers.length > 0) {
            console.log(`📅 Hari ini: ${currentDay}, Anggota piket:`, todayMembers.length);
            console.log('👥 Daftar anggota piket:', todayMembers.map(m => m.nama));
        }
    }, [todayMembers.length, currentDay, todayMembers]);

    // Filter data berdasarkan search term dan status, hanya untuk anggota yang piket hari ini
    const filteredAttendance = todayMembers.filter(member => {
        const matchesSearch = member.nama.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Cari data absensi untuk member ini hari ini (pastikan attendanceData adalah array)
        const attendanceRecord = Array.isArray(attendanceData) 
            ? attendanceData.find(att => att.memberId === member.id)
            : null;
        
        // Gunakan status dari backend API, fallback ke logic frontend jika tidak ada
        const memberStatus = attendanceRecord?.status || getAttendanceStatus(attendanceRecord);
        
        const matchesStatus = !filterStatus || memberStatus === filterStatus;
        
        return matchesSearch && matchesStatus;
    }).map(member => {
        // Gabungkan data member dengan data absensi hari ini
        const attendanceRecord = Array.isArray(attendanceData)
            ? attendanceData.find(att => att.memberId === member.id)
            : null;
        
        return {
            id: member.id,
            nama: member.nama,
            nim: member.nim,
            jamDatang: attendanceRecord?.jamDatang || '-',
            jamPulang: attendanceRecord?.jamPulang || '-',
            status: attendanceRecord?.status || getAttendanceStatus(attendanceRecord) // Prioritaskan status dari API
        };
    });

    const totalItems = filteredAttendance.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentAttendance = filteredAttendance.slice(startIndex, startIndex + itemsPerPage);

    const getStatusColor = (status) => {
        if (status === 'Hadir') {
            return 'bg-green-100 text-green-800';
        } else if (status === 'Sedang Piket') {
            return 'bg-blue-100 text-blue-800';
        } else if (status === 'Belum Hadir') {
            return 'bg-yellow-100 text-yellow-800';
        } else {
            return 'bg-red-100 text-red-800';
        }
    };

    // Fungsi untuk menghitung durasi kerja
    const calculateDuration = (jamDatang, jamPulang) => {
        const durationMinutes = calculateDurationInMinutes(jamDatang, jamPulang);
        
        if (durationMinutes === 0) {
            return '-';
        }

        // Convert kembali ke jam dan menit
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;

        return `${hours}j ${minutes}m`;
    };

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleFilterChange = (type, value) => {
        if (type === 'status') {
            setFilterStatus(value);
        }
        setCurrentPage(1);
    };

    const clearAllFilters = () => {
        setSearchTerm('');
        setFilterStatus('');
        setCurrentPage(1);
    };

    const hasActiveFilters = searchTerm || filterStatus;

    // Statistics
    const stats = {
        total: filteredAttendance.length,
        hadir: filteredAttendance.filter(item => item.status === 'Hadir').length,
        sedangPiket: filteredAttendance.filter(item => item.status === 'Sedang Piket').length,
        belumHadir: filteredAttendance.filter(item => item.status === 'Belum Hadir').length,
        tidakHadir: filteredAttendance.filter(item => item.status === 'Tidak Hadir').length
    };

    return (
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
            {/* Header */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
                        Welcome to Sistem Absensi Reslab, <span className="text-orange-600 font-bold">Admin</span>
                    </h1>
                    <p className="text-3xl md:text-4xl font-bold mt-2">
                        Absensi Hari Ini - {getCurrentDay()}, {getCurrentDate()}
                    </p>
                    {lastUpdate && (
                        <p className="text-gray-500 text-sm mt-1">
                            Last update: {lastUpdate} • Auto refresh every 15s
                        </p>
                    )}
                </div>
                <div className="mt-4 sm:mt-0 flex items-center">
                    {/* User Info */}
                    <div className="flex items-center bg-white rounded-full py-2 px-4 shadow-sm cursor-pointer">
                        <User size={20} className="text-gray-600 mr-2" />
                        <span className="font-medium text-gray-700">Admin</span>
                        <ChevronDown size={18} className="ml-2 text-gray-500" />
                    </div>
                </div>
            </header>

 
                 
            {/* Statistics Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
                    <h4 className="text-sm font-medium text-gray-600">Total Piket</h4>
                    <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
                    <h4 className="text-sm font-medium text-gray-600">Hadir</h4>
                    <p className="text-2xl font-bold text-green-600">{stats.hadir}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-400">
                    <h4 className="text-sm font-medium text-gray-600">Sedang Piket</h4>
                    <p className="text-2xl font-bold text-blue-600">{stats.sedangPiket}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-yellow-500">
                    <h4 className="text-sm font-medium text-gray-600">Belum Hadir</h4>
                    <p className="text-2xl font-bold text-yellow-600">{stats.belumHadir}</p>
                </div>
                
                <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-red-500">
                    <h4 className="text-sm font-medium text-gray-600">Tidak Hadir</h4>
                    <p className="text-2xl font-bold text-red-600">{stats.tidakHadir}</p>
                </div>
            </section>

            {/* Attendance Table */}
            <section className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-700">
                        Daftar Kehadiran
                    </h3>
                    {hasActiveFilters && (
                        <div className="text-sm text-gray-500">
                            {filteredAttendance.length} dari {attendanceData.length} records
                        </div>
                    )}
                </div>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 rounded-lg">
                        <thead className="bg-orange-500 text-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">No</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Nama</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Jam Datang</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Jam Pulang</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Durasi</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {currentAttendance.length > 0 ? (
                                currentAttendance.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {startIndex + index + 1}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.nama}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.jamDatang === '-' ? (
                                                <span className="text-gray-400 italic">-</span>
                                            ) : (
                                                <span className="font-mono">{item.jamDatang}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.jamPulang === '-' ? (
                                                <span className="text-gray-400 italic">-</span>
                                            ) : (
                                                <span className="font-mono">{item.jamPulang}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {(() => {
                                                const duration = calculateDuration(item.jamDatang, item.jamPulang);
                                                const durationMinutes = calculateDurationInMinutes(item.jamDatang, item.jamPulang);
                                                const isValid = durationMinutes >= 60;
                                                
                                                if (duration === '-') {
                                                    return <span className="text-gray-400 italic">-</span>;
                                                }
                                                
                                                return (
                                                    <div className="flex items-center space-x-1">
                                                        <span className="font-mono">{duration}</span>
                                                        {durationMinutes > 0 && (
                                                            <span className={`text-xs ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                                                                {isValid ? '✓' : '✗'}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`py-1 px-3 rounded-full text-xs font-semibold ${getStatusColor(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        {hasActiveFilters ? (
                                            <div>
                                                <p className="mb-2">Tidak ada data yang cocok dengan filter</p>
                                                <button
                                                    onClick={clearAllFilters}
                                                    className="text-orange-600 hover:text-orange-700 font-medium text-sm"
                                                >
                                                    Reset Filter
                                                </button>
                                            </div>
                                        ) : (
                                            'Tidak ada data kehadiran'
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                        <div className="text-sm text-gray-500">
                            Menampilkan {startIndex + 1} sampai {Math.min(startIndex + itemsPerPage, totalItems)} dari {totalItems} Data
                        </div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                            <button
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={16} />
                                <span className="ml-1">Sebelumnya</span>
                            </button>
                            
                            {/* Page Numbers */}
                            {totalPages <= 7 ? (
                                // Show all pages if 7 or fewer
                                Array.from({ length: totalPages }, (_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => goToPage(index + 1)}
                                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                                            index + 1 === currentPage 
                                                ? 'text-white bg-orange-500 font-semibold' 
                                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        {index + 1}
                                    </button>
                                ))
                            ) : (
                                // Show condensed pagination for more than 7 pages
                                <>
                                    {currentPage > 3 && (
                                        <>
                                            <button
                                                onClick={() => goToPage(1)}
                                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                                            >
                                                1
                                            </button>
                                            {currentPage > 4 && (
                                                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                                    ...
                                                </span>
                                            )}
                                        </>
                                    )}
                                    
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                                        let pageNum;
                                        if (currentPage <= 3) {
                                            pageNum = index + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + index;
                                        } else {
                                            pageNum = currentPage - 2 + index;
                                        }
                                        
                                        if (pageNum < 1 || pageNum > totalPages) return null;
                                        
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => goToPage(pageNum)}
                                                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                                                    pageNum === currentPage 
                                                        ? 'text-white bg-orange-500 font-semibold' 
                                                        : 'bg-white text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                    
                                    {currentPage < totalPages - 2 && (
                                        <>
                                            {currentPage < totalPages - 3 && (
                                                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                                    ...
                                                </span>
                                            )}
                                            <button
                                                onClick={() => goToPage(totalPages)}
                                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                                            >
                                                {totalPages}
                                            </button>
                                        </>
                                    )}
                                </>
                            )}
                            
                            <button
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="mr-1">Selanjutnya</span>
                                <ChevronRight size={16} />
                            </button>
                        </nav>
                    </div>
                )}
            </section>
        </main>
    );
}