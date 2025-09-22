import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { supabase } from "../integrations/supabase/client";  // ✅ path sudah sesuai
import PersonnelForm from "@/components/PersonnelForm";
import PersonnelList from "@/components/PersonnelList";
import SatpamSchedule from "@/components/SatpamSchedule";
import AparForm from "@/components/AparForm";
import AparList from "@/components/AparList";
import toast from 'react-hot-toast';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const AdminDashboard = () => {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [locationListRefreshKey, setLocationListRefreshKey] = useState(0);
  const [personnelListRefreshKey, setPersonnelListRefreshKey] = useState(0); // New state for personnel list refresh

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!loading && session) {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error) {
          if (error.code === 'PGRST204') { // No rows found
            console.warn("No profile found for user, redirecting from Admin Dashboard.");
            toast.error("Akses ditolak. Profil tidak ditemukan atau Anda bukan admin.");
          } else {
            console.error("Error fetching profile role:", error);
            toast.error("Gagal memuat peran pengguna.");
          }
          navigate('/'); // Redirect in case of error or no profile
        } else if (data?.role === 'admin') {
          setIsAdmin(true);
        } else {
          toast.error("Akses ditolak. Anda bukan admin.");
          navigate('/'); // Redirect if not admin
        }
        setProfileLoading(false);
      } else if (!loading && !session) {
        navigate('/login'); // Redirect to login if not authenticated
      }
    };

    checkAdminStatus();
  }, [session, loading, navigate]);

  const handleLocationCreated = () => {
    setLocationListRefreshKey(prevKey => prevKey + 1); // Increment key to trigger refresh
  };

  const handlePersonnelAdded = () => {
    setPersonnelListRefreshKey(prevKey => prevKey + 1); // Increment key to trigger refresh
  };

  const [aparListRefreshKey, setAparListRefreshKey] = useState(0); // New state for apar list refresh

  const handleAparAdded = () => {
    setAparListRefreshKey(prevKey => prevKey + 1); // Increment key to trigger refresh
  };


  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-xl text-gray-600 dark:text-gray-400">Memuat dashboard admin...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will be redirected by useEffect
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-5xl mx-auto mt-8"> {/* Lebarkan Card untuk menampung 3 tab */}
        <CardHeader>
          <CardTitle className="text-center">Dashboard Admin</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="personnel" className="w-full">
            <TabsList className="grid w-full grid-cols-3"> 
              <TabsTrigger value="personnel">Kelola Personel</TabsTrigger>
              <TabsTrigger value="schedule">Penjadwalan Satpam</TabsTrigger>
              <TabsTrigger value="apar">Kelola Cek Apar</TabsTrigger> 
            </TabsList>

            <TabsContent value="personnel" className="mt-4">
              <h3 className="text-xl font-semibold mb-4">Tambah Personel Satpam Baru</h3>
              <PersonnelForm onPersonnelAdded={handlePersonnelAdded} />
              <PersonnelList isAdmin={isAdmin} refreshKey={personnelListRefreshKey} />
            </TabsContent>

            <TabsContent value="schedule" className="mt-4">
              <h3 className="text-xl font-semibold mb-4">Penjadwalan Satpam</h3>
              <SatpamSchedule />
            </TabsContent>

            <TabsContent value="apar" className="mt-4">
              <h3 className="text-xl font-semibold mb-4">Buat Lokasi Cek Apar Baru</h3>
              <AparForm onAparAdded={handleAparAdded} />
              <AparList refreshKey={aparListRefreshKey} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;