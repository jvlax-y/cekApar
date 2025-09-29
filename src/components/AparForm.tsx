import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Edit, MapPin, QrCode } from "lucide-react";

const locationSchema = z.object({
  name: z.string().min(1, "Nama lokasi wajib diisi"),
  posisi_gedung: z.string().min(1, "Posisi gedung wajib dipilih"),
});

type LocationFormValues = z.infer<typeof locationSchema>;

interface Location {
  id: string;
  name: string;
  posisi_gedung: string;
  qr_code: string;
  created_at: string;
}

const AparForm: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: "",
      posisi_gedung: "",
    },
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
      toast.error("Gagal memuat data lokasi");
    }
  };

  const onSubmit = async (values: LocationFormValues) => {
    setLoading(true);
    try {
      const qrCode = `LOC-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      
      const locationData = {
        ...values,
        qr_code: qrCode
      };

      const { data, error } = await supabase
        .from('locations')
        .insert([locationData])
        .select()
        .single();

      if (error) throw error;

      toast.success("Lokasi berhasil dibuat dan QR Code di-generate otomatis.");
      setLocations(prev => [data, ...prev]);
      form.reset();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Gagal membuat lokasi: ${errorMessage}`);
      console.error("Error creating location:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus lokasi ini?")) return;

    try {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setLocations(prev => prev.filter(loc => loc.id !== id));
      toast.success("Lokasi berhasil dihapus");
    } catch (error) {
      console.error("Error deleting location:", error);
      toast.error("Gagal menghapus lokasi");
    }
  };

  const { name, posisi_gedung } = form.watch();

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-blue-50/30 to-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl -z-10"></div>
        <CardHeader className="bg-gradient-to-r from-[#1e3c72] to-[#2a5298] text-white">
          <CardTitle className="flex items-center gap-2 text-xl">
            <MapPin className="h-5 w-5" />
            Buat Lokasi Cek Apar Baru
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-semibold">Nama Lokasi</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Contoh: Pos Utama, Gudang A" 
                        {...field}
                        className="border-2 border-gray-200 focus:border-[#2a5298] focus:ring-2 focus:ring-[#2a5298]/20 transition-all duration-200 bg-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="posisi_gedung"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-semibold">Posisi Gedung</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-2 border-gray-200 focus:border-[#2a5298] focus:ring-2 focus:ring-[#2a5298]/20 transition-all duration-200">
                          <SelectValue placeholder="Pilih posisi gedung" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Gedung Barat">Gedung Barat</SelectItem>
                        <SelectItem value="Gedung Timur">Gedung Timur</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-[#1e3c72] via-[#2a5298] to-[#3a62b8] hover:from-[#2a5298] hover:via-[#3a62b8] hover:to-[#1e3c72] text-white font-bold py-3 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-[1.02] transform" 
                disabled={!name || !posisi_gedung || loading}
              >
                <QrCode className="mr-2 h-5 w-5" />
                {loading ? "Menyimpan..." : "Buat Lokasi & Generate QR Code"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-[#1e3c72] to-[#2a5298] text-white">
          <CardTitle className="flex items-center gap-2 text-xl">
            <MapPin className="h-5 w-5" />
            Daftar Lokasi
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {locations.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <MapPin className="h-8 w-8 text-[#2a5298]" />
              </div>
              <p className="text-gray-500 text-lg">
                Belum ada lokasi yang dibuat
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
                    <TableHead className="text-[#1e3c72] font-bold">Nama Lokasi</TableHead>
                    <TableHead className="text-[#1e3c72] font-bold">Posisi Gedung</TableHead>
                    <TableHead className="text-[#1e3c72] font-bold">QR Code</TableHead>
                    <TableHead className="text-[#1e3c72] font-bold">Dibuat Pada</TableHead>
                    <TableHead className="text-right text-[#1e3c72] font-bold">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((location, index) => (
                    <TableRow 
                      key={location.id} 
                      className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200 border-b border-gray-100"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell className="font-semibold text-gray-800">{location.name}</TableCell>
                      <TableCell className="text-gray-600">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-[#2a5298] rounded-full text-sm font-medium">
                          <MapPin className="h-3 w-3" />
                          {location.posisi_gedung}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 font-mono text-sm px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-[#1e3c72] rounded-lg font-semibold">
                          <QrCode className="h-3 w-3" />
                          {location.qr_code}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">
                        {new Date(location.created_at).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-2 border-[#2a5298] text-[#2a5298] hover:bg-[#2a5298] hover:text-white transition-all duration-200 hover:scale-105 transform"
                            onClick={() => {
                              toast.info("Fitur edit akan segera tersedia");
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="hover:scale-105 transform transition-all duration-200"
                            onClick={() => handleDelete(location.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AparForm;