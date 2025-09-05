import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Search, User, ChevronDown, UserCheck, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { DashboardApi } from '../api/index.js';

export default function Dashboard() {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [chartPeriod, setChartPeriod] = useState('weekly'); // weekly, monthly, yearly
    const [loading, setLoading] = useState(false);
    const [dashboardData, setDashboardData] = useState({
        hadir: 0,
        tidakHadir: 0,
        todayHadir: 0,
        todayTidakHadir: 0,
        ringkasan: [],
        chartData: []
    });
    const [originalChartData, setOriginalChartData] = useState([]); // Store original data for filtering

    const itemsPerPage = 5;

    // Handle period change for chart
    const handlePeriodChange = (newPeriod) => {
        setChartPeriod(newPeriod);
        console.log(`📊 Chart period changed to: ${newPeriod}`);
        
        // Filter and process original chart data based on period
        if (originalChartData.length > 0) {
            let filteredData = [];
            const now = new Date();
            
            if (newPeriod === 'weekly') {
                // Ambil 7 hari terakhir dengan format hari Senin-Minggu
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                const recentData = originalChartData.filter(item => {
                    const itemDate = new Date(item.tanggal);
                    return itemDate >= weekAgo;
                }).slice(-7);
                
                // Format untuk hari dalam seminggu
                filteredData = recentData.map(item => ({
                    ...item,
                    hari: new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'long' })
                }));
                
            } else if (newPeriod === 'monthly') {
                // Buat data untuk 4 minggu dalam bulan ini
                const weeklyData = {};
                const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
                
                // Filter data 4 minggu terakhir
                const recentData = originalChartData.filter(item => {
                    const itemDate = new Date(item.tanggal);
                    return itemDate >= fourWeeksAgo;
                });
                
                // Group data by week
                recentData.forEach(item => {
                    const itemDate = new Date(item.tanggal);
                    const weeksDiff = Math.floor((now - itemDate) / (7 * 24 * 60 * 60 * 1000));
                    let weekLabel;
                    
                    if (weeksDiff <= 0) weekLabel = "Minggu 4";
                    else if (weeksDiff <= 1) weekLabel = "Minggu 3";
                    else if (weeksDiff <= 2) weekLabel = "Minggu 2";
                    else weekLabel = "Minggu 1";
                    
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
                
                // Ensure all 4 weeks exist
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
                // Buat data untuk 12 bulan dimulai dari Januari
                const monthlyData = {};
                const currentYear = now.getFullYear();
                
                // Array bulan dimulai dari Januari
                const monthNames = [
                    "Jan", "Feb", "Mar", "Apr", 
                    "Mei", "Jun", "Jul", "Agu",
                    "Sep", "Okt", "Nov", "Des"
                ];
                
                // Initialize 12 months starting from January
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
                
                // Group existing data by month
                originalChartData.forEach(item => {
                    const itemDate = new Date(item.tanggal);
                    const itemYear = itemDate.getFullYear();
                    const itemMonth = itemDate.getMonth(); // 0-11
                    
                    // Only include data from current year
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
            
            console.log(`✅ Chart filtered for ${newPeriod}:`, filteredData);
        }
    };

    useEffect(() => {
        const loadDashboardData = async () => {
            setLoading(true);
            try {
                console.log('🔄 Loading dashboard data...');
                
                // Fetch data from API
                const response = await DashboardApi.getDashboardData();
                console.log('📊 Dashboard API response:', response);
                
                if (response.success && response.data) {
                    const data = response.data;
                    
                    // Store original chart data for filtering
                    const chartData = data.chartData || [];
                    setOriginalChartData(chartData);
                    
                    setDashboardData({
                        hadir: data.stats.hadir || 0,
                        tidakHadir: data.stats.tidakHadir || 0,
                        todayHadir: data.stats.todayHadir || 0,
                        todayTidakHadir: data.stats.todayTidakHadir || 0,
                        ringkasan: data.recentAttendance || [],
                        chartData: chartData
                    });
                    
                    // Apply initial filter (weekly by default - hari Senin-Minggu)
                    if (chartData.length > 0) {
                        const now = new Date();
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        const recentData = chartData.filter(item => {
                            const itemDate = new Date(item.tanggal);
                            return itemDate >= weekAgo;
                        }).slice(-7);
                        
                        // Format untuk hari dalam seminggu
                        const weeklyChart = recentData.map(item => ({
                            ...item,
                            hari: new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'long' })
                        }));
                        
                        setDashboardData(prev => ({
                            ...prev,
                            chartData: weeklyChart
                        }));
                    }
                    
                    console.log('✅ Dashboard data updated successfully');
                } else {
                    console.error('❌ Dashboard API failed:', response);
                }
                
            } catch (error) {
                console.error('❌ Error loading dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
        
        // Auto refresh every 30 seconds
        const interval = setInterval(() => {
            console.log('🔄 Auto refresh dashboard...');
            loadDashboardData();
        }, 30000);
        
        return () => clearInterval(interval);
    }, []);

    // Filter ringkasan berdasarkan search term
    const filteredRingkasan = dashboardData.ringkasan.filter(item =>
        item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tanggal.includes(searchTerm) ||
        item.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
        setCurrentPage(1); // Reset ke halaman pertama saat search
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
        <div>
            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                {/* Header */}
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    <div>
                        <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
                            Welcome to Sistem Absensi Reslab, <span className="text-orange-600 font-bold">Admin</span>
                        </h1>
                        <p className="text-3xl md:text-4xl font-bold mt-2">Dashboard</p>
                    </div>
                    <div className="mt-4 sm:mt-0 flex items-center bg-white rounded-full py-2 px-4 shadow-sm cursor-pointer">
                        <User size={20} className="text-gray-600 mr-2" />
                        <span className="font-medium text-gray-700">Admin</span>
                        <ChevronDown size={18} className="ml-2 text-gray-500" />
                    </div>
                </header>

                {/* Statistik Cards */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Hadir */}
                    <div className="bg-white rounded-xl p-6 shadow-md border-t-4 border-green-500">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-500">Total Hadir</h3>
                            <UserCheck size={24} className="text-green-500" />
                        </div>
                        <div className="flex items-end justify-between">
                            <span className="text-4xl font-bold text-gray-800">{dashboardData.hadir}</span>
                            <span className="text-sm text-gray-500">orang</span>
                        </div>
                    </div>

                    {/* Total Tidak Hadir */}
                    <div className="bg-white rounded-xl p-6 shadow-md border-t-4 border-red-500">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-500">Total Tidak Hadir</h3>
                            <XCircle size={24} className="text-red-500" />
                        </div>
                        <div className="flex items-end justify-between">
                            <span className="text-4xl font-bold text-gray-800">{dashboardData.tidakHadir}</span>
                            <span className="text-sm text-gray-500">orang</span>
                        </div>
                    </div>

                    {/* Hadir Hari Ini */}
                    <div className="bg-white rounded-xl p-6 shadow-md border-t-4 border-blue-500">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-500">Hadir Hari Ini</h3>
                            <UserCheck size={24} className="text-blue-500" />
                        </div>
                        <div className="flex items-end justify-between">
                            <span className="text-4xl font-bold text-gray-800">{dashboardData.todayHadir}</span>
                            <span className="text-sm text-gray-500">orang</span>
                        </div>
                    </div>

                    {/* Tidak Hadir Hari Ini */}
                    <div className="bg-white rounded-xl p-6 shadow-md border-t-4 border-yellow-500">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-500">Tidak Hadir Hari Ini</h3>
                            <XCircle size={24} className="text-yellow-500" />
                        </div>
                        <div className="flex items-end justify-between">
                            <span className="text-4xl font-bold text-gray-800">{dashboardData.todayTidakHadir}</span>
                            <span className="text-sm text-gray-500">orang</span>
                        </div>
                    </div>
                </section>

                {/* Grafik Kehadiran */}
                <section className="bg-white rounded-xl p-6 shadow-md mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-800">
                            Grafik Kehadiran {
                                chartPeriod === 'weekly' ? '(Senin - Minggu)' :
                                chartPeriod === 'monthly' ? '(4 Minggu Terakhir)' :
                                chartPeriod === 'yearly' ? '(Jan - Des)' : ''
                            }
                        </h3>
                        
                        {/* Period Filter */}
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => handlePeriodChange('weekly')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    chartPeriod === 'weekly'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-800'
                                }`}
                            >
                                Mingguan
                            </button>
                            <button
                                onClick={() => handlePeriodChange('monthly')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    chartPeriod === 'monthly'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-800'
                                }`}
                            >
                                Bulanan
                            </button>
                            <button
                                onClick={() => handlePeriodChange('yearly')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    chartPeriod === 'yearly'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-800'
                                }`}
                            >
                                Tahunan
                            </button>
                        </div>
                    </div>
                    
                    <div className="relative">
                        {loading && (
                            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                                <div className="text-gray-500">Memuat data chart...</div>
                            </div>
                        )}
                        
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={dashboardData.chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey={
                                        chartPeriod === 'yearly' ? 'bulan' : 
                                        chartPeriod === 'monthly' ? 'minggu' : 
                                        'hari'
                                    }
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis />
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
                        
                        {/* Debug info for development */}
                        <div className="mt-2 text-xs text-gray-500">
                            Period: {chartPeriod} | Data points: {dashboardData.chartData.length}
                        </div>
                    </div>
                </section>

                {/* Ringkasan Absensi */}
                <section className="bg-white rounded-xl p-6 shadow-md">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-800 mb-2 sm:mb-0">Ringkasan Absensi Terbaru</h3>
                        <div className="relative w-full sm:w-auto">
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
                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 rounded-lg">
                            <thead className="bg-orange-500 text-white">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Nama</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Tanggal</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Jam</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentRingkasan.length > 0 ? (
                                    currentRingkasan.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.nama}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.tanggal}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.jam}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`py-1 px-3 rounded-full text-xs font-semibold ${getStatusColor(item.status)}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="text-center py-6 text-gray-500">
                                            Tidak ada data ditemukan
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center mt-4">
                            <div className="text-sm text-gray-500">
                                Menampilkan {startIndex + 1} sampai {Math.min(startIndex + itemsPerPage, totalItems)} dari {totalItems} Data
                            </div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                <button
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={16} /> Sebelumnya
                                </button>
                                {Array.from({ length: totalPages }, (_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => goToPage(index + 1)}
                                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${index + 1 === currentPage ? 'text-white bg-orange-500 font-semibold' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                    >
                                        {index + 1}
                                    </button>
                                ))}
                                <button
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Selanjutnya <ChevronRight size={16} />
                                </button>
                            </nav>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}