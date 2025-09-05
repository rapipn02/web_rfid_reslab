import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ChevronDown, Scan, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { MembersApi } from '../api/index.js';
import { safeTrim } from '../utils/utils';

export default function TambahAnggota() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        nama: '',
        nim: '',
        idRfid: '',
        hariPiket: []
    });

    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showAlert, setShowAlert] = useState({ show: false, message: '', type: '' });

    const showNotification = (message, type = 'success') => {
        setShowAlert({ show: true, message, type });
        setTimeout(() => {
            setShowAlert({ show: false, message: '', type: '' });
        }, 3000);
    };

    const validateForm = () => {
        const newErrors = {};

        // Validasi nama
        const namaValue = safeTrim(formData.nama);
        if (!namaValue) {
            newErrors.nama = 'Nama wajib diisi';
        } else if (namaValue.length < 2) {
            newErrors.nama = 'Nama minimal 2 karakter';
        }

        // Validasi NIM
        const nimValue = safeTrim(formData.nim);
        if (!nimValue) {
            newErrors.nim = 'NIM wajib diisi';
        } else if (!/^\d+$/.test(nimValue)) {
            newErrors.nim = 'NIM hanya boleh berisi angka';
        } else if (nimValue.length < 6) {
            newErrors.nim = 'NIM minimal 6 digit';
        }
        // Note: Validasi duplikat akan dilakukan di backend

        // Validasi RFID
        const rfidValue = safeTrim(formData.idRfid);
        if (!rfidValue) {
            newErrors.idRfid = 'ID RFID wajib diisi';
        } else if (rfidValue.length < 4) {
            newErrors.idRfid = 'ID RFID minimal 4 karakter';
        }
        // Note: Validasi duplikat akan dilakukan di backend

        // Validasi Hari Piket
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

        // Clear error untuk field yang sedang diubah
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
                // Remove hari if already selected
                newHariPiket = currentHariPiket.filter(h => h !== hari);
            } else {
                // Add hari if not selected
                newHariPiket = [...currentHariPiket, hari];
            }
            
            return {
                ...prev,
                hariPiket: newHariPiket
            };
        });

        // Clear error untuk field hari piket
        if (errors.hariPiket) {
            setErrors(prev => ({
                ...prev,
                hariPiket: ''
            }));
        }
    };

    const handleScan = () => {
        setIsLoading(true);
        
        // Simulate scanning delay
        setTimeout(() => {
            // Generate simple RFID ID (dalam implementasi nyata, ini dari scanner RFID)
            const newRfid = 'RF' + Date.now().toString().slice(-8);
            setFormData(prev => ({
                ...prev,
                idRfid: newRfid
            }));
            
            // Clear RFID error jika ada
            if (errors.idRfid) {
                setErrors(prev => ({
                    ...prev,
                    idRfid: ''
                }));
            }
            
            setIsLoading(false);
            showNotification('RFID berhasil di-scan!', 'success');
        }, 1500);
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
            console.log('💾 Saving member data:', formData);
            
            const memberData = {
                nama: safeTrim(formData.nama),
                nim: safeTrim(formData.nim),
                idRfid: safeTrim(formData.idRfid),
                hariPiket: formData.hariPiket || []
            };

            const response = await MembersApi.create(memberData);
            console.log('💾 Member create response:', response);
            
            if (response.success) {
                showNotification(`Anggota "${memberData.nama}" berhasil ditambahkan!`, 'success');
                
                setTimeout(() => {
                    navigate('/anggota');
                }, 1500);
            } else {
                // Handle validation errors from backend
                if (response.message.includes('NIM') && response.message.includes('sudah')) {
                    setErrors(prev => ({ ...prev, nim: 'NIM sudah terdaftar' }));
                } else if (response.message.includes('RFID') && response.message.includes('sudah')) {
                    setErrors(prev => ({ ...prev, idRfid: 'ID RFID sudah terdaftar' }));
                }
                showNotification(response.message || 'Gagal menambahkan anggota', 'error');
            }
        } catch (error) {
            console.error('❌ Error creating member:', error);
            showNotification('Terjadi kesalahan saat menambahkan anggota', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
            {/* Alert Notification */}
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

            {/* Header */}
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

            {/* Form Card */}
            <section className="bg-white rounded-xl p-6 shadow-md max-w-2xl w-full mx-auto">
                <div className="space-y-6">
                    {/* Nama */}
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

                    {/* NIM */}
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

                    {/* RFID */}
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
                                    className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors font-medium text-sm"
                                >
                                    <Scan className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                    <span>{isLoading ? 'Scanning...' : 'Scan'}</span>
                                </button>
                            </div>

                        

                            {errors.idRfid && (
                                <p className="text-red-500 text-xs mt-1">{errors.idRfid}</p>
                            )}
                            <p className="text-gray-500 text-xs mt-1">
                                ID RFID harus unik untuk setiap anggota
                            </p>
                        </div>
                    </div>

                    {/* Hari Piket */}
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                        <label className="text-gray-700 font-medium w-24 flex-shrink-0 pt-2">
                            Hari Piket <span className="text-red-500">*</span>
                        </label>
                        <div className="flex-1">
                            <div className={`border rounded-lg p-3 ${
                                errors.hariPiket ? 'border-red-500' : 'border-gray-300'
                            }`}>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(hari => (
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

                {/* Action Buttons */}
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