import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';

const AdminDashboard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">Loading...</div>;
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
        <p className="text-gray-700 dark:text-gray-300">Selamat datang, {user.first_name} {user.last_name}!</p>
        <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Fitur Admin akan datang di sini...</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Ini adalah placeholder untuk tab Kelola Personel, Kelola Lokasi, dan Penjadwalan Satpam.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;