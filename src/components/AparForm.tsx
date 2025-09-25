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
import { Trash2, Edit } from "lucide-react";

// Schema for location form
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

  // Fetch existing locations on component mount
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
      // Generate QR code automatically
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
      
      // Add new location to state
      setLocations(prev => [data, ...prev]);
      
      // Reset form
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

  // Check if form is valid
  const { name, posisi_gedung } = form.watch();

  return (
    <div className="space-y-6">
      {/* Form Section */}
      <Card>
        <CardHeader>
          <CardTitle>Buat Lokasi Cek Apar Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Lokasi</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Pos Utama, Gudang A" {...field} />
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
                    <FormLabel>Posisi Gedung</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
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

              {/* Remove QR Scanner section - not needed anymore */}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={!name || !posisi_gedung || loading}
              >
                {loading ? "Menyimpan..." : "Buat Lokasi & Generate QR Code"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Table Section */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Lokasi</CardTitle>
        </CardHeader>
        <CardContent>
          {locations.length === 0 ? (
            <p className="text-center text-gray-500 py-4">
              Belum ada lokasi yang dibuat
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Lokasi</TableHead>
                  <TableHead>Posisi Gedung</TableHead>
                  <TableHead>QR Code</TableHead>
                  <TableHead>Dibuat Pada</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell className="font-medium">{location.name}</TableCell>
                    <TableCell>{location.posisi_gedung}</TableCell>
                    <TableCell className="font-mono text-sm">{location.qr_code}</TableCell>
                    <TableCell>
                      {new Date(location.created_at).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
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
                          onClick={() => {
                            // TODO: Implement edit functionality
                            toast.info("Fitur edit akan segera tersedia");
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AparForm;