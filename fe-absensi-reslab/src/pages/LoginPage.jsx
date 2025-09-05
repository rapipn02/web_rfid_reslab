import React, { useState } from 'react';
import { Mail, EyeOff, Eye, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import ReslabLogo from '../assets/reslablogo.png'

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showAlert, setShowAlert] = useState({ show: false, message: '', type: '' });
    
    const navigate = useNavigate();
    const { login } = useAuth();

    const showNotification = (message, type = 'success') => {
        setShowAlert({ show: true, message, type });
        setTimeout(() => {
            setShowAlert({ show: false, message: '', type: '' });
        }, 3000);
    };

    const validateForm = () => {
        const newErrors = {};

        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = 'Email wajib diisi';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
            newErrors.email = 'Format email tidak valid';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password wajib diisi';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password minimal 6 karakter';
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

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            showNotification('Mohon perbaiki kesalahan pada form', 'error');
            return;
        }

        setIsLoading(true);

        try {
            // Call auth context login
            const result = await login({
                email: formData.email,
                password: formData.password
            });

            if (result.success) {
                showNotification('Login berhasil! Mengarahkan ke dashboard...', 'success');
                setTimeout(() => {
                    navigate('/dashboard');
                }, 1500);
            } else {
                showNotification(result.message || 'Login gagal. Silakan coba lagi.', 'error');
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Login error:', error);
            showNotification('Terjadi kesalahan. Silakan coba lagi.', 'error');
            setIsLoading(false);
        }
    };

    const handleForgotPassword = (e) => {
        e.preventDefault();
        showNotification('Fitur lupa password belum tersedia. Hubungi administrator.', 'error');
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4 font-sans">
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

            <div className="flex flex-col lg:flex-row w-full max-w-5xl rounded-2xl overflow-hidden shadow-xl">
                {/* Formulir Login */}
                <div className="w-full lg:w-1/2 bg-white p-8 sm:p-12 flex flex-col justify-center">
                    <div className="flex items-center mb-6 md:mb-10">
                        <img src={ReslabLogo} alt="Reslab Logo" className="w-8 h-8 mr-3" />
                        <div className="text-sm">
                            <p className="font-semibold text-gray-700">ROBOTIC AND EMBEDDED SYSTEM LABORATORY</p>
                            <p className="text-gray-500">TEKNIK KOMPUTER</p>
                        </div>
                    </div>
                    
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Login</h2>
                    <p className="text-gray-600 mb-6 md:mb-8 text-sm">
                        Masukkan kredensial Anda untuk mengakses sistem
                    </p>

                    {/* Demo Credentials Info */}
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                        <h4 className="font-semibold text-orange-800 text-sm mb-2">Demo Credentials:</h4>
                        <div className="text-sm text-orange-700">
                            <p><strong>Email:</strong> admin@reslab.com</p>
                            <p><strong>Password:</strong> admin123</p>
                        </div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4 md:space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className={`w-full pr-10 pl-4 py-2 rounded-md border focus:ring-1 focus:ring-orange-500 text-sm md:text-base ${
                                        errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-orange-500'
                                    }`}
                                    placeholder="Enter your email"
                                />
                                <Mail size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                            {errors.email && (
                                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className={`w-full pr-10 pl-4 py-2 rounded-md border focus:ring-1 focus:ring-orange-500 text-sm md:text-base ${
                                        errors.password ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-orange-500'
                                    }`}
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                            )}
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={handleForgotPassword}
                                className="text-sm font-medium text-orange-600 hover:text-orange-500"
                            >
                                Lupa Password?
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-2 md:py-3 px-4 rounded-full bg-orange-500 text-white font-semibold shadow-md hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                        >
                            {isLoading ? 'Logging in...' : 'Log in'}
                        </button>
                    </form>

                    {/* Additional Info */}
                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-500">
                            Sistem Absensi RFID - Reslab Teknik Komputer
                        </p>
                    </div>
                </div>

                {/* Ilustrasi Samping */}
                <div className="hidden lg:flex lg:w-1/2 bg-orange-500 relative justify-center items-center overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-orange-400 opacity-50 transform -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-orange-400 opacity-50 transform translate-y-1/2 -translate-x-1/2"></div>
                        <div className="absolute top-1/2 left-1/4 h-32 w-32 rounded-full bg-orange-300 opacity-30 transform -translate-y-1/2"></div>
                    </div>
                    
                    <div className="relative z-10 text-white text-center p-8">
                        <div className="mb-6">
                            <div className="w-24 h-24 mx-auto bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                                <div className="w-16 h-16 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
                                    <span className="text-2xl font-bold">R</span>
                                </div>
                            </div>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-extrabold mb-2 tracking-tight">Sistem Absensi</h1>
                        <h2 className="text-4xl md:text-6xl font-extrabold tracking-wide mb-4">RESLAB</h2>
                        <p className="text-lg md:text-xl opacity-90 max-w-md mx-auto leading-relaxed">
                            Solusi modern untuk manajemen kehadiran dengan teknologi RFID
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}