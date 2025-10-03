import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import PersonnelForm from "@/components/PersonnelForm";
import PersonnelList from "@/components/PersonnelList";
import SatpamSchedule from "@/components/SatpamSchedule";
import AparForm from "@/components/AparForm";
import toast from 'react-hot-toast';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const AdminDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [locationListRefreshKey, setLocationListRefreshKey] = useState(0);
  const [personnelListRefreshKey, setPersonnelListRefreshKey] = useState(0);
  const [aparListRefreshKey, setAparListRefreshKey] = useState(0);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login');
        return;
      }

      if (user.role === 'admin') {
        setIsAdmin(true);
      } else {
        toast.error("Akses ditolak. Anda bukan admin.");
        navigate('/');
      }
    }
  }, [user, loading, navigate]);

  const handleLocationCreated = () => {
    setLocationListRefreshKey(prevKey => prevKey + 1);
  };

  const handlePersonnelAdded = () => {
    setPersonnelListRefreshKey(prevKey => prevKey + 1);
  };

  const handleAparAdded = () => {
    setAparListRefreshKey(prevKey => prevKey + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-600">Memuat dashboard admin...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold text-center mb-8">Dashboard Admin</h1>
        
        <Tabs defaultValue="personnel" className="w-full">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 gap-2 mb-32 md:mb-8">            
            <TabsTrigger value="personnel">Kelola Personel</TabsTrigger>
            <TabsTrigger value="schedule">Penjadwalan Satpam</TabsTrigger>
            <TabsTrigger value="apar">Kelola Cek Apar</TabsTrigger>
          </TabsList>

          <TabsContent value="personnel" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tambah Personel Satpam Baru</CardTitle>
              </CardHeader>
              <CardContent>
                <PersonnelForm onPersonnelAdded={handlePersonnelAdded} />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <PersonnelList isAdmin={isAdmin} refreshKey={personnelListRefreshKey} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Penjadwalan Satpam</CardTitle>
              </CardHeader>
              <CardContent>
                <SatpamSchedule />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="apar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Kelola Cek Apar</CardTitle>
              </CardHeader>
              <CardContent>
                <AparForm />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;