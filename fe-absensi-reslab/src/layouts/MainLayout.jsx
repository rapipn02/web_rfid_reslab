import React from "react";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="flex bg-gray-100 min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Konten halaman */}
      <main className="flex-1 p-4 md:p-8 pt-16 md:pt-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
