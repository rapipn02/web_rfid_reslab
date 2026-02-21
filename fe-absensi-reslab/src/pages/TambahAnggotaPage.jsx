import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, ChevronDown, Scan, X, AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react';
import { MembersApi } from '../api/index.js';
import { safeTrim } from '../utils/utils';
import rfidApi from '../api/rfidApi';

export default function TambahAnggota() {
    const navigate = useNavigate();
    const scanIntervalRef = useRef(null);
    const scanTimeoutRef = useRef(null);

    const [formData, setFormData] = useState({
        nama: '',
        nim: '',
        idRfid: '',
        hariPiket: []
    });

    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showAlert, setShowAlert] = useState({ show: false, message: '', type: '' });
    const [isScanning, setIsScanning] = useState(false);
    const [scanCountdown, setScanCountdown] = useState(0);
    const [pendingRegistrations, setPendingRegistrations] = useState([]);
    const [lastScanCheck, setLastScanCheck] = useState(null);

    
    useEffect(() => {
        loadPendingRegistrations();
    }, []);

    
    useEffect(() => {
        return () => {
            if (scanIntervalRef.current) {
                clearInterval(scanIntervalRef.current);
            }
            if (scanTimeoutRef.current) {
                clearTimeout(scanTimeoutRef.current);
            }
        };
    }, []);

    const loadPendingRegistrations = async () => {
        try {
            const response = await rfidApi.getPendingRegistrations();
            if (response.success) {
                setPendingRegistrations(response.data || []);
            }
        } catch (error) {
            console.error('Error loading pending registrations:', error);
        }
    };

    
    const startRealtimeScan = async () => {
        try {
            setIsScanning(true);
            setScanCountdown(10);
            setLastScanCheck(new Date());

            showNotification(' Realtime scan dimulai! Scan RFID card dalam 10 detik...', 'info');

            
            let timeLeft = 10;
            const countdownInterval = setInterval(() => {
                timeLeft -= 1;
                setScanCountdown(timeLeft);
                
                if (timeLeft <= 0) {
                    clearInterval(countdownInterval);
                }
            }, 1000);

            
            const scanCheckInterval = setInterval(async () => {
                await checkForNewRealtimeScans();
            }, 500);

            scanIntervalRef.current = scanCheckInterval;

            
            const stopTimeout = setTimeout(() => {
                setIsScanning(false);
                setScanCountdown(0);
                clearInterval(countdownInterval);
                clearInterval(scanCheckInterval);
                showNotification('⏰ Scan timeout. Coba lagi jika diperlukan.', 'warning');
            }, 10000);

            scanTimeoutRef.current = stopTimeout;

        } catch (error) {
            console.error('Error starting realtime scan:', error);
            setIsScanning(false);
            setScanCountdown(0);
            showNotification(' Error memulai scan. Coba lagi.', 'error');
        }
    };

    
    const checkForNewRealtimeScans = async () => {
        try {
            
            const response = await rfidApi.getLatestScans();
            
            if (response.success && response.data && response.data.length > 0) {
                const latestScan = response.data[0]; 
                
                
                if (latestScan.cardId && latestScan.cardId !== formData.idRfid) {
                    setFormData(prev => ({
                        ...prev,
                        idRfid: latestScan.cardId.toUpperCase()
                    }));
                    
                    
                    setIsScanning(false);
                    setScanCountdown(0);
                    
                    if (scanIntervalRef.current) {
                        clearInterval(scanIntervalRef.current);
                    }
                    if (scanTimeoutRef.current) {
                        clearTimeout(scanTimeoutRef.current);
                    }
                    
                    
                    if (latestScan.scanType === 'unknown' || latestScan.processed === false) {
                        showNotification(`🆔 Kartu belum terdaftar: ${latestScan.cardId} - Silakan isi data untuk registrasi`, 'warning');
                    } else {
                        showNotification(`✅ RFID berhasil terdeteksi: ${latestScan.cardId}`, 'success');
                    }
                    
                    
                    setLastScanCheck(new Date());
                    
                    
                    await loadPendingRegistrations();
                }
            }
        } catch (error) {
            console.error('Error checking realtime scans:', error);
        }
    };

    const showNotification = (message, type = 'success') => {
        setShowAlert({ show: true, message, type });
        setTimeout(() => {
            setShowAlert({ show: false, message: '', type: '' });
        }, 3000);
    };

    const validateForm = () => {
        const newErrors = {};

        
        const namaValue = safeTrim(formData.nama);
        if (!namaValue) {
            newErrors.nama = 'Nama wajib diisi';
        } else if (namaValue.length < 2) {
            newErrors.nama = 'Nama minimal 2 karakter';
        }

        
        const nimValue = safeTrim(formData.nim);
        if (!nimValue) {
            newErrors.nim = 'NIM wajib diisi';
        } else if (!/^\d+$/.test(nimValue)) {
            newErrors.nim = 'NIM hanya boleh berisi angka';
        } else if (nimValue.length < 6) {
            newErrors.nim = 'NIM minimal 6 digit';
        }
        

        
        const rfidValue = safeTrim(formData.idRfid);
        if (!rfidValue) {
            newErrors.idRfid = 'ID RFID wajib diisi';
        } else if (rfidValue.length < 4) {
            newErrors.idRfid = 'ID RFID minimal 4 karakter';
        }
        

        
        if (!formData.hariPiket || formData.hariPiket.length === 0) {
            newErrors.hariPiket = 'Minimal pilih satu hari piket';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleHariPiketChange = (hari) => {
        setFormData(prev => {
            const currentHariPiket = prev.hariPiket || [];
            const isSelected = currentHariPiket.includes(hari);
            
            let newHariPiket;
            if (isSelected) {
                
                newHariPiket = currentHariPiket.filter(h => h !== hari);
            } else {
                
                newHariPiket = [...currentHariPiket, hari];
            }
            
            return {
                ...prev,
                hariPiket: newHariPiket
            };
        });

        
        if (errors.hariPiket) {
            setErrors(prev => ({
                ...prev,
                hariPiket: ''
            }));
        }
    };

    const handleScan = async () => {
        if (isScanning) {
            
            setIsScanning(false);
            setScanCountdown(0);
            
            if (scanIntervalRef.current) {
                clearInterval(scanIntervalRef.current);
            }
            if (scanTimeoutRef.current) {
                clearTimeout(scanTimeoutRef.current);
            }
            
            showNotification('🛑 Scan dibatalkan', 'info');
            return;
        }

        
        await startRealtimeScan();
    };

    const handleScan_old = async () => {
        setIsScanning(true);
        setIsLoading(true);
        
        try {
            
            await loadPendingRegistrations();
            
            if (pendingRegistrations.length > 0) {
                
                const latestRegistration = pendingRegistrations[0];
                const scannedCardId = latestRegistration.cardId;
                
                setFormData(prev => ({
                    ...prev,
                    idRfid: scannedCardId
                }));
                
                showNotification(`RFID Card ${scannedCardId} detected! Fill in member details.`, 'success');
                
                
                if (errors.idRfid) {
                    setErrors(prev => ({
                        ...prev,
                        idRfid: ''
                    }));
                }
            } else {
                showNotification('No new RFID scan detected. Please scan a card on the RFID reader first.', 'info');
            }
        } catch (error) {
            console.error('Error during scan:', error);
            showNotification('Error connecting to RFID scanner', 'error');
        } finally {
            setIsScanning(false);
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({ nama: '', nim: '', idRfid: '' });
        setErrors({});
        navigate('/anggota');
    };

    const handleSave = async () => {
        if (!validateForm()) {
            showNotification('Mohon perbaiki kesalahan pada form', 'error');
            return;
        }

        setIsLoading(true);

        try {
            console.log('Saving member data:', formData);
            
            const memberData = {
                nama: safeTrim(formData.nama),
                nim: safeTrim(formData.nim),
                idRfid: safeTrim(formData.idRfid),
                hariPiket: formData.hariPiket || []
            };

            const response = await MembersApi.create(memberData);
            console.log('Member create response:', response);
            
            if (response.success) {
                showNotification(`Anggota "${memberData.nama}" berhasil ditambahkan!`, 'success');
                
                setTimeout(() => {
                    navigate('/anggota');
                }, 1500);
            } else {
                
                if (response.message.includes('NIM') && response.message.includes('sudah')) {
                    setErrors(prev => ({ ...prev, nim: 'NIM sudah terdaftar' }));
                } else if (response.message.includes('RFID') && response.message.includes('sudah')) {
                    setErrors(prev => ({ ...prev, idRfid: 'ID RFID sudah terdaftar' }));
                }
                showNotification(response.message || 'Gagal menambahkan anggota', 'error');
            }
        } catch (error) {
            console.error('Error creating member:', error);
            showNotification('Terjadi kesalahan saat menambahkan anggota', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main data-aos="fade-up" className="flex-1 p-4 md:p-8 overflow-y-auto">
<<<<<<< HEAD
            {}
=======
            {/* Alert Notification */}
>>>>>>> 89831ac93b04d077ece0b9b6e91a794841d99de9
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
                    <p className="text-3xl md:text-4xl font-bold mt-2">Tambah Anggota</p>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center bg-white rounded-full py-2 px-4 shadow-sm cursor-pointer">
                    <User size={20} className="text-gray-600 mr-2" />
                    <span className="font-medium text-gray-700">Admin</span>
                    <ChevronDown size={18} className="ml-2 text-gray-500" />
                </div>
            </header>

            {}
            <section className="bg-white rounded-xl p-6 shadow-md max-w-2xl w-full mx-auto">
                <div className="space-y-6">
                    {}
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                        <label className="text-gray-700 font-medium w-24 flex-shrink-0 pt-2">
                            Nama <span className="text-red-500">*</span>
                        </label>
                        <div className="flex-1">
                            <input
                                type="text"
                                name="nama"
                                value={formData.nama}
                                onChange={handleInputChange}
                                placeholder="Masukkan nama lengkap"
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-1 focus:ring-orange-500 text-sm ${
                                    errors.nama ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-orange-500'
                                }`}
                            />
                            {errors.nama && (
                                <p className="text-red-500 text-xs mt-1">{errors.nama}</p>
                            )}
                        </div>
                    </div>

                    {}
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                        <label className="text-gray-700 font-medium w-24 flex-shrink-0 pt-2">
                            NIM <span className="text-red-500">*</span>
                        </label>
                        <div className="flex-1">
                            <input
                                type="text"
                                name="nim"
                                value={formData.nim}
                                onChange={handleInputChange}
                                placeholder="Masukkan NIM (contoh: 210511001)"
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-1 focus:ring-orange-500 text-sm ${
                                    errors.nim ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-orange-500'
                                }`}
                            />
                            {errors.nim && (
                                <p className="text-red-500 text-xs mt-1">{errors.nim}</p>
                            )}
                        </div>
                    </div>

                    {}
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                        <label className="text-gray-700 font-medium w-24 flex-shrink-0 pt-2">
                            ID RFID <span className="text-red-500">*</span>
                        </label>
                        <div className="flex-1">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    name="idRfid"
                                    value={formData.idRfid}
                                    onChange={handleInputChange}
                                    placeholder="Scan atau input ID RFID"
                                    className={`flex-1 px-4 py-2 border rounded-lg focus:ring-1 focus:ring-orange-500 text-sm ${
                                        errors.idRfid ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-orange-500'
                                    }`}
                                />
                                <button
                                    onClick={handleScan}
                                    disabled={isLoading}
                                    className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors font-medium text-sm ${
                                        isScanning 
                                            ? 'bg-red-500 hover:bg-red-600 text-white' 
                                            : 'bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white'
                                    }`}
                                >
                                    {isScanning ? (
                                        <>
                                            <X size={16} />
                                            <span>Stop ({scanCountdown}s)</span>
                                        </>
                                    ) : (
                                        <>
                                            <Zap size={16} />
                                            <span>Realtime Scan</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {}
                            {isScanning && (
                                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <Clock size={16} className="text-yellow-600 animate-pulse" />
                                        <span className="text-yellow-800 text-sm font-medium">
                                            Scanning aktif... {scanCountdown} detik tersisa
                                        </span>
                                    </div>
                                    <p className="text-yellow-700 text-xs mt-1">
                                        Tempelkan kartu RFID pada scanner ESP32 sekarang!
                                    </p>
                                </div>
                            )}

                            {errors.idRfid && (
                                <p className="text-red-500 text-xs mt-1">{errors.idRfid}</p>
                            )}
                            <p className="text-gray-500 text-xs mt-1">
                                ID RFID harus unik untuk setiap anggota
                            </p>
                            
                            {}
                            {pendingRegistrations.length > 0 && (
                                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <h4 className="text-sm font-medium text-blue-800 mb-2">
                                        Pending RFID Scans:
                                    </h4>
                                    <div className="space-y-2">
                                        {pendingRegistrations.slice(0, 3).map((reg) => (
                                            <div key={reg.id} className="flex items-center justify-between text-sm">
                                                <span className="text-blue-700 font-mono">
                                                    Card: {reg.cardId}
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            idRfid: reg.cardId
                                                        }));
                                                        if (errors.idRfid) {
                                                            setErrors(prev => ({...prev, idRfid: ''}));
                                                        }
                                                    }}
                                                    className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                                >
                                                    Use This
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    {pendingRegistrations.length > 3 && (
                                        <p className="text-xs text-blue-600 mt-2">
                                            +{pendingRegistrations.length - 3} more cards pending...
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {}
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                        <label className="text-gray-700 font-medium w-24 flex-shrink-0 pt-2">
                            Hari Piket <span className="text-red-500">*</span>
                        </label>
                        <div className="flex-1">
                            <div className={`border rounded-lg p-3 ${
                                errors.hariPiket ? 'border-red-500' : 'border-gray-300'
                            }`}>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].map(hari => (
                                        <label key={hari} className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.hariPiket.includes(hari)}
                                                onChange={() => handleHariPiketChange(hari)}
                                                className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                                            />
                                            <span className="text-sm text-gray-700">{hari}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            {errors.hariPiket && (
                                <p className="text-red-500 text-xs mt-1">{errors.hariPiket}</p>
                            )}
                            <p className="text-gray-500 text-xs mt-1">
                                Pilih hari piket
                            </p>
                        </div>
                    </div>
                </div>

                {}
                <div className="flex justify-end gap-3 mt-8">
                    <button
                        onClick={handleCancel}
                        disabled={isLoading}
                        className="bg-white hover:bg-gray-50 disabled:bg-gray-100 text-gray-700 border border-gray-300 px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors font-medium"
                    >
                        <X className="w-4 h-4" />
                        <span>Batal</span>
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-6 py-2 rounded-lg transition-colors font-medium"
                    >
                        {isLoading ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>
            </section>
        </main>
    );
}