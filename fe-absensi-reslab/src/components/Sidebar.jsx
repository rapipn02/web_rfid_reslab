import React from 'react';
import { Home, Users, CheckSquare, FileText, LogOut } from 'lucide-react';
import ReslabLogo from '../assets/reslablogo.png';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = (e) => {
    e.preventDefault();
    navigate('/');
  };

  // daftar menu sidebar
  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: Home },
    { name: "Anggota", path: "/anggota", icon: Users },
    { name: "Absensi", path: "/absensi", icon: CheckSquare },
    { name: "Laporan", path: "/laporan", icon: FileText },
  ];

  return (
    <aside className="w-64 bg-white p-6 shadow-lg hidden md:block">
      {/* Logo */}
      <div className="flex items-center mb-10">
        <img src={ReslabLogo} alt="Reslab Logo" className="w-8 h-8 mr-3" />
        <span className="font-bold text-gray-800">Sistem Absensi RESLAB</span>
      </div>

      {/* Menu */}
      <nav className="space-y-2 mb-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
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

      {/* Logout */}
      <div onClick={handleLogout} className="mt-auto pt-6 border-t border-gray-200">
        <button className="flex w-full items-center p-3 rounded-lg text-gray-700 transition-colors hover:bg-gray-200">
          <LogOut size={20} className="mr-3" /> Log out
        </button>
      </div>
    </aside>
  );
}
