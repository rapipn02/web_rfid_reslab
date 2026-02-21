import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Search, User, ChevronDown, UserCheck, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { DashboardApi } from '../api/index.js';

export default function Dashboard() {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [chartPeriod, setChartPeriod] = useState('weekly'); 
    const [loading, setLoading] = useState(false);
    const [dashboardData, setDashboardData] = useState({
        hadir: 0,
        tidakHadir: 0,
        todayHadir: 0,
        todayTidakHadir: 0,
        ringkasan: [],
        chartData: []
    });
    const [originalChartData, setOriginalChartData] = useState([]); 

    const itemsPerPage = 5;

    
    const isDateInCurrentWeek = (date) => {
        const today = new Date();
        const startOfWeek = new Date(today);
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1); 
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 4); 
        endOfWeek.setHours(23, 59, 59, 999);
        
        return date >= startOfWeek && date <= endOfWeek;
    };

    
    const handlePeriodChange = (newPeriod) => {
        setChartPeriod(newPeriod);
        console.log(`Chart period changed to: ${newPeriod}`);
        
        
        if (originalChartData.length > 0) {
            let filteredData = [];
            const now = new Date();
            
            if (newPeriod === 'weekly') {
                
                const weekdays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
                
                const weeklyData = {};
                
                
                weekdays.forEach(day => {
                    weeklyData[day] = {
                        hari: day,
                        hadir: 0,
                        sedangPiket: 0,
                        tidakPiket: 0,
                        total: 0
                    };
                });
                
                
                originalChartData.forEach(item => {
                    const itemDate = new Date(item.tanggal);
                    const dayName = itemDate.toLocaleDateString('id-ID', { weekday: 'long' });
                    
                    
                    if (weekdays.includes(dayName) && isDateInCurrentWeek(itemDate)) {
                        if (weeklyData[dayName]) {
                            weeklyData[dayName].hadir += item.hadir || 0;
                            weeklyData[dayName].sedangPiket += item.sedangPiket || 0;
                            weeklyData[dayName].tidakPiket += item.tidakPiket || 0;
                            weeklyData[dayName].total += item.total || 0;
                        }
                    }
                });
                
                filteredData = weekdays.map(day => weeklyData[day]);
                
            } else if (newPeriod === 'monthly') {
                
                const weeklyData = {};
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();
                
                
                const recentData = originalChartData.filter(item => {
                    const itemDate = new Date(item.tanggal);
                    return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
                });
                
                
                recentData.forEach(item => {
                    const itemDate = new Date(item.tanggal);
                    const dayOfMonth = itemDate.getDate();
                    
                    
                    let weekLabel;
                    if (dayOfMonth <= 7) {
                        weekLabel = "Minggu 1";
                    } else if (dayOfMonth <= 14) {
                        weekLabel = "Minggu 2"; 
                    } else if (dayOfMonth <= 21) {
                        weekLabel = "Minggu 3";
                    } else {
                        weekLabel = "Minggu 4";
                    }
                    
                    if (!weeklyData[weekLabel]) {
                        weeklyData[weekLabel] = {
                            minggu: weekLabel,
                            hadir: 0,
                            sedangPiket: 0,
                            tidakPiket: 0,
                            total: 0
                        };
                    }
                    weeklyData[weekLabel].hadir += item.hadir || 0;
                    weeklyData[weekLabel].sedangPiket += item.sedangPiket || 0;
                    weeklyData[weekLabel].tidakPiket += item.tidakPiket || 0;
                    weeklyData[weekLabel].total += item.total || 0;
                });
                
                
                ["Minggu 1", "Minggu 2", "Minggu 3", "Minggu 4"].forEach(week => {
                    if (!weeklyData[week]) {
                        weeklyData[week] = {
                            minggu: week,
                            hadir: 0,
                            sedangPiket: 0,
                            tidakPiket: 0,
                            total: 0
                        };
                    }
                });
                
                filteredData = Object.values(weeklyData).sort((a, b) => {
                    const order = {"Minggu 1": 1, "Minggu 2": 2, "Minggu 3": 3, "Minggu 4": 4};
                    return order[a.minggu] - order[b.minggu];
                });
                
            } else if (newPeriod === 'yearly') {
                
                const monthlyData = {};
                const currentYear = now.getFullYear();
                
                
                const monthNames = [
                    "Jan", "Feb", "Mar", "Apr", 
                    "Mei", "Jun", "Jul", "Agu",
                    "Sep", "Okt", "Nov", "Des"
                ];
                
                
                monthNames.forEach((monthName, index) => {
                    monthlyData[monthName] = {
                        bulan: monthName,
                        monthIndex: index,
                        hadir: 0,
                        sedangPiket: 0,
                        tidakPiket: 0,
                        total: 0
                    };
                });
                
                
                originalChartData.forEach(item => {
                    const itemDate = new Date(item.tanggal);
                    const itemYear = itemDate.getFullYear();
                    const itemMonth = itemDate.getMonth(); 
                    
                    
                    if (itemYear === currentYear) {
                        const monthName = monthNames[itemMonth];
                        if (monthlyData[monthName]) {
                            monthlyData[monthName].hadir += item.hadir || 0;
                            monthlyData[monthName].sedangPiket += item.sedangPiket || 0;
                            monthlyData[monthName].tidakPiket += item.tidakPiket || 0;
                            monthlyData[monthName].total += item.total || 0;
                        }
                    }
                });
                
                filteredData = Object.values(monthlyData);
            }
            
            setDashboardData(prev => ({
                ...prev,
                chartData: filteredData
            }));
            
            console.log(`Chart filtered for ${newPeriod}:`, filteredData);
        }
    };

    useEffect(() => {
        const loadDashboardData = async () => {
            setLoading(true);
            try {
                console.log('Loading dashboard data...');
                
                
                const response = await DashboardApi.getDashboardData();
                console.log('Dashboard API response:', response);
                
                if (response.success && response.data) {
                    const data = response.data;
                    
                    
                    const chartData = data.chartData || [];
                    setOriginalChartData(chartData);
                    
                    
                    console.log('Recent attendance raw:', data.recentAttendance);
                    console.log('Total records:', data.recentAttendance?.length || 0);
                    
                    
                    const validRecords = (data.recentAttendance || []).filter(record => {
                        const hasValidName = record.nama && record.nama.trim().length > 0;
                        const hasValidDate = record.tanggalFormatted || record.tanggal;
                        return hasValidName && hasValidDate;
                    });
                    
                    console.log('Valid records after filtering:', validRecords.length);
                    
                    
                    const transformedRingkasan = validRecords.map(record => {
                        console.log('Processing record:', {
                            id: record.id,
                            nama: record.nama,
                            tanggalFormatted: record.tanggalFormatted,
                            tanggal: record.tanggal,
                            jam: record.jam,
                            jamDatang: record.jamDatang,
                            jamPulang: record.jamPulang,
                            status: record.status
                        });
                        
                        return {
                            id: record.id,
                            nama: record.nama || 'Nama Tidak Tersedia',
                            tanggal: record.tanggalFormatted || 
                                    (record.tanggal ? new Date(record.tanggal).toLocaleDateString('id-ID', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                    }) : '-'),
                            jam: record.jam || record.jamDatang || '-',
                            status: record.status || 'Status Tidak Diketahui'
                        };
                    });
                    
                    console.log('Transformed ringkasan:', transformedRingkasan);
                    console.log('Filtered out:', (data.recentAttendance?.length || 0) - transformedRingkasan.length, 'incomplete records');
                    console.log('Stats:', data.stats);
                    
                    setDashboardData({
                        hadir: data.stats.hadir || 0,
                        tidakHadir: data.stats.tidakPiket || 0,
                        todayHadir: data.stats.todayHadir || 0,
                        todayTidakHadir: data.stats.todayTidakPiket || 0,
                        ringkasan: transformedRingkasan,
                        chartData: chartData
                    });
                    
                    
                    if (chartData.length > 0) {
                        const weekdays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
                        const weeklyData = {};
                        
                        
                        weekdays.forEach(day => {
                            weeklyData[day] = {
                                hari: day,
                                hadir: 0,
                                sedangPiket: 0,
                                tidakPiket: 0,
                                total: 0
                            };
                        });
                        
                        
                        chartData.forEach(item => {
                            const itemDate = new Date(item.tanggal);
                            const dayName = itemDate.toLocaleDateString('id-ID', { weekday: 'long' });
                            
                            
                            if (weekdays.includes(dayName) && isDateInCurrentWeek(itemDate)) {
                                if (weeklyData[dayName]) {
                                    weeklyData[dayName].hadir += item.hadir || 0;
                                    weeklyData[dayName].sedangPiket += item.sedangPiket || 0;
                                    weeklyData[dayName].tidakPiket += item.tidakPiket || 0;
                                    weeklyData[dayName].total += item.total || 0;
                                }
                            }
                        });
                        
                        const weeklyChart = weekdays.map(day => weeklyData[day]);
                        
                        setDashboardData(prev => ({
                            ...prev,
                            chartData: weeklyChart
                        }));
                    }
                    
                    console.log('Dashboard data updated successfully');
                } else {
                    console.error('Dashboard API failed:', response);
                }
                
            } catch (error) {
                console.error('Error loading dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
        
        
        const interval = setInterval(() => {
            console.log('Auto refresh dashboard...');
            loadDashboardData();
        }, 30000);
        
        return () => clearInterval(interval);
    }, []);

    
    const filteredRingkasan = dashboardData.ringkasan.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        const nama = item.nama || '';
        const tanggal = item.tanggal || '';
        const status = item.status || '';
        
        return nama.toLowerCase().includes(searchLower) ||
               tanggal.includes(searchTerm) ||
               status.toLowerCase().includes(searchLower);
    });

    const totalItems = filteredRingkasan.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentRingkasan = filteredRingkasan.slice(startIndex, startIndex + itemsPerPage);

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); 
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'Hadir':
                return 'bg-green-100 text-green-800';
            case 'Sedang Piket':
                return 'bg-blue-100 text-blue-800';
            case 'Belum Piket':
                return 'bg-yellow-100 text-yellow-800';
            case 'Tidak Piket':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {}
            <main data-aos="fade-up" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
                {}
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800 truncate">
                            Welcome to Sistem Absensi Reslab, <span className="text-orange-600 font-bold">Admin</span>
                        </h1>
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-2">Dashboard</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                        <div className="bg-white rounded-lg py-2 px-4 shadow-sm cursor-pointer flex items-center min-w-0 w-full sm:w-auto">
                            <User size={20} className="text-gray-600 mr-2 flex-shrink-0" />
                            <span className="font-medium text-gray-700 truncate">Admin</span>
                            <ChevronDown size={18} className="ml-2 text-gray-500 flex-shrink-0" />
                        </div>
                    </div>
                </header>

                {}
                <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    {}
                    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-md border-t-4 border-green-500">
                        <div className="flex justify-between items-center mb-3 sm:mb-4">
                            <h3 className="text-sm sm:text-lg font-medium text-gray-500">Total Hadir</h3>
                            <UserCheck size={20} className="text-green-500 flex-shrink-0" />
                        </div>
                        <div className="flex items-end justify-between">
                            <span className="text-2xl sm:text-4xl font-bold text-gray-800">{dashboardData.hadir}</span>
                            <span className="text-xs sm:text-sm text-gray-500">orang</span>
                        </div>
                    </div>

                    {}
                    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-md border-t-4 border-red-500">
                        <div className="flex justify-between items-center mb-3 sm:mb-4">
                            <h3 className="text-sm sm:text-lg font-medium text-gray-500">Total Tidak Piket</h3>
                            <XCircle size={20} className="text-red-500 flex-shrink-0" />
                        </div>
                        <div className="flex items-end justify-between">
                            <span className="text-2xl sm:text-4xl font-bold text-gray-800">{dashboardData.tidakHadir}</span>
                            <span className="text-xs sm:text-sm text-gray-500">orang</span>
                        </div>
                    </div>

                    {}
                    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-md border-t-4 border-blue-500">
                        <div className="flex justify-between items-center mb-3 sm:mb-4">
                            <h3 className="text-sm sm:text-lg font-medium text-gray-500">Hadir Hari Ini</h3>
                            <UserCheck size={20} className="text-blue-500 flex-shrink-0" />
                        </div>
                        <div className="flex items-end justify-between">
                            <span className="text-2xl sm:text-4xl font-bold text-gray-800">{dashboardData.todayHadir}</span>
                            <span className="text-xs sm:text-sm text-gray-500">orang</span>
                        </div>
                    </div>

                    {}
                    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-md border-t-4 border-yellow-500">
                        <div className="flex justify-between items-center mb-3 sm:mb-4">
                            <h3 className="text-sm sm:text-lg font-medium text-gray-500">Tidak Piket Hari Ini</h3>
                            <XCircle size={20} className="text-yellow-500 flex-shrink-0" />
                        </div>
                        <div className="flex items-end justify-between">
                            <span className="text-2xl sm:text-4xl font-bold text-gray-800">{dashboardData.todayTidakHadir}</span>
                            <span className="text-xs sm:text-sm text-gray-500">orang</span>
                        </div>
                    </div>
                </section>

                {}
                <section className="bg-white rounded-xl p-4 sm:p-6 shadow-md mb-6 sm:mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-3 sm:space-y-0">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                            Grafik Kehadiran {
                                chartPeriod === 'weekly' ? '(Senin - Jumat)' :
                                chartPeriod === 'monthly' ? '(Bulan Ini)' :
                                chartPeriod === 'yearly' ? '(Jan - Des)' : ''
                            }
                        </h3>
                        
                        {}
                        <div className="flex bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
                            <button
                                onClick={() => handlePeriodChange('weekly')}
                                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                                    chartPeriod === 'weekly'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-800'
                                }`}
                            >
                                Mingguan
                            </button>
                            <button
                                onClick={() => handlePeriodChange('monthly')}
                                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                                    chartPeriod === 'monthly'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-800'
                                }`}
                            >
                                Bulanan
                            </button>
                            <button
                                onClick={() => handlePeriodChange('yearly')}
                                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                                    chartPeriod === 'yearly'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-800'
                                }`}
                            >
                                Tahunan
                            </button>
                        </div>
                    </div>
                    
                    <div className="relative min-h-[300px] sm:min-h-[400px]">
                        {loading && (
                            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                                <div className="text-gray-500 text-sm">Memuat data chart...</div>
                            </div>
                        )}
                        
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={dashboardData.chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey={
                                        chartPeriod === 'yearly' ? 'bulan' : 
                                        chartPeriod === 'monthly' ? 'minggu' : 
                                        'hari'
                                    }
                                    tick={{ fontSize: 10 }}
                                    interval="preserveStartEnd"
                                />
                                <YAxis 
                                    allowDecimals={false}
                                    domain={[0, 'dataMax + 1']}
                                    tick={{ fontSize: 10 }}
                                />
                                <Tooltip 
                                    labelFormatter={(value, payload) => {
                                        if (payload && payload[0] && payload[0].payload) {
                                            const data = payload[0].payload;
                                            if (chartPeriod === 'yearly') {
                                                return data.bulan || value;
                                            } else if (chartPeriod === 'monthly') {
                                                return data.minggu || value;
                                            } else {
                                                return data.hari || value;
                                            }
                                        }
                                        return value;
                                    }}
                                />
                                <Legend />
                                <Line 
                                    type="linear" 
                                    dataKey="hadir" 
                                    stroke="#22c55e" 
                                    strokeWidth={3}
                                    activeDot={{ r: 6, fill: '#22c55e' }}
                                    name="Hadir"
                                />
                                <Line 
                                    type="linear" 
                                    dataKey="sedangPiket" 
                                    stroke="#3b82f6" 
                                    strokeWidth={3}
                                    activeDot={{ r: 6, fill: '#3b82f6' }}
                                    name="Sedang Piket"
                                />
                                <Line 
                                    type="linear" 
                                    dataKey="tidakPiket" 
                                    stroke="#ef4444" 
                                    strokeWidth={3}
                                    activeDot={{ r: 6, fill: '#ef4444' }}
                                    name="Tidak Piket"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                        
                        {}
                        <div className="mt-2 text-xs text-gray-500">
                            Period: {chartPeriod} | Data points: {dashboardData.chartData.length}
                        </div>
                    </div>
                </section>

                {}
                <section className="bg-white rounded-xl p-4 sm:p-6 shadow-md">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-3 sm:space-y-0">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800">Ringkasan Absensi Terbaru</h3>
                        <div className="relative w-full sm:w-auto sm:min-w-[250px]">
                            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari Nama / Tanggal / Status"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm"
                            />
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                        <div className="min-w-full inline-block align-middle">
                            <table className="min-w-full divide-y divide-gray-200 rounded-lg">
                                <thead className="bg-orange-500 text-white">
                                    <tr>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Nama</th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden sm:table-cell">Tanggal</th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Jam</th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentRingkasan.length > 0 ? (
                                        currentRingkasan.map((item, index) => (
                                            <tr key={item.id || index} className="hover:bg-gray-50">
                                                <td className="px-3 sm:px-6 py-4 text-sm font-medium text-gray-900">
                                                    <div className="flex flex-col">
                                                        <span>{item.nama}</span>
                                                        <span className="text-xs text-gray-500 sm:hidden">{item.tanggal}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">{item.tanggal}</td>
                                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.jam}</td>
                                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className={`py-1 px-2 sm:px-3 rounded-full text-xs font-semibold ${getStatusColor(item.status)}`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="text-center py-12">
                                                <div className="flex flex-col items-center justify-center space-y-3">
                                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                                        <UserCheck className="w-8 h-8 text-gray-400" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-gray-600 font-medium">Belum Ada Data Absensi</p>
                                                        <p className="text-gray-400 text-sm mt-1">
                                                            Silakan tap kartu RFID di scanner untuk mencatat kehadiran
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {}
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 space-y-3 sm:space-y-0">
                            <div className="text-xs sm:text-sm text-gray-500 order-2 sm:order-1">
                                Menampilkan {startIndex + 1} sampai {Math.min(startIndex + itemsPerPage, totalItems)} dari {totalItems} Data
                            </div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px order-1 sm:order-2">
                                <button
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-xs sm:text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={14} className="sm:mr-1" />
                                    <span className="hidden sm:inline">Sebelumnya</span>
                                </button>
                                {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = index + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = index + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + index;
                                    } else {
                                        pageNum = currentPage - 2 + index;
                                    }
                                    
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => goToPage(pageNum)}
                                            className={`relative inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 text-xs sm:text-sm font-medium ${pageNum === currentPage ? 'text-white bg-orange-500 font-semibold' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-xs sm:text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="hidden sm:inline">Selanjutnya</span>
                                    <ChevronRight size={14} className="sm:ml-1" />
                                </button>
                            </nav>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}