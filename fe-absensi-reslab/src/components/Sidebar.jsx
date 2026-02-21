import React, { useState, useEffect } from 'react';
import { Home, Users, CheckSquare, FileText, LogOut, Menu, X } from 'lucide-react';
import ReslabLogo from '../assets/reslablogo.png';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
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
    setTimeout(() => setOpen(false), 300); 
  };

  useEffect(() => {
    if (open) {
      setTimeout(() => setIsAnimating(true), 10); 
    }
  }, [open]);

  
  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: Home },
    { name: "Anggota", path: "/anggota", icon: Users },
    { name: "Absensi", path: "/absensi", icon: CheckSquare },
    { name: "Laporan", path: "/laporan", icon: FileText },
  ];

  
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {}
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
                handleClose(); 
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
      {}
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
          <div
            className={`fixed inset-0 transition-opacity duration-300`}
            onClick={handleClose}
          />
          {}
          <aside
            className={`relative w-64 bg-white/70 backdrop-blur-md p-6 shadow-2xl h-full z-50 border-l border-gray-200 transform transition-transform duration-300 ease-in-out ${isAnimating ? "translate-x-0" : "translate-x-full"
              }`}
          >
            {}
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
