import React, { useState, useEffect, useCallback } from 'react';
import { Search, User, ChevronDown, ChevronLeft, ChevronRight, Filter, RotateCcw } from 'lucide-react';
import { AttendanceApi, MembersApi } from '../api/index.js';

export default function AbsensiPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [attendanceData, setAttendanceData] = useState([]);
    const [allMembers, setAllMembers] = useState([]);
    const [filterStatus, setFilterStatus] = useState('');

    const itemsPerPage = 10;

    
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

    
    const isValidDuration = (jamDatang, jamPulang) => {
        const durationMinutes = calculateDurationInMinutes(jamDatang, jamPulang);
        return durationMinutes >= 60; 
    };

    
    
    const getAttendanceStatus = (attendanceRecord) => {
        const now = new Date();
        const currentHour = now.getHours();
        
        
        if (attendanceRecord) {
            const jamDatang = attendanceRecord.jamDatang;
            const jamPulang = attendanceRecord.jamPulang;
            
            
            if (jamDatang && jamPulang && jamDatang !== '-' && jamPulang !== '-') {
                
                if (isValidDuration(jamDatang, jamPulang)) {
                    return 'Hadir';
                } else {
                    
                    return 'Tidak Hadir';
                }
            }
            
            else if (jamDatang && jamDatang !== '-') {
                return 'Sedang Piket';
            }
        }
        
        
        if (currentHour >= 18) {
            return 'Tidak Hadir';
        }
        
        
        return 'Belum Hadir';
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

    
    const loadData = useCallback(async () => {
        try {
            console.log('Loading data for attendance page...');
            
            
            const [membersResponse, attendanceResponse] = await Promise.all([
                MembersApi.getAll(),
                AttendanceApi.getTodayWithMembers() 
            ]);

            console.log('Members response:', membersResponse);
            console.log('Attendance response:', attendanceResponse);
            
            if (membersResponse.success && Array.isArray(membersResponse.data)) {
                setAllMembers(membersResponse.data);
                console.log('Members loaded:', membersResponse.data.length, 'members');
            } else {
                console.log('Members data not array or failed:', membersResponse);
                setAllMembers([]);
            }
            
            
            if (attendanceResponse.success && Array.isArray(attendanceResponse.data)) {
                setAttendanceData(attendanceResponse.data);
                console.log('Attendance loaded:', attendanceResponse.data.length, 'records');
            } else {
                console.log('Attendance data not array or failed:', attendanceResponse);
                setAttendanceData([]);
            }

        } catch (error) {
            console.error('Error loading data:', error);
            setAllMembers([]);
            setAttendanceData([]);
        }
    }, []);

    
    useEffect(() => {
        const interval = setInterval(() => {
            console.log('Auto refresh triggered');
            loadData();
        }, 10000); 

        return () => clearInterval(interval);
    }, [loadData]);

    
    useEffect(() => {
        loadData();
    }, [loadData]);

    
    const currentDay = getCurrentDay();
    const todayMembers = React.useMemo(() => {
        return Array.isArray(allMembers) ? allMembers.filter(member => {
            const hasPiket = member.hariPiket && Array.isArray(member.hariPiket) && member.hariPiket.includes(currentDay);
            return hasPiket;
        }) : [];
    }, [allMembers, currentDay]);

    
    React.useEffect(() => {
        if (todayMembers.length > 0) {
            console.log(`Hari ini: ${currentDay}, Anggota piket:`, todayMembers.length);
            console.log('Daftar anggota piket:', todayMembers.map(m => m.nama));
        }
    }, [todayMembers.length, currentDay, todayMembers]);

    
    const filteredAttendance = todayMembers.filter(member => {
        const matchesSearch = member.nama.toLowerCase().includes(searchTerm.toLowerCase());
        
        
        const attendanceRecord = Array.isArray(attendanceData) 
            ? attendanceData.find(att => att.memberId === member.id)
            : null;
        
        
        const memberStatus = attendanceRecord?.status || getAttendanceStatus(attendanceRecord);
        
        const matchesStatus = !filterStatus || memberStatus === filterStatus;
        
        return matchesSearch && matchesStatus;
    }).map(member => {
        
        const attendanceRecord = Array.isArray(attendanceData)
            ? attendanceData.find(att => att.memberId === member.id)
            : null;
        
        return {
            id: member.id,
            nama: member.nama,
            nim: member.nim,
            jamDatang: attendanceRecord?.jamDatang || '-',
            jamPulang: attendanceRecord?.jamPulang || '-',
            status: attendanceRecord?.status || getAttendanceStatus(attendanceRecord) 
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

    
    const calculateDuration = (jamDatang, jamPulang) => {
        const durationMinutes = calculateDurationInMinutes(jamDatang, jamPulang);
        
        if (durationMinutes === 0) {
            return '-';
        }

        
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;

        return `${hours}j ${minutes}m`;
    };

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
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

    return (
        <div className="min-h-screen bg-gray-50">
            <main data-aos="fade-up" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
                {}
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800 truncate">
                            Welcome to Sistem Absensi Reslab, <span className="text-orange-600 font-bold">Admin</span>
                        </h1>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold mt-2">
                            Absensi Hari Ini - {getCurrentDay()}, {getCurrentDate()}
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                        {}
                        <div className="flex items-center bg-white rounded-lg py-2 px-4 shadow-sm cursor-pointer w-full sm:w-auto min-w-0">
                            <User size={20} className="text-gray-600 mr-2 flex-shrink-0" />
                            <span className="font-medium text-gray-700 truncate">Admin</span>
                            <ChevronDown size={18} className="ml-2 text-gray-500 flex-shrink-0" />
                        </div>
                    </div>
                </header>

 
                 
                {}
                <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
                    <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border-l-4 border-blue-500">
                        <h4 className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Piket</h4>
                        <p className="text-lg sm:text-2xl font-bold text-gray-800">{stats.total}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border-l-4 border-green-500">
                        <h4 className="text-xs sm:text-sm font-medium text-gray-600 truncate">Hadir</h4>
                        <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.hadir}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border-l-4 border-blue-400">
                        <h4 className="text-xs sm:text-sm font-medium text-gray-600 truncate">Sedang Piket</h4>
                        <p className="text-lg sm:text-2xl font-bold text-blue-600">{stats.sedangPiket}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border-l-4 border-yellow-500">
                        <h4 className="text-xs sm:text-sm font-medium text-gray-600 truncate">Belum Hadir</h4>
                        <p className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.belumHadir}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border-l-4 border-red-500 col-span-2 sm:col-span-1">
                        <h4 className="text-xs sm:text-sm font-medium text-gray-600 truncate">Tidak Hadir</h4>
                        <p className="text-lg sm:text-2xl font-bold text-red-600">{stats.tidakHadir}</p>
                    </div>
                </section>

                {}
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
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                <div className="break-words whitespace-normal max-w-[150px] sm:max-w-none">
                                                    {item.nama}
                                                </div>
                                            </td>
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
                    </div>                    {}
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                            <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                                Menampilkan {startIndex + 1} sampai {Math.min(startIndex + itemsPerPage, totalItems)} dari {totalItems} Data
                            </div>
                            <nav className="flex flex-wrap justify-center gap-1 sm:gap-0 sm:inline-flex sm:rounded-md sm:shadow-sm sm:-space-x-px">
                                <button
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-2 sm:px-3 py-2 rounded sm:rounded-l-md border border-gray-300 bg-white text-xs sm:text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={14} />
                                    <span className="ml-1 hidden sm:inline">Sebelumnya</span>
                                </button>
                            
                            {}
                            {totalPages <= 7 ? (
                                
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
                                                className={`relative inline-flex items-center px-2 sm:px-4 py-2 border border-gray-300 text-xs sm:text-sm font-medium ${
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
                                                    <span className="relative inline-flex items-center px-2 sm:px-4 py-2 border border-gray-300 bg-white text-xs sm:text-sm font-medium text-gray-700">
                                                        ...
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => goToPage(totalPages)}
                                                    className="relative inline-flex items-center px-2 sm:px-4 py-2 border border-gray-300 bg-white text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50"
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
                                    className="relative inline-flex items-center px-2 sm:px-3 py-2 rounded sm:rounded-r-md border border-gray-300 bg-white text-xs sm:text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="mr-1 hidden sm:inline">Selanjutnya</span>
                                    <ChevronRight size={14} />
                                </button>
                            </nav>
                        </div>
                    )}
            </section>
            </main>
        </div>
    );
}