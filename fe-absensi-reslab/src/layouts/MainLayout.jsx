import React from "react";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="flex bg-gray-100 min-h-screen overflow-hidden">
      {}
      <Sidebar />

<<<<<<< HEAD
      {}
      <main className="flex-1 p-0 md:p-4 pt-16 md:pt-0 md:ml-64 overflow-y-auto overflow-x-hidden">
=======
      {/* Konten halaman */}
      <main className="flex-1 p-4 md:p-8 pt-16 md:pt-0 overflow-y-auto">
>>>>>>> 89831ac93b04d077ece0b9b6e91a794841d99de9
        <Outlet />
      </main>
    </div>
  );
}
