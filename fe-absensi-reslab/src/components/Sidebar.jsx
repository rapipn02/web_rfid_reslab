import React, { useState, useEffect } from 'react';
import { Home, Users, CheckSquare, FileText, LogOut, Menu, X } from 'lucide-react';
import ReslabLogo from '../assets/reslablogo.png';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
<<<<<<< HEAD
  const { logout } = useAuth();
=======
>>>>>>> 89831ac93b04d077ece0b9b6e91a794841d99de9
  const [open, setOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleLogout = async (e) => {
    e.preventDefault();
    
    
    const isConfirmed = window.confirm('Apakah Anda yakin ingin logout?');
    if (isConfirmed) {
      try {
        await logout();
        
      } catch (error) {
        console.error('Error during logout:', error);
        
        window.location.href = '/login';
      }
    }
  };

  const handleClose = () => {
    setIsAnimating(false);
<<<<<<< HEAD
    setTimeout(() => setOpen(false), 300); 
=======
    setTimeout(() => setOpen(false), 300); // tunggu animasi selesai baru close
>>>>>>> 89831ac93b04d077ece0b9b6e91a794841d99de9
  };

  useEffect(() => {
    if (open) {
<<<<<<< HEAD
      setTimeout(() => setIsAnimating(true), 10); 
    }
  }, [open]);

  
=======
      setTimeout(() => setIsAnimating(true), 10); // kasih delay dikit biar animasi smooth
    }
  }, [open]);

  // daftar menu sidebar
>>>>>>> 89831ac93b04d077ece0b9b6e91a794841d99de9
  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: Home },
    { name: "Anggota", path: "/anggota", icon: Users },
    { name: "Absensi", path: "/absensi", icon: CheckSquare },
    { name: "Laporan", path: "/laporan", icon: FileText },
  ];

<<<<<<< HEAD
  
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {}
=======
  // Sidebar content
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
>>>>>>> 89831ac93b04d077ece0b9b6e91a794841d99de9
      <div className="flex items-center mb-10">
        <img src={ReslabLogo} alt="Reslab Logo" className="w-8 h-8 mr-3" />
        <span className="font-bold text-gray-800">Sistem Absensi RESLAB</span>
      </div>

      {}
      <nav className="space-y-2 mb-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.name}
              onClick={() => {
                navigate(item.path);
<<<<<<< HEAD
                handleClose(); 
=======
                handleClose(); // close sidebar setelah navigate
>>>>>>> 89831ac93b04d077ece0b9b6e91a794841d99de9
              }}
              className={`flex w-full items-center p-3 rounded-lg font-semibold transition-colors
                ${isActive ? "bg-orange-500 text-white hover:bg-orange-600"
                  : "text-gray-700 hover:bg-gray-200"}
              `}
            >
              <Icon size={20} className="mr-3" /> {item.name}
            </button>
          );
        })}
      </nav>

      {}
      <div onClick={handleLogout} className="mt-auto pt-6 border-t border-gray-200">
        <button className="flex w-full items-center p-3 rounded-lg text-gray-700 transition-colors hover:bg-gray-200">
          <LogOut size={20} className="mr-3" /> Log out
        </button>
      </div>
    </div>
  );

  return (
    <>
<<<<<<< HEAD
      {}
=======
      {/* Mobile Navbar */}
>>>>>>> 89831ac93b04d077ece0b9b6e91a794841d99de9
      <nav className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white shadow-md border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <img src={ReslabLogo} alt="Reslab Logo" className="w-7 h-7 mr-2" />
            <span className="font-bold text-gray-800 text-sm">RESLAB</span>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 transition-colors"
            aria-label="Open sidebar"
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>

<<<<<<< HEAD
      {}
      <div className="md:hidden h-16"></div>

      {}
      <aside className="w-64 bg-white p-6 shadow-lg hidden md:block fixed top-0 left-0 h-screen z-20">
        {sidebarContent}
      </aside>

      {}
      {open && (
        <div className="fixed inset-0 z-40 flex justify-end">
          {}
=======
      {/* Add top padding to body content on mobile to account for fixed navbar */}
      <div className="md:hidden h-16"></div>

      {/* Sidebar for desktop */}
      <aside className="w-64 bg-white p-6 shadow-lg hidden md:block sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Sidebar overlay for mobile */}
      {open && (
        <div className="fixed inset-0 z-40 flex justify-end">
          {/* Overlay transparan */}
>>>>>>> 89831ac93b04d077ece0b9b6e91a794841d99de9
          <div
            className={`fixed inset-0 transition-opacity duration-300`}
            onClick={handleClose}
          />
<<<<<<< HEAD
          {}
=======
          {/* Sidebar panel */}
>>>>>>> 89831ac93b04d077ece0b9b6e91a794841d99de9
          <aside
            className={`relative w-64 bg-white/70 backdrop-blur-md p-6 shadow-2xl h-full z-50 border-l border-gray-200 transform transition-transform duration-300 ease-in-out ${isAnimating ? "translate-x-0" : "translate-x-full"
              }`}
          >
<<<<<<< HEAD
            {}
=======
            {/* Close button */}
>>>>>>> 89831ac93b04d077ece0b9b6e91a794841d99de9
            <button
              className="absolute top-4 right-4 p-2 rounded-lg bg-gray-100/60 hover:bg-gray-200/80 text-gray-700 transition-colors backdrop-blur-sm"
              onClick={handleClose}
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
