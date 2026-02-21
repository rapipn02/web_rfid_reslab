import React, { useState, useEffect } from 'react';
import { Calendar, User, ChevronDown, ChevronLeft, ChevronRight, Download, X, FileText, Table, BarChart3, CheckCircle, AlertTriangle } from 'lucide-react';
import AttendanceApi from '../api/attendanceApi';
import MembersApi from '../api/membersApi';
import { DashboardApi } from '../api/index.js';

export default function LaporanPage() {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [openExport, setOpenExport] = useState(false);
    const [filteredData, setFilteredData] = useState([]);
    const [attendanceData, setAttendanceData] = useState([]);
    const [showAlert, setShowAlert] = useState({ show: false, message: '', type: '' });
    const [dashboardStats, setDashboardStats] = useState({
        totalAttendance: 0,
        hadir: 0,
        tidakPiket: 0,
        sedangPiket: 0,
        belumPiket: 0
    });

    const itemsPerPage = 10;

    useEffect(() => {
        const loadData = async () => {
            try {
                
                const [attendanceResponse, membersResponse, dashboardResponse] = await Promise.all([
                    AttendanceApi.getAll(),
                    MembersApi.getAll(),
                    DashboardApi.getDashboardData()
                ]);
                
                if (attendanceResponse.success && membersResponse.success) {
                    
                    const mergedData = attendanceResponse.data.map(attendance => {
                        
                        const member = membersResponse.data.find(m => 
                            m.id === attendance.memberId || 
                            m.id === attendance.anggotaId ||
                            m.nim === attendance.nim ||
                            m.idRfid === attendance.idRfid ||
                            (m.nama && attendance.nama && m.nama.toLowerCase().trim() === attendance.nama.toLowerCase().trim())
                        );
                        
                        return {
                            ...attendance,
                            
                            nama: member?.nama || attendance.nama || 'Unknown Member',
                            nim: member?.nim || attendance.nim || 'N/A',
                            idRfid: member?.idRfid || attendance.idRfid || 'N/A',
                            member: member || null
                        };
                    });
                    
                    console.log('Total attendance records:', mergedData.length);
                    
                    
                    const validData = mergedData.filter(item => {
                        const hasValidName = item.nama && item.nama.trim().length > 0 && item.nama !== 'Unknown Member';
                        const hasValidDate = item.tanggal || item.createdAt;
                        return hasValidName && hasValidDate;
                    });
                    
                    console.log('Valid records:', validData.length);
                    console.log('Filtered out:', mergedData.length - validData.length, 'incomplete records');
                    
                    setAttendanceData(validData);
                    setFilteredData(validData);
                }
                
                
                if (dashboardResponse.success && dashboardResponse.data) {
                    setDashboardStats({
                        totalAttendance: dashboardResponse.data.stats.totalAttendance || 0,
                        hadir: dashboardResponse.data.stats.hadir || 0,
                        tidakPiket: dashboardResponse.data.stats.tidakPiket || 0,
                        sedangPiket: dashboardResponse.data.stats.sedangPiket || 0,
                        belumPiket: dashboardResponse.data.stats.belumPiket || 0
                    });
                }
                
                if (!attendanceResponse.success || !membersResponse.success) {
                    console.error('Failed to load data:', { attendance: attendanceResponse, members: membersResponse });
                    showNotification('Gagal memuat data laporan', 'error');
                }
            } catch (error) {
                console.error('Error loading laporan data:', error);
                showNotification('Error saat memuat data', 'error');
            }
        };

        loadData();
    }, []);

    const showNotification = (message, type = 'success') => {
        setShowAlert({ show: true, message, type });
        setTimeout(() => {
            setShowAlert({ show: false, message: '', type: '' });
        }, 3000);
    };

    
    const validFilteredData = filteredData.filter(item => {
        const hasValidName = item.nama && item.nama.trim().length > 0 && item.nama !== 'Unknown Member';
        const hasValidDate = item.tanggal || item.createdAt;
        return hasValidName && hasValidDate;
    });
    
    const totalItems = validFilteredData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentData = validFilteredData.slice(startIndex, startIndex + itemsPerPage);

    const handlePreview = () => {
        if (!startDate && !endDate) {
            showNotification('Pilih minimal satu tanggal untuk filter', 'error');
            return;
        }

        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            showNotification('Tanggal mulai tidak boleh lebih besar dari tanggal akhir', 'error');
            return;
        }

        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        const newFilteredData = attendanceData.filter(item => {
            
            const itemDateStr = item.tanggal || item.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0];
            const itemDate = new Date(itemDateStr);
            return (!start || itemDate >= start) && (!end || itemDate <= end);
        });

        setFilteredData(newFilteredData);
        setCurrentPage(1);

        if (newFilteredData.length === 0) {
            showNotification('Tidak ada data dalam rentang tanggal yang dipilih', 'error');
        } else {
            showNotification(`Ditemukan ${newFilteredData.length} record dalam rentang tanggal yang dipilih`, 'success');
        }
    };

    const handleClearFilter = () => {
        setStartDate('');
        setEndDate('');
        setFilteredData(attendanceData);
        setCurrentPage(1);
        showNotification('Filter berhasil direset', 'success');
    };

    const generateCSV = (data) => {
        const headers = ["No", "Nama", "Tanggal", "Jam Datang", "Status"];
        const rows = data.map((item, index) => [
            index + 1,
            `"${item.nama}"`, 
            item.tanggal || item.createdAt?.split('T')[0] || 'N/A',
            item.jamDatang || '-',
            item.status
        ]);

        return [headers, ...rows].map(row => row.join(",")).join("\n");
    };

    const generateTextReport = (data) => {
        const reportStats = {
            total: data.length,
            hadir: data.filter(item => item.status === 'Hadir').length,
            tidakPiket: data.filter(item => 
                item.status === 'Tidak Hadir' || item.status === 'Tidak Piket'
            ).length,
            sedangPiket: data.filter(item => item.status === 'Sedang Piket').length
        };

        let report = `LAPORAN ABSENSI RESLAB\n`;
        report += `=========================\n\n`;
        
        if (startDate || endDate) {
            report += `Periode: ${startDate || 'Awal'} sampai ${endDate || 'Akhir'}\n`;
        }
        report += `Tanggal Generate: ${new Date().toLocaleDateString('id-ID')}\n\n`;
        
        report += `STATISTIK:\n`;
        report += `- Total Records: ${reportStats.total}\n`;
        report += `- Hadir: ${reportStats.hadir} (${reportStats.total > 0 ? ((reportStats.hadir/reportStats.total)*100).toFixed(1) : '0'}%)\n`;
        report += `- Tidak Piket: ${reportStats.tidakPiket} (${reportStats.total > 0 ? ((reportStats.tidakPiket/reportStats.total)*100).toFixed(1) : '0'}%)\n`;
        report += `- Sedang Piket: ${reportStats.sedangPiket} (${reportStats.total > 0 ? ((reportStats.sedangPiket/reportStats.total)*100).toFixed(1) : '0'}%)\n\n`;
        
        report += `DETAIL ABSENSI:\n`;
        report += `${'No'.padEnd(4)} ${'Nama'.padEnd(25)} ${'Tanggal'.padEnd(12)} ${'Jam Datang'.padEnd(12)} Status\n`;
        report += `${'-'.repeat(65)}\n`;
        
        data.forEach((item, index) => {
            const tanggal = item.tanggal || item.createdAt?.split('T')[0] || 'N/A';
            const jamDatang = item.jamDatang || '-';
            report += `${(index + 1).toString().padEnd(4)} ${item.nama.padEnd(25)} ${tanggal.padEnd(12)} ${jamDatang.padEnd(12)} ${item.status}\n`;
        });

        return report;
    };

    const handleExport = (format) => {
        if (filteredData.length === 0) {
            showNotification("Tidak ada data untuk diexport", 'error');
            return;
        }

        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `laporan_absensi_${timestamp}`;

        try {
            if (format === 'CSV') {
                const csvContent = generateCSV(filteredData);
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", `${filename}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showNotification('File CSV berhasil didownload', 'success');
            }

            if (format === 'TXT') {
                const textContent = generateTextReport(filteredData);
                const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", `${filename}.txt`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showNotification('File TXT berhasil didownload', 'success');
            }

            if (format === 'JSON') {
                const jsonContent = JSON.stringify({
                    generatedAt: new Date().toISOString(),
                    period: {
                        startDate: startDate || null,
                        endDate: endDate || null
                    },
                    statistics: {
                        total: filteredData.length,
                        hadir: filteredData.filter(item => item.status === 'Hadir').length,
                        tidakHadir: filteredData.filter(item => item.status === 'Tidak Hadir').length
                    },
                    data: filteredData
                }, null, 2);
                
                const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", `${filename}.json`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showNotification('File JSON berhasil didownload', 'success');
            }
        } catch (error) {
            showNotification(`Gagal mengexport file ${format}`, error.message || 'error');
        }

        setOpenExport(false);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Hadir': return 'bg-green-100 text-green-800';
            case 'Tidak Piket': return 'bg-red-100 text-red-800';
            case 'Sedang Piket': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    
    const hasActiveFilter = startDate || endDate;

    
    const stats = {
        total: filteredData.length,
        hadir: filteredData.filter(item => item.status === 'Hadir').length,
        tidakHadir: filteredData.filter(item => 
            item.status === 'Tidak Hadir' || item.status === 'Tidak Piket'
        ).length,
        sedangPiket: filteredData.filter(item => item.status === 'Sedang Piket').length,
        belumPiket: filteredData.filter(item => item.status === 'Belum Piket').length
    };

    
    const FormatDayDate = (dateString) => {
        if (!dateString) return 'N/A';
        
        const date = new Date(dateString);
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const dayName = days[date.getDay()];
        
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        return `${dayName} / ${day}-${month}-${year}`;
    };

    
    const CalculateDuration = (jamDatang, jamPulang) => {
        if (!jamDatang || !jamPulang || jamDatang === '-' || jamPulang === '-') {
            return '-';
        }

        try {
            const [startHour, startMin] = jamDatang.split(':').map(Number);
            const [endHour, endMin] = jamPulang.split(':').map(Number);
            
            const startMinutes = startHour * 60 + startMin;
            const endMinutes = endHour * 60 + endMin;
            
            let diffMinutes = endMinutes - startMinutes;
            
            
            if (diffMinutes < 0) {
                diffMinutes += 24 * 60;
            }
            
            const hours = Math.floor(diffMinutes / 60);
            const minutes = diffMinutes % 60;
            
            return `${hours}j ${minutes}m`;
        } catch {
            return '-';
        }
    };

    return (
        <main data-aos="fade-up" className="flex-1 p-4 md:p-8 overflow-y-auto">
            {}
            {showAlert.show && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border-l-4 ${
                    showAlert.type === 'success' 
                        ? 'bg-green-50 border-green-400 text-green-800' 
                        : 'bg-red-50 border-red-400 text-red-800'
                }`}>
                    <div className="flex items-center">
                        {showAlert.type === 'success' ? (
                            <CheckCircle size={20} className="mr-2" />
                        ) : (
                            <AlertTriangle size={20} className="mr-2" />
                        )}
                        <span className="font-medium">{showAlert.message}</span>
                    </div>
                </div>
            )}

            {}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
                        Welcome to Sistem Absensi Reslab, <span className="text-orange-600 font-bold">Admin</span>
                    </h1>
                    <p className="text-3xl md:text-4xl font-bold mt-2">
                        Laporan Absensi RFID RESLAB {!hasActiveFilter }
                    </p>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center bg-white rounded-full py-2 px-4 shadow-sm cursor-pointer">
                    <User size={20} className="text-gray-600 mr-2" />
                    <span className="font-medium text-gray-700">reslab jaya</span>
                </div>
            </header>

            {}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-6 gap-4">
                <div className="flex flex-wrap items-end gap-4">
                    {}
                    <div className="relative flex flex-col">
                        <label className="text-xs font-medium text-gray-600 mb-1">Dari Tanggal</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm"
                        />
                        <Calendar size={18} className="absolute left-3 bottom-2.5 text-gray-400" />
                    </div>
                    
                    {}
                    <div className="relative flex flex-col">
                        <label className="text-xs font-medium text-gray-600 mb-1">Sampai</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm"
                        />
                        <Calendar size={18} className="absolute left-3 bottom-2.5 text-gray-400" />
                    </div>
                    
                    <button
                        onClick={handlePreview}
                        className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 text-sm font-medium">
                        Preview
                    </button>
                    
                    {}
                    {hasActiveFilter && (
                        <button
                            onClick={handleClearFilter}
                            className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 text-sm font-medium"
                        >
                            <X size={16} />
                            <span>Clear Filter</span>
                        </button>
                    )}
                </div>

                {}
                <div className="relative">
                    <button
                        onClick={() => setOpenExport(!openExport)}
                        disabled={filteredData.length === 0}
                        className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
                    >
                        <Download size={16} />
                        <span>Export</span>
                        <ChevronDown size={16} />
                    </button>
                    {openExport && filteredData.length > 0 && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-10">
                            <div className="py-1">
                                <button
                                    onClick={() => handleExport('CSV')}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 text-sm"
                                >
                                    <Table size={16} className="text-green-600" />
                                    <span>Export as CSV</span>
                                </button>
                                <button
                                    onClick={() => handleExport('TXT')}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 text-sm"
                                >
                                    <FileText size={16} className="text-blue-600" />
                                    <span>Export as TXT</span>
                                </button>
                                <button
                                    onClick={() => handleExport('JSON')}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 text-sm"
                                >
                                    <BarChart3 size={16} className="text-purple-600" />
                                    <span>Export as JSON</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {}
            {hasActiveFilter && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-blue-800">
                            <span className="font-medium">Filter aktif:</span>
                            {startDate && <span className="ml-2">Dari: {startDate}</span>}
                            {endDate && <span className="ml-2">Sampai: {endDate}</span>}
                            <span className="ml-4 font-semibold">({filteredData.length} records)</span>
                        </div>
                        <button
                            onClick={handleClearFilter}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            Hapus Filter
                        </button>
                    </div>
                </div>
            )}

            {}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-md border-l-4 border-blue-500">
                    <h4 className="text-sm sm:text-base font-medium text-gray-600">Total Records</h4>
                    <p className="text-xl sm:text-3xl font-bold text-gray-800 mt-2">
                        {hasActiveFilter ? stats.total : dashboardStats.totalAttendance}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        {hasActiveFilter ? 'Filtered' : 'All time'}
                    </p>
                </div>
                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-md border-l-4 border-green-500">
                    <h4 className="text-sm sm:text-base font-medium text-gray-600">Hadir</h4>
                    <p className="text-xl sm:text-3xl font-bold text-green-600 mt-2">
                        {hasActiveFilter ? stats.hadir : dashboardStats.hadir}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        {hasActiveFilter 
                            ? (stats.total > 0 ? `${((stats.hadir/stats.total)*100).toFixed(1)}%` : '0%')
                            : (dashboardStats.totalAttendance > 0 ? `${((dashboardStats.hadir/dashboardStats.totalAttendance)*100).toFixed(1)}%` : '0%')
                        }
                    </p>
                </div>
                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-md border-l-4 border-red-500">
                    <h4 className="text-sm sm:text-base font-medium text-gray-600">Tidak Piket</h4>
                    <p className="text-xl sm:text-3xl font-bold text-red-600 mt-2">
                        {hasActiveFilter ? stats.tidakHadir : dashboardStats.tidakPiket}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        {hasActiveFilter 
                            ? (stats.total > 0 ? `${((stats.tidakHadir/stats.total)*100).toFixed(1)}%` : '0%')
                            : (dashboardStats.totalAttendance > 0 ? `${((dashboardStats.tidakPiket/dashboardStats.totalAttendance)*100).toFixed(1)}%` : '0%')
                        }
                    </p>
                </div>
                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-md border-l-4 border-yellow-500">
                    <h4 className="text-sm sm:text-base font-medium text-gray-600">Sedang Piket</h4>
                    <p className="text-xl sm:text-3xl font-bold text-yellow-600 mt-2">
                        {hasActiveFilter ? stats.sedangPiket : dashboardStats.sedangPiket}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        {hasActiveFilter 
                            ? (stats.total > 0 ? `${((stats.sedangPiket/stats.total)*100).toFixed(1)}%` : '0%')
                            : (dashboardStats.totalAttendance > 0 ? `${((dashboardStats.sedangPiket/dashboardStats.totalAttendance)*100).toFixed(1)}%` : '0%')
                        }
                    </p>
                </div>
            </section>

            {}
            <section className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-700">
                        Data Laporan Absensi
                    </h3>
                    {filteredData.length > 0 && (
                        <div className="text-sm text-gray-500">
                            {filteredData.length} records total
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 rounded-lg">
                        <thead className="bg-orange-500 text-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">No</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Nama</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Hari / Tanggal</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Jam Datang</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Jam Pulang</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Durasi</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {currentData.length > 0 ? (
                                currentData.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {startIndex + index + 1}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.nama}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {(() => {
                                                if (item.tanggal) return FormatDayDate(item.tanggal);
                                                if (item.createdAt) {
                                                    try {
                                                        const date = new Date(item.createdAt);
                                                        if (!isNaN(date.getTime())) {
                                                            return FormatDayDate(date.toISOString().split('T')[0]);
                                                        }
                                                    } catch {
                                                        return '-';
                                                    }
                                                }
                                                return '-';
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.jamDatang === '-' ? (
                                                <span className="text-gray-400 italic">-</span>
                                            ) : (
                                                <span className="font-mono">{item.jamDatang}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.jamPulang === '-' || !item.jamPulang ? (
                                                <span className="text-gray-400 italic">-</span>
                                            ) : (
                                                <span className="font-mono">{item.jamPulang}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className="font-mono">{CalculateDuration(item.jamDatang, item.jamPulang)}</span>
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
                                    <td colSpan="7" className="text-center py-8 text-gray-500">
                                        {hasActiveFilter ? (
                                            <div>
                                                <p className="mb-2">Tidak ada data dalam rentang tanggal yang dipilih</p>
                                                <button
                                                    onClick={handleClearFilter}
                                                    className="text-orange-600 hover:text-orange-700 font-medium text-sm"
                                                >
                                                    Reset Filter
                                                </button>
                                            </div>
                                        ) : (
                                            'Tidak ada data laporan ditemukan'
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {}
                {filteredData.length > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-6 space-y-3 sm:space-y-0">
                        <div className="text-xs sm:text-sm text-gray-500 order-2 sm:order-1">
                            Menampilkan {startIndex + 1} sampai {Math.min(startIndex + itemsPerPage, totalItems)} dari {totalItems} Data
                        </div>
                        {totalPages > 1 && (
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
                                            className={`relative inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 text-xs sm:text-sm font-medium ${
                                                pageNum === currentPage 
                                                    ? 'text-white bg-orange-500 font-semibold' 
                                                    : 'bg-white text-gray-700 hover:bg-gray-50'
                                            }`}
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
                                    <span className="hidden sm:inline mr-1">Selanjutnya</span>
                                    <ChevronRight size={14} />
                                </button>
                            </nav>
                        )}
                    </div>
                )}
            </section>
        </main>
    );
}