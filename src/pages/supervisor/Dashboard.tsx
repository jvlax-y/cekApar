"use client";
import Navbar from "@/components/Navbar";

export default function SupervisorDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold">Dashboard Supervisor</h1>
      </div>
    </div>
  );
}