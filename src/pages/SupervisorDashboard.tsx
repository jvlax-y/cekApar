import React, { useEffect, useState, useMemo } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar as CalendarIcon, Users, MapPin, CheckCircle2, XCircle, Camera, ClipboardCheck } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface Location {
  id: string;
  name: string;
  qr_code: string;
  posisi_gedung?: string | null;
}

interface CheckAreaReport {
  location_id: string;
  created_at: string;
  user_id: string;
  photo_url: string;
}

interface ScheduleEntry {
  id: string;
  schedule_date: string;
  user_id: string;
  location_id: string;
  profiles: { first_name: string; last_name: string }[] | null;
  locations: { name: string; posisi_gedung?: string | null }[] | null;
}

interface SatpamTab {
  satpamId: string;
  satpamName: string;
  locationDisplay: string;
  locationsStatus: {
    location: Location;
    isCheckedToday: boolean;
    lastCheckedAt: string | null;
    photoUrl: string | null;
  }[];
}

const SupervisorDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [reports, setReports] = useState<CheckAreaReport[]>([]);
  const [locationList, setLocationList] = useState<Location[]>([]);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      toast.error("Anda harus login untuk mengakses halaman ini.");
      navigate('/login');
      return;
    }

    const checkUserRole = async () => {
      if (user.role === 'supervisor' || user.role === 'admin') {
        setIsSupervisor(true);
        fetchData();
      } else {
        toast.error("Akses ditolak. Anda bukan supervisor atau admin.");
        navigate('/');
      }
    };

    const fetchData = async () => {
      setLoadingData(true);
      try {
        const { data: locData, error: locError } = await supabase
          .from('locations')
          .select('id, name, qr_code, posisi_gedung');
        if (locError) throw locError;
        setLocationList(locData as Location[]);

        const formattedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');

        const { data: schedulesData, error: scheduleError } = await supabase
          .from('schedules')
          .select('id, schedule_date, user_id, location_id')
          .eq('schedule_date', formattedDate);

        if (scheduleError) throw scheduleError;

        const userIds = [...new Set(schedulesData?.map(s => s.user_id) || [])];
        const locationIds = [...new Set(schedulesData?.map(s => s.location_id) || [])];

        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        const { data: locationsData, error: locationsError } = await supabase
          .from('locations')
          .select('id, name, posisi_gedung')
          .in('id', locationIds);

        if (locationsError) throw locationsError;

        const enrichedSchedules = schedulesData?.map(schedule => {
          const profile = profilesData?.find(p => p.id === schedule.user_id);
          const location = locationsData?.find(l => l.id === schedule.location_id);
          
          return {
            ...schedule,
            profiles: profile ? [profile] : null,
            locations: location ? [location] : null,
          };
        });
        setSchedules(enrichedSchedules as unknown as ScheduleEntry[]);

        const now = new Date();
        const currentGMT7Time = new Date(now.getTime() + (now.getTimezoneOffset() * 60 * 1000) + (7 * 60 * 60 * 1000));
        const targetCalendarDateForReports = new Date(currentGMT7Time);
        targetCalendarDateForReports.setHours(6, 0, 0, 0);
        if (currentGMT7Time.getHours() < 6) {
          targetCalendarDateForReports.setDate(targetCalendarDateForReports.getDate() - 1);
        }

        const localStartOfCheckingDayForReports = new Date(
          targetCalendarDateForReports.getFullYear(),
          targetCalendarDateForReports.getMonth(),
          targetCalendarDateForReports.getDate(),
          6, 0, 0
        );
        const startOfCheckingDayUTC = localStartOfCheckingDayForReports.toISOString();
        const endOfCheckingDayUTC = new Date(localStartOfCheckingDayForReports.getTime() + (24 * 60 * 60 * 1000)).toISOString();

        const { data: reportsData, error: reportsError } = await supabase
          .from('check_area_reports')
          .select('location_id, user_id, created_at, photo_url')
          .gte('created_at', startOfCheckingDayUTC)
          .lt('created_at', endOfCheckingDayUTC);

        if (reportsError) {
          console.warn('Table check_area_reports not found, skipping reports');
          setReports([]);
        } else {
          setReports(reportsData as CheckAreaReport[]);
        }

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui';
        toast.error(`Gagal memuat data: ${errorMessage}`);
        console.error("Error fetching data for supervisor dashboard:", error);
      } finally {
        setLoadingData(false);
      }
    };

    checkUserRole();
  }, [user, loading, navigate, selectedDate]);

  const satpamTabs: SatpamTab[] = useMemo(() => {
    const groupedBySatpam = new Map<string, {
      satpamId: string;
      satpamName: string;
      assignedLocationIds: Set<string>;
      locationsStatus: {
        location: Location;
        isCheckedToday: boolean;
        lastCheckedAt: string | null;
        photoUrl: string | null;
      }[];
    }>();

    schedules.forEach(schedule => {
      const satpamId = schedule.user_id;
      const satpamName = schedule.profiles?.[0] ? `${schedule.profiles[0].first_name} ${schedule.profiles[0].last_name}` : 'N/A';
      const location = locationList.find(loc => loc.id === schedule.location_id);

      if (!groupedBySatpam.has(satpamId)) {
        groupedBySatpam.set(satpamId, {
          satpamId,
          satpamName,
          assignedLocationIds: new Set(),
          locationsStatus: [],
        });
      }

      const satpamEntry = groupedBySatpam.get(satpamId)!;
      satpamEntry.assignedLocationIds.add(schedule.location_id);

      if (location) {
        const report = reports.find(r => r.user_id === satpamId && r.location_id === location.id);
        
        satpamEntry.locationsStatus.push({
          location: location,
          isCheckedToday: !!report,
          lastCheckedAt: report ? format(new Date(report.created_at), 'HH:mm', { locale: idLocale }) : null,
          photoUrl: report?.photo_url || null,
        });
      }
    });

    const result: SatpamTab[] = [];
    groupedBySatpam.forEach(entry => {
      let locationDisplay: string;
      const allLocationsCount = locationList.length;
      const gedungBaratLocations = locationList.filter(loc => loc.posisi_gedung === 'Gedung Barat');
      const gedungTimurLocations = locationList.filter(loc => loc.posisi_gedung === 'Gedung Timur');

      const assignedToGedungBarat = Array.from(entry.assignedLocationIds).every(locId => 
        gedungBaratLocations.some(gbLoc => gbLoc.id === locId)
      ) && entry.assignedLocationIds.size === gedungBaratLocations.length && gedungBaratLocations.length > 0;

      const assignedToGedungTimur = Array.from(entry.assignedLocationIds).every(locId => 
        gedungTimurLocations.some(gtLoc => gtLoc.id === locId)
      ) && entry.assignedLocationIds.size === gedungTimurLocations.length && gedungTimurLocations.length > 0;

      if (entry.assignedLocationIds.size === allLocationsCount && allLocationsCount > 0) {
        locationDisplay = "Semua Gedung";
      } else if (assignedToGedungBarat) {
        locationDisplay = "Gedung Barat";
      } else if (assignedToGedungTimur) {
        locationDisplay = "Gedung Timur";
      } else if (entry.assignedLocationIds.size > 0) {
        locationDisplay = "Beberapa Lokasi";
      } else {
        locationDisplay = "Tidak Ditugaskan";
      }

      result.push({
        satpamId: entry.satpamId,
        satpamName: entry.satpamName,
        locationDisplay: locationDisplay,
        locationsStatus: entry.locationsStatus.sort((a, b) => a.location.name.localeCompare(b.location.name)),
      });
    });

    return result.sort((a, b) => a.satpamName.localeCompare(b.satpamName));
  }, [schedules, reports, locationList]);

  // Calculate stats
  const totalPersonnel = satpamTabs.length;
  const totalLocations = schedules.length;
  const completedChecks = reports.length;
  const completionRate = totalLocations > 0 ? Math.round((completedChecks / totalLocations) * 100) : 0;

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-700 font-medium">Memuat dashboard supervisor...</p>
        </div>
      </div>
    );
  }

  if (!isSupervisor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header Card */}
        <Card className="mb-6 shadow-xl border-t-4 border-purple-600">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ClipboardCheck className="h-8 w-8" />
                <div>
                  <CardTitle className="text-2xl font-bold">Dashboard Supervisor</CardTitle>
                  <p className="text-purple-100 text-sm mt-1">
                    Monitoring & Evaluasi Kinerja Satpam
                  </p>
                </div>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-white text-purple-700 hover:bg-purple-50 border-2 border-white font-semibold"
                  >
                    <CalendarIcon className="mr-2 h-5 w-5" />
                    {selectedDate ? format(selectedDate, "dd MMM yyyy", { locale: idLocale }) : "Pilih Tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Personel</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{totalPersonnel}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Lokasi</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{totalLocations}</p>
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
                  <p className="text-sm text-gray-600 font-medium">Sudah Dicek</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{completedChecks}</p>
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
                  <p className="text-sm text-gray-600 font-medium">Completion Rate</p>
                  <p className="text-3xl font-bold text-indigo-600 mt-1">{completionRate}%</p>
                </div>
                <div className="bg-indigo-100 p-3 rounded-full">
                  <ClipboardCheck className="h-8 w-8 text-indigo-600" />
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        {satpamTabs.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="py-16">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                  <XCircle className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Tidak Ada Jadwal
                </h3>
                <p className="text-gray-600 text-lg">
                  Tidak ada jadwal yang ditetapkan untuk tanggal{' '}
                  {selectedDate ? format(selectedDate, "dd MMMM yyyy", { locale: idLocale }) : 'ini'}.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <Tabs defaultValue={satpamTabs[0]?.satpamId} className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 mb-6 h-auto bg-transparent">
                  {satpamTabs.map((satpamTab) => {
                    const completed = satpamTab.locationsStatus.filter(s => s.isCheckedToday).length;
                    const total = satpamTab.locationsStatus.length;
                    const isComplete = completed === total && total > 0;

                    return (
                      <TabsTrigger
                        key={satpamTab.satpamId}
                        value={satpamTab.satpamId}
                        className={cn(
                          "flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all",
                          isComplete
                            ? "border-green-500 bg-green-50 data-[state=active]:bg-green-100"
                            : "border-gray-200 hover:border-purple-300"
                        )}
                      >
                        <span className="font-semibold text-sm">{satpamTab.satpamName.split(' ')[0]}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            isComplete ? "bg-green-500 text-white border-green-500" : "bg-gray-100"
                          )}
                        >
                          {completed}/{total}
                        </Badge>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {satpamTabs.map((satpamTab) => (
                  <TabsContent key={satpamTab.satpamId} value={satpamTab.satpamId}>
                    <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-bold text-gray-800">
                            {satpamTab.satpamName}
                          </h4>
                          <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                            <MapPin className="h-4 w-4" />
                            {satpamTab.locationDisplay}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Progress</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {satpamTab.locationsStatus.filter(s => s.isCheckedToday).length}/
                            {satpamTab.locationsStatus.length}
                          </p>
                        </div>
                      </div>
                    </div>

                    {satpamTab.locationsStatus.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        Tidak ada lokasi yang ditugaskan
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead className="font-semibold">Nama Lokasi</TableHead>
                              <TableHead className="font-semibold">Gedung</TableHead>
                              <TableHead className="font-semibold text-center">Status</TableHead>
                              <TableHead className="font-semibold text-center">Waktu</TableHead>
                              <TableHead className="font-semibold text-center">Foto</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {satpamTab.locationsStatus.map((status) => (
                              <TableRow key={status.location.id} className="hover:bg-purple-50 transition-colors">
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-purple-600" />
                                    {status.location.name}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    {status.location.posisi_gedung || 'N/A'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  {status.isCheckedToday ? (
                                    <Badge className="bg-green-500 hover:bg-green-600">
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Sudah Dicek
                                    </Badge>
                                  ) : (
                                    <Badge variant="destructive">
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Belum Dicek
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-center font-medium">
                                  {status.lastCheckedAt || '-'}
                                </TableCell>
                                <TableCell className="text-center">
                                  {status.photoUrl ? (
                                    <a
                                      href={status.photoUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                    >
                                      <Camera className="h-4 w-4" />
                                      Lihat Foto
                                    </a>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SupervisorDashboard;