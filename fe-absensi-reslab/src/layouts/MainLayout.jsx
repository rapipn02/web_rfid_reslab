import React from "react";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="flex bg-gray-100 min-h-screen overflow-hidden">
      {}
      <Sidebar />

      {}
      <main className="flex-1 p-0 md:p-4 pt-16 md:pt-0 md:ml-64 overflow-y-auto overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
