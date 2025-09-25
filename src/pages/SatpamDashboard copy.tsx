import React, { useEffect, useState } from 'react';
import { useSession } from '@/integrations/supabase/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Scanner } from '@yudiel/react-qr-scanner';
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

interface Location {
  id: string;
  name: string;
  qr_code_data: string;
  created_at: string;
  isCheckedToday?: boolean; // untuk cek area
  isAparCheckedToday?: boolean; // untuk cek APAR
}

const SatpamDashboard = () => {
  const { session, loading: sessionLoading, user } = useSession();
  const navigate = useNavigate();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [isSatpam, setIsSatpam] = useState(false);
  const [isScheduledToday, setIsScheduledToday] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (sessionLoading) return;

    if (!user) {
      toast.error("Anda harus login untuk mengakses halaman ini.");
      navigate('/login');
      return;
    }

    const checkUserRoleAndFetchLocations = async () => {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile role:", profileError);
        toast.error("Gagal memuat peran pengguna.");
        navigate('/');
        return;
      }

      if (profileData?.role === 'satpam') {
        setIsSatpam(true);

        // --- Hitung "checking day" (06:00 GMT+7) ---
        const now = new Date();
        const currentGMT7Time = new Date(now.getTime() + (now.getTimezoneOffset() * 60 * 1000) + (7 * 60 * 60 * 1000));
        const targetCalendarDateForSchedule = new Date(currentGMT7Time);
        targetCalendarDateForSchedule.setHours(6, 0, 0, 0);
        if (currentGMT7Time.getHours() < 6) {
          targetCalendarDateForSchedule.setDate(targetCalendarDateForSchedule.getDate() - 1);
        }
        const formattedTargetScheduleDate = format(targetCalendarDateForSchedule, 'yyyy-MM-dd');

        // --- Ambil schedule hari ini ---
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('schedules')
          .select('location_id')
          .eq('user_id', user.id)
          .eq('schedule_date', formattedTargetScheduleDate);

        if (scheduleError) {
          console.error("Error fetching schedule:", scheduleError);
          toast.error("Gagal memuat jadwal Anda.");
          setLoadingLocations(false);
          return;
        }

        if (!scheduleData || scheduleData.length === 0) {
          setIsScheduledToday(false);
          setLoadingLocations(false);
          toast.info("Anda tidak memiliki jadwal tugas untuk hari ini.");
          setLocations([]);
          return;
        }
        setIsScheduledToday(true);

        const scheduledLocationIds = scheduleData.map(s => s.location_id);

        // --- Ambil lokasi dari schedule ---
        const { data: locationsData, error: locationsError } = await supabase
          .from('locations')
          .select('id, name, qr_code_data, created_at')
          .in('id', scheduledLocationIds)
          .order('name', { ascending: true });

        if (locationsError) {
          console.error("Error fetching locations:", locationsError);
          toast.error("Gagal memuat daftar lokasi.");
          setLoadingLocations(false);
          return;
        }

        // --- Hitung rentang waktu 06:00 hari ini - 06:00 besok (UTC) ---
        const localStartOfCheckingDay = new Date(
          targetCalendarDateForSchedule.getFullYear(),
          targetCalendarDateForSchedule.getMonth(),
          targetCalendarDateForSchedule.getDate(),
          6, 0, 0
        );
        const startOfCheckingDayUTC = localStartOfCheckingDay.toISOString();
        const endOfCheckingDayUTC = new Date(localStartOfCheckingDay.getTime() + (24 * 60 * 60 * 1000)).toISOString();

        // --- Ambil laporan cek area ---
        const { data: reportsData } = await supabase
          .from('check_area_reports')
          .select('location_id')
          .eq('user_id', user.id)
          .gte('created_at', startOfCheckingDayUTC)
          .lt('created_at', endOfCheckingDayUTC);

        const checkedLocationIds = new Set(reportsData?.map(r => r.location_id));

        // --- Ambil laporan cek APAR ---
        const { data: aparData } = await supabase
          .from('apar_checks')
          .select('location_id')
          .eq('user_id', user.id)
          .gte('created_at', startOfCheckingDayUTC)
          .lt('created_at', endOfCheckingDayUTC);

        const aparCheckedLocationIds = new Set(aparData?.map(r => r.location_id));

        // --- Merge status ---
        const locationsWithStatus = locationsData.map(loc => ({
          ...loc,
          isCheckedToday: checkedLocationIds.has(loc.id),
          isAparCheckedToday: aparCheckedLocationIds.has(loc.id),
        }));

        setLocations(locationsWithStatus);
        setLoadingLocations(false);
      } else {
        toast.error("Akses ditolak. Anda bukan satpam.");
        navigate('/');
      }
    };

    checkUserRoleAndFetchLocations();
  }, [session, sessionLoading, user, navigate]);

  // Filter
  const filteredLocations = locations.filter(loc =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (sessionLoading || loadingLocations) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-xl text-gray-600 dark:text-gray-400">Memuat dashboard satpam...</p>
      </div>
    );
  }

  if (!isSatpam) return null;

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-3xl mx-auto mt-8">
        <CardHeader>
          <CardTitle className="text-center">Dashboard Satpam</CardTitle>
        </CardHeader>
        <CardContent>
          <h3 className="text-xl font-semibold mb-4 text-center">Daftar Tugas Hari Ini</h3>
          {!isScheduledToday ? (
            <p className="text-center text-lg text-red-500 dark:text-red-400">
              Anda tidak memiliki jadwal tugas untuk hari ini.
            </p>
          ) : (
            <>
              <div className="mb-4">
                <Input
                  type="text"
                  placeholder="Cari lokasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              {filteredLocations.length === 0 ? (
                <p className="text-center text-gray-600 dark:text-gray-400">
                  {searchQuery ? "Tidak ada lokasi yang cocok." : "Belum ada lokasi yang terdaftar untuk jadwal Anda hari ini."}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center">Nama Lokasi</TableHead>
                        <TableHead className="text-center">Jenis Cek</TableHead>
                        <TableHead className="text-center w-[150px]">Status</TableHead>
                        <TableHead className="text-center w-[120px]">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLocations.map((loc) => (
                        <React.Fragment key={loc.id}>
                          {/* Cek Area */}
                          <TableRow>
                            <TableCell className="font-medium text-center">{loc.name}</TableCell>
                            <TableCell className="text-center">Cek Area</TableCell>
                            <TableCell className="text-center">
                              {loc.isCheckedToday ? (
                                <Badge className="bg-green-500">Sudah Dicek</Badge>
                              ) : (
                                <Badge variant="destructive">Belum Dicek</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                size="sm"
                                onClick={() => navigate(`/scan-location?id=${loc.id}`)}
                                disabled={loc.isCheckedToday}
                              >
                                {loc.isCheckedToday ? "Sudah Dicek" : "Cek Lokasi"}
                              </Button>
                            </TableCell>
                          </TableRow>

                          {/* Cek APAR */}
                          <TableRow>
                            <TableCell className="font-medium text-center">{loc.name}</TableCell>
                            <TableCell className="text-center">Cek APAR</TableCell>
                            <TableCell className="text-center">
                              {loc.isAparCheckedToday ? (
                                <Badge className="bg-green-500">Sudah Dicek</Badge>
                              ) : (
                                <Badge variant="outline">Perlu Dicek</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                size="sm"
                                onClick={() => navigate(`/scan-apar?id=${loc.id}`)} // 🔥 arahkan ke halaman scanner
                                disabled={loc.isAparCheckedToday}
                              >
                                {loc.isAparCheckedToday ? "Sudah Dicek" : "Scan QR APAR"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SatpamDashboard;