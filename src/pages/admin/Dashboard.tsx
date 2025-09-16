"use client";
import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Outlet />
      </div>
    </div>
  );
}