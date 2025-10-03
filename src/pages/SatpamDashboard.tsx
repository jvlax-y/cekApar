import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Calendar, MapPin, CheckCircle2, AlertCircle, Search, ClipboardList } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  qr_code_data: string;
  created_at: string;
  isCheckedToday?: boolean;
  isAparCheckedToday?: boolean;
}

const SatpamDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [isSatpam, setIsSatpam] = useState(false);
  const [isScheduledToday, setIsScheduledToday] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (loading) return;

    if (!user) {
      toast.error("Anda harus login untuk mengakses halaman ini.");
      navigate('/login');
      return;
    }

    const checkUserRoleAndFetchLocations = async () => {
      try {
        if (user.role !== 'user') {
          toast.error("Akses ditolak. Anda bukan satpam.");
          navigate('/');
          return;
        }

        setIsSatpam(true);

        const now = new Date();
        const gmt7 = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (7 * 3600000));
        const targetDate = new Date(gmt7);
        targetDate.setHours(6, 0, 0, 0);
        if (gmt7.getHours() < 6) {
          targetDate.setDate(targetDate.getDate() - 1);
        }
        const scheduleDate = format(targetDate, 'yyyy-MM-dd');

        const { data: scheduleData, error: scheduleError } = await supabase
          .from('schedules')
          .select('location_id')
          .eq('user_id', user.id)
          .eq('schedule_date', scheduleDate);

        if (scheduleError) throw scheduleError;

        if (!scheduleData || scheduleData.length === 0) {
          setIsScheduledToday(false);
          setLocations([]);
          setLoadingLocations(false);
          return;
        }
        setIsScheduledToday(true);

        const scheduledLocationIds = scheduleData.map(s => s.location_id);

        const { data: locationsData, error: locationsError } = await supabase
          .from('locations')
          .select('id, name, qr_code_data, created_at')
          .in('id', scheduledLocationIds)
          .order('name', { ascending: true });

        if (locationsError) throw locationsError;

        const startLocal = new Date(
          targetDate.getFullYear(),
          targetDate.getMonth(),
          targetDate.getDate(),
          6, 0, 0
        );
        const startUTC = startLocal.toISOString();
        const endUTC = new Date(startLocal.getTime() + 86400000).toISOString();

        const { data: reportsData } = await supabase
          .from('check_area_reports')
          .select('location_id')
          .eq('user_id', user.id)
          .gte('created_at', startUTC)
          .lt('created_at', endUTC);

        const checkedIds = new Set(reportsData?.map(r => r.location_id));

        const { data: aparData } = await supabase
          .from('apar_checks')
          .select('location_id')
          .eq('user_id', user.id)
          .gte('created_at', startUTC)
          .lt('created_at', endUTC);

        const aparCheckedIds = new Set(aparData?.map(r => r.location_id));

        const locationsWithStatus = locationsData.map(loc => ({
          ...loc,
          isCheckedToday: checkedIds.has(loc.id),
          isAparCheckedToday: aparCheckedIds.has(loc.id),
        }));

        setLocations(locationsWithStatus);
      } catch (err) {
        console.error("Error di dashboard satpam:", err);
        toast.error("Gagal memuat data dashboard.");
      } finally {
        setLoadingLocations(false);
      }
    };

    checkUserRoleAndFetchLocations();
  }, [loading, user, navigate]);

  const filteredLocations = locations.filter(loc =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const completedTasks = filteredLocations.filter(
    loc => loc.isCheckedToday && loc.isAparCheckedToday
  ).length;
  const totalTasks = filteredLocations.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (loading || loadingLocations) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-700 font-medium">Memuat dashboard satpam...</p>
        </div>
      </div>
    );
  }

  if (!isSatpam) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header Card */}
        <Card className="mb-6 shadow-lg border-t-4 border-blue-600">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ClipboardList className="h-8 w-8" />
                <div>
                  <CardTitle className="text-2xl font-bold">Dashboard Satpam</CardTitle>
                  <p className="text-blue-100 text-sm mt-1">
                    Selamat datang, {user?.first_name || 'Satpam'}!
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-blue-100">
                  <Calendar className="h-5 w-5" />
                  <span className="text-sm">{format(new Date(), 'dd MMM yyyy')}</span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {!isScheduledToday ? (
          <Card className="shadow-lg">
            <CardContent className="py-16">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
                  <AlertCircle className="h-10 w-10 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Tidak Ada Jadwal Tugas
                </h3>
                <p className="text-gray-600 text-lg">
                  Anda tidak memiliki jadwal tugas untuk hari ini.
                </p>
                <p className="text-gray-500 mt-2">
                  Silakan hubungi supervisor jika ada pertanyaan.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Progress Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Total Lokasi</p>
                      <p className="text-3xl font-bold text-gray-800 mt-1">{totalTasks}</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full">
                      <MapPin className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Selesai</p>
                      <p className="text-3xl font-bold text-green-600 mt-1">{completedTasks}</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-full">
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Progress</p>
                      <p className="text-3xl font-bold text-indigo-600 mt-1">{progress}%</p>
                    </div>
                    <div className="bg-indigo-100 p-3 rounded-full">
                      <ClipboardList className="h-8 w-8 text-indigo-600" />
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <Card className="shadow-lg">
              <CardHeader className="border-b bg-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <CardTitle className="text-xl font-bold text-gray-800">
                    Daftar Tugas Hari Ini
                  </CardTitle>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Cari lokasi..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {filteredLocations.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">
                      {searchQuery ? "Tidak ada lokasi yang cocok dengan pencarian." : "Belum ada lokasi untuk jadwal Anda hari ini."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold">Nama Lokasi</TableHead>
                          <TableHead className="font-semibold">Jenis Cek</TableHead>
                          <TableHead className="font-semibold text-center">Status</TableHead>
                          <TableHead className="font-semibold text-center">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLocations.map((loc) => (
                          <React.Fragment key={loc.id}>
                            <TableRow className="hover:bg-blue-50 transition-colors">
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-blue-600" />
                                  {loc.name}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  Cek Area
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                {loc.isCheckedToday ? (
                                  <Badge className="bg-green-500 hover:bg-green-600">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Sudah Dicek
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Belum Dicek
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  size="sm"
                                  onClick={() => navigate(`/scan-location?id=${loc.id}`)}
                                  disabled={loc.isCheckedToday}
                                  className={loc.isCheckedToday ? "" : "bg-blue-600 hover:bg-blue-700"}
                                >
                                  {loc.isCheckedToday ? "Selesai" : "Cek Lokasi"}
                                </Button>
                              </TableCell>
                            </TableRow>

                            <TableRow className="hover:bg-orange-50 transition-colors">
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-orange-600" />
                                  {loc.name}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                  Cek APAR
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                {loc.isAparCheckedToday ? (
                                  <Badge className="bg-green-500 hover:bg-green-600">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Sudah Dicek
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="border-orange-300 text-orange-700">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Perlu Dicek
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  size="sm"
                                  onClick={() => navigate(`/scan-apar?id=${loc.id}`)}
                                  disabled={loc.isAparCheckedToday}
                                  className={loc.isAparCheckedToday ? "" : "bg-orange-600 hover:bg-orange-700"}
                                >
                                  {loc.isAparCheckedToday ? "Selesai" : "Scan QR APAR"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          </React.Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default SatpamDashboard;