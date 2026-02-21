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
    const [lastUpdate, setLastUpdate] = useState(null);
    const [latestScan, setLatestScan] = useState(null); 

    const itemsPerPage = 8;

    
    const checkLatestScan = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/rfid/latest-scan');
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    setLatestScan(data.data);
                    
                    setTimeout(() => setLatestScan(null), 5000);
                }
            }
        } catch (error) {
            console.log('No latest scan data available');
        }
    };

    
    const loadData = async () => {
        try {
            console.log('Loading data for attendance page...');
            
            const [membersResponse, attendanceResponse] = await Promise.all([
                MembersApi.getAll(),
                AttendanceApi.getToday()
            ]);

            if (membersResponse.success && Array.isArray(membersResponse.data)) {
                setAllMembers(membersResponse.data);
            } else {
                setAllMembers([]);
            }
            
            if (attendanceResponse.success && Array.isArray(attendanceResponse.data)) {
                setAttendanceData(attendanceResponse.data);
                setLastUpdate(new Date().toLocaleTimeString());
            } else {
                setAttendanceData([]);
            }

            
            checkLatestScan();
        } catch (error) {
            console.error('Error loading data:', error);
            setAllMembers([]);
            setAttendanceData([]);
        }
    };

    
    useEffect(() => {
        loadData();
    }, []);

    
    useEffect(() => {
        const interval = setInterval(() => {
            loadData();
        }, 15000);

        return () => clearInterval(interval);
    }, []);

    
    const calculateDurationInMinutes = (jamDatang, jamPulang) => {
        if (!jamDatang || !jamPulang || jamDatang === '-' || jamPulang === '-') {
            return 0;
        }

        try {
            const [jamDatangHour, jamDatangMinute] = jamDatang.split(':').map(num => parseInt(num));
            const [jamPulangHour, jamPulangMinute] = jamPulang.split(':').map(num => parseInt(num));

            const dataangTotalMinutes = jamDatangHour * 60 + jamDatangMinute;
            const pulangTotalMinutes = jamPulangHour * 60 + jamPulangMinute;

            let durationMinutes = pulangTotalMinutes - dataangTotalMinutes;

            if (durationMinutes < 0) {
                durationMinutes += 24 * 60;
            }

            return durationMinutes;
        } catch {
            return 0;
        }
    };

    
    const calculateDuration = (jamDatang, jamPulang) => {
        const durationMinutes = calculateDurationInMinutes(jamDatang, jamPulang);
        
        if (durationMinutes === 0) {
            return '-';
        }

        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;

        return `${hours}j ${minutes}m`;
    };

    
    const determineMemberStatus = (member) => {
        const attendance = attendanceData.find(att => att.nim === member.nim);
        
        if (!attendance) {
            const currentHour = new Date().getHours();
            return currentHour >= 18 ? 'Tidak Hadir' : 'Belum Hadir';
        }

        if (attendance.jamPulang && attendance.jamPulang !== '-') {
            return 'Hadir';
        } else {
            return 'Sedang Piket';
        }
    };

    
    const combinedData = allMembers.map(member => {
        const attendance = attendanceData.find(att => att.nim === member.nim);
        const status = determineMemberStatus(member);
        
        return {
            id: member.id,
            nama: member.nama,
            nim: member.nim,
            jamDatang: attendance?.jamDatang || '-',
            jamPulang: attendance?.jamPulang || '-',
            durasi: attendance ? calculateDuration(attendance.jamDatang, attendance.jamPulang) : '-',
            status: status
        };
    });

    
    const filteredAttendance = combinedData.filter(item => {
        const matchesSearch = item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.nim.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !filterStatus || item.status === filterStatus;
        
        return matchesSearch && matchesStatus;
    });

    
    const totalPages = Math.ceil(filteredAttendance.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredAttendance.slice(startIndex, startIndex + itemsPerPage);

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

    
    const stats = {
        total: filteredAttendance.length,
        hadir: filteredAttendance.filter(item => item.status === 'Hadir').length,
        sedangPiket: filteredAttendance.filter(item => item.status === 'Sedang Piket').length,
        belumHadir: filteredAttendance.filter(item => item.status === 'Belum Hadir').length,
        tidakHadir: filteredAttendance.filter(item => item.status === 'Tidak Hadir').length
    };

    
    const formatTime = (timeString) => {
        if (!timeString || timeString === '-') return '-';
        return timeString.substring(0, 5); 
    };

    const getCurrentDay = () => {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        return days[new Date().getDay()];
    };

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

    const getStatusBadge = (status) => {
        const statusConfig = {
            'Hadir': { color: 'bg-green-100 text-green-800', icon: '✅' },
            'Sedang Piket': { color: 'bg-blue-100 text-blue-800', icon: '🔄' },
            'Belum Hadir': { color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
            'Tidak Hadir': { color: 'bg-red-100 text-red-800', icon: '❌' }
        };

        const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: '?' };
        
        return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                <span className="mr-1">{config.icon}</span>
                <span className="hidden sm:inline">{status}</span>
                <span className="sm:hidden">{status.substring(0, 6)}{status.length > 6 ? '...' : ''}</span>
            </span>
        );
    };
    return (
        <div className="min-h-screen bg-gray-50">
            <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
                {}
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800 truncate">
                            Absensi Hari Ini
                        </h1>
                        <p className="text-sm sm:text-lg text-gray-600 mt-1">
                            {getCurrentDay()}, {getCurrentDate()}
                        </p>
                        {lastUpdate && (
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                Terakhir diperbarui: {lastUpdate}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center bg-white rounded-lg py-2 px-4 shadow-sm cursor-pointer min-w-0 w-full sm:w-auto">
                        <User size={20} className="text-gray-600 mr-2 flex-shrink-0" />
                        <span className="font-medium text-gray-700 truncate">Admin</span>
                        <ChevronDown size={18} className="ml-2 text-gray-500 flex-shrink-0" />
                    </div>
                </header>

                {}
                {latestScan && (
                    <div className="mb-4 sm:mb-6 bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 text-xs sm:text-sm">🔖</span>
                                </div>
                            </div>
                            <div className="ml-3 flex-1 min-w-0">
                                <h3 className="text-xs sm:text-sm font-medium text-blue-800">
                                    Latest RFID Scan
                                </h3>
                                <div className="mt-1 text-xs sm:text-sm text-blue-700">
                                    <div className="font-medium truncate">{latestScan.nama} - {latestScan.nim}</div>
                                    <div className="text-xs">
                                        {latestScan.type === 'check_in' ? '✅ Check In' : '🏃 Check Out'} at {formatTime(latestScan.timestamp)}
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => setLatestScan(null)}
                                className="ml-2 flex-shrink-0 text-blue-400 hover:text-blue-600 p-1"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                {}
                <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border">
                        <div className="text-lg sm:text-2xl font-bold text-gray-800">{stats.total}</div>
                        <div className="text-xs sm:text-sm text-gray-600">Total</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border">
                        <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.hadir}</div>
                        <div className="text-xs sm:text-sm text-gray-600">Hadir</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border">
                        <div className="text-lg sm:text-2xl font-bold text-blue-600">{stats.sedangPiket}</div>
                        <div className="text-xs sm:text-sm text-gray-600">Sedang Piket</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border">
                        <div className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.belumHadir}</div>
                        <div className="text-xs sm:text-sm text-gray-600">Belum Hadir</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border col-span-2 sm:col-span-1">
                        <div className="text-lg sm:text-2xl font-bold text-red-600">{stats.tidakHadir}</div>
                        <div className="text-xs sm:text-sm text-gray-600">Tidak Hadir</div>
                    </div>
                </section>

                {}
                <section className="bg-white rounded-lg shadow-sm border p-3 sm:p-4 mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Cari nama atau NIM..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button
                                onClick={() => setShowFilter(!showFilter)}
                                className="flex-1 sm:flex-none flex items-center justify-center px-3 sm:px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
                            >
                                <Filter size={18} className="mr-2" />
                                Filter
                            </button>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearAllFilters}
                                    className="flex-1 sm:flex-none flex items-center justify-center px-3 sm:px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                                >
                                    <RotateCcw size={16} className="mr-2" />
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>

                    {showFilter && (
                        <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Status</label>
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                        className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Semua Status</option>
                                        <option value="Hadir">Hadir</option>
                                        <option value="Sedang Piket">Sedang Piket</option>
                                        <option value="Belum Hadir">Belum Hadir</option>
                                        <option value="Tidak Hadir">Tidak Hadir</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {}
                <section className="bg-white rounded-lg shadow-sm border">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px]">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIM</th>
                                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jam Datang</th>
                                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jam Pulang</th>
                                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durasi</th>
                                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedData.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-3 sm:px-6 py-8 text-center text-gray-500 text-sm">
                                            Tidak ada data yang ditemukan
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedData.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                                {startIndex + index + 1}
                                            </td>
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">{item.nama}</div>
                                            </td>
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                                {item.nim}
                                            </td>
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                                {formatTime(item.jamDatang)}
                                            </td>
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                                {formatTime(item.jamPulang)}
                                            </td>
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                                {item.durasi}
                                            </td>
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                {getStatusBadge(item.status)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {}
                    {totalPages > 1 && (
                        <div className="px-3 sm:px-6 py-3 bg-gray-50 border-t border-gray-200">
                            <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                                <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                                    Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredAttendance.length)} dari {filteredAttendance.length} data
                                </div>
                                <div className="flex items-center space-x-1 sm:space-x-2">
                                    <button
                                        onClick={() => goToPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    
                                    <div className="hidden sm:flex space-x-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }
                                            
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => goToPage(pageNum)}
                                                    className={`px-2 sm:px-3 py-1 rounded-lg border text-sm ${
                                                        currentPage === pageNum
                                                            ? 'bg-blue-500 text-white border-blue-500'
                                                            : 'border-gray-200 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    
                                    {}
                                    <div className="sm:hidden px-3 py-1 text-sm text-gray-600">
                                        {currentPage} / {totalPages}
                                    </div>
                                    
                                    <button
                                        onClick={() => goToPage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
