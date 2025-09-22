import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { QrReader } from "react-qr-reader";

const ScanLocation = () => {
  const [qrResult, setQrResult] = useState<string | null>(null);

  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold mb-2">Scan QR Code Lokasi</h3>
      <QrReader
        constraints={{ facingMode: "environment" }}
        onResult={(result, error) => {
          if (result) {
            setQrResult(result?.getText?.() ?? result?.text ?? "");
            console.log("QR Data:", result?.getText?.() ?? result?.text);
          }
          if (error) {
            console.warn(error);
          }
        }}
        style={{ width: "100%" }}
      />
      {qrResult && (
        <p className="mt-2 text-green-600">
          ✅ QR Terdeteksi: <strong>{qrResult}</strong>
        </p>
      )}
    </div>
  );
};

const aparCheckSchema = z.object({
  foto_apar: z
    .any()
    .refine((file) => file?.length > 0, "Foto APAR wajib diupload"),
  qr_code: z.string().min(1, "QR Code wajib discan"),
  kondisi: z.enum(["Baik", "Rusak", "Perlu Perawatan"], {
    required_error: "Kondisi wajib dipilih",
  }),
});

type AparCheckValues = z.infer<typeof aparCheckSchema>;

interface AparCheckFormProps {
  onChecked: () => void;
}

const AparForm: React.FC<AparCheckFormProps> = ({ onChecked }) => {
  const form = useForm<AparCheckValues>({
    resolver: zodResolver(aparCheckSchema),
    defaultValues: {
      foto_apar: undefined,
      qr_code: "",
      kondisi: undefined as unknown as "Baik" | "Rusak" | "Perlu Perawatan" | undefined,
    },
  });

  const onSubmit = async (values: AparCheckValues) => {
    try {
      // TODO: insert ke Supabase
      toast.success("APAR berhasil dicek dan dicatat.");
      form.reset();
      onChecked();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(`Gagal mencatat APAR: ${error.message}`);
        console.error("Error checking APAR:", error);
      } else {
        toast.error("Gagal mencatat APAR: Terjadi kesalahan tidak diketahui");
        console.error("Unknown error:", error);
      }
    }
  };

  return (
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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

        {/* Scanner QR masuk sini */}
        <ScanLocation />

        <Button type="submit" className="w-full">
          Buat Lokasi & QR Code
        </Button>
      </form>
    </Form>
  );
};

export default AparForm;