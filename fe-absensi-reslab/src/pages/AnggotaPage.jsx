import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight, User, ChevronDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { MembersApi } from '../api/index.js';

export default function AnggotaPage() {
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState(null);
    const [showAlert, setShowAlert] = useState({ show: false, message: '', type: '' });

    const itemsPerPage = 5;

    useEffect(() => {
        const loadMembers = async () => {
            try {
                console.log('🔄 Loading members from API...');
                setLoading(true);
                
                const response = await MembersApi.getAll();
                console.log('📋 Members API Response:', response);
                
                if (response.success) {
                    setMembers(response.data);
                    console.log('✅ Members loaded successfully:', response.data.length, 'items');
                } else {
                    console.error('❌ Failed to load members:', response.message);
                    setShowAlert({
                        show: true,
                        message: response.message || 'Gagal memuat data anggota',
                        type: 'error'
                    });
                }
            } catch (error) {
                console.error('❌ Error loading members:', error);
                setShowAlert({
                    show: true,
                    message: 'Terjadi kesalahan saat memuat data anggota',
                    type: 'error'
                });
            } finally {
                setLoading(false);
            }
        };

        loadMembers();
    }, []);

    // Filter data berdasarkan search term
    const filteredMembers = members.filter(member => {
        const searchLower = searchTerm.toLowerCase();
        
        // Search in basic fields
        const basicSearch = member.nama.toLowerCase().includes(searchLower) ||
                           member.nim.includes(searchTerm) ||
                           member.idRfid.toLowerCase().includes(searchLower);
        
        // Search in hari piket (support both array and string)
        let hariPiketSearch = false;
        if (member.hariPiket) {
            if (Array.isArray(member.hariPiket)) {
                hariPiketSearch = member.hariPiket.some(hari => hari.toLowerCase().includes(searchLower));
            } else {
                hariPiketSearch = member.hariPiket.toLowerCase().includes(searchLower);
            }
        }
        
        return basicSearch || hariPiketSearch;
    });

    const totalItems = filteredMembers.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentMembers = filteredMembers.slice(startIndex, startIndex + itemsPerPage);

    const showNotification = (message, type = 'success') => {
        setShowAlert({ show: true, message, type });
        setTimeout(() => {
            setShowAlert({ show: false, message: '', type: '' });
        }, 3000);
    };

    const handleEdit = (member) => {
        navigate(`/anggota/edit-anggota/${member.id}`);
    };

    const handleDeleteClick = (member) => {
        setMemberToDelete(member);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (memberToDelete) {
            try {
                console.log('🗑️ Deleting member:', memberToDelete.id);
                
                const response = await MembersApi.delete(memberToDelete.id);
                
                if (response.success) {
                    showNotification(`Anggota "${memberToDelete.nama}" berhasil dihapus`, 'success');
                    
                    // Remove member from local state
                    const updatedMembers = members.filter(m => m.id !== memberToDelete.id);
                    setMembers(updatedMembers);
                    
                    // Adjust current page if needed
                    const newTotalItems = updatedMembers.length;
                    const newTotalPages = Math.ceil(newTotalItems / itemsPerPage);
                    if (currentPage > newTotalPages && newTotalPages > 0) {
                        setCurrentPage(newTotalPages);
                    }
                } else {
                    showNotification(response.message || 'Gagal menghapus anggota', 'error');
                }
            } catch (error) {
                console.error('❌ Error deleting member:', error);
                showNotification('Terjadi kesalahan saat menghapus anggota', 'error');
            }
        }
        setShowDeleteModal(false);
        setMemberToDelete(null);
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
        setMemberToDelete(null);
    };

    const handleAddMember = (e) => {
        e.preventDefault();
        navigate('/anggota/tambah-anggota');
    };

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset halaman ke 1 saat mencari
    };

    return (
        <main data-aos="fade-up" className="flex-1 p-4 md:p-8 overflow-y-auto">
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

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <div className="flex items-center mb-4">
                            <AlertTriangle size={24} className="text-red-500 mr-3" />
                            <h3 className="text-lg font-semibold text-gray-900">Konfirmasi Hapus</h3>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Apakah Anda yakin ingin menghapus anggota "{memberToDelete?.nama}"? 
                            Tindakan ini akan menghapus semua data absensi yang terkait dan tidak dapat dibatalkan.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={handleDeleteCancel}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
                            >
                                Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
                        Welcome to Sistem Absensi Reslab, <span className="text-orange-600 font-bold">Admin</span>
                    </h1>
                    <p className="text-3xl md:text-4xl font-bold mt-2">Anggota</p>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center bg-white rounded-full py-2 px-4 shadow-sm cursor-pointer">
                    <User size={20} className="text-gray-600 mr-2" />
                    <span className="font-medium text-gray-700">Admin</span>
                    <ChevronDown size={18} className="ml-2 text-gray-500" />
                </div>
            </header>

            {/* Search + Add */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="relative w-full sm:w-auto">
                    <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari Nama / NIM / ID RFID / Hari Piket"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm"
                    />
                </div>
                <button
                    onClick={handleAddMember}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors font-medium"
                >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Anggota</span>
                </button>
            </div>

            {/* Summary Info */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-blue-800">
                        <span className="font-medium">Total Anggota: {members.length}</span>
                        {searchTerm && (
                            <span className="ml-4">Hasil Pencarian: {filteredMembers.length}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <section className="bg-white rounded-xl p-6 shadow-md">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 rounded-lg">
                        <thead className="bg-orange-500 text-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">No</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Nama</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">NIM</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">ID RFID</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Hari Piket</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center">
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                            <span className="ml-2 text-gray-500">Memuat data anggota...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : currentMembers.length > 0 ? (
                                currentMembers.map((member, index) => (
                                    <tr key={member.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {startIndex + index + 1}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.nama}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.nim}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className="bg-gray-100 px-2 py-1 rounded-md font-mono text-xs">
                                                {member.idRfid}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex flex-wrap gap-1">
                                                {member.hariPiket && member.hariPiket.length > 0 ? (
                                                    Array.isArray(member.hariPiket) ? (
                                                        member.hariPiket.map((hari, index) => (
                                                            <span key={index} className="bg-blue-100 px-2 py-1 rounded-md text-blue-800 text-xs font-medium">
                                                                {hari}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="bg-blue-100 px-2 py-1 rounded-md text-blue-800 text-xs font-medium">
                                                            {member.hariPiket}
                                                        </span>
                                                    )
                                                ) : (
                                                    <span className="text-gray-400 italic text-xs">-</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEdit(member)}
                                                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs flex items-center space-x-1 transition-colors font-semibold"
                                                >
                                                    <Edit className="w-3 h-3" />
                                                    <span>Edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(member)}
                                                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs flex items-center space-x-1 transition-colors font-semibold"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                    <span>Hapus</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-6 text-gray-500">
                                        {searchTerm ? 'Tidak ada data yang cocok dengan pencarian' : 'Tidak ada data anggota'}
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
                            Menampilkan {startIndex + 1} sampai {Math.min(startIndex + itemsPerPage, totalItems)} dari {totalItems} Anggota
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
    );
}