import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import QrCode from 'react-qr-code';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Printer } from 'lucide-react';

const PrintQRCode = () => {
  const { id } = useParams<{ id: string }>();
  const [qrCodeValue, setQrCodeValue] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQrCodeData = async () => {
      if (id) {
        const { data, error } = await supabase
          .from('locations')
          .select('name, qr_code') // Ganti jadi qr_code aja
          .eq('id', id)
          .single();

        if (error) {
          console.error("Error fetching QR code data:", error);
          toast.error("Gagal memuat data QR Code.");
          setQrCodeValue(null);
          setLocationName("Data Tidak Ditemukan");
        } else if (data) {
          setQrCodeValue(data.qr_code); // Ganti jadi qr_code
          setLocationName(data.name);
        }
      } else {
        setQrCodeValue(null);
        setLocationName("ID Lokasi Tidak Disediakan");
      }
      setLoading(false);
    };

    fetchQrCodeData();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#2a5298] border-t-transparent mb-4"></div>
          <p className="text-xl text-gray-600">Memuat QR Code...</p>
        </div>
      </div>
    );
  }

  if (!qrCodeValue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <p className="text-xl text-red-500">{locationName || "QR Code tidak ditemukan."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50 print:bg-white print:p-0 print:m-0 min-h-screen">
      {/* Header untuk print */}
      <div className="hidden print:block text-center mb-6">
        <p className="text-3xl font-bold text-gray-800">CEK AREA</p>
      </div>

      {/* QR Code */}
      <div className="p-6 bg-white border-2 border-gray-300 rounded-xl shadow-xl print:border print:shadow-none print:rounded-none">
        <QrCode
          value={qrCodeValue}
          size={384}
          level="H"
          id="qrcode-print-svg"
        />
      </div>

      {/* Nama lokasi untuk print */}
      {locationName && (
        <div className="hidden print:block text-center mt-6">
          <p className="text-3xl font-bold text-gray-800">{locationName}</p>
        </div>
      )}

      {/* Info di layar (tidak di-print) */}
      <div className="print:hidden mt-6 text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-800">
          QR Code untuk <span className="text-[#2a5298]">{locationName}</span>
        </h1>
        <p className="text-sm text-gray-600 max-w-md break-all px-4">
          Data: <span className="font-mono text-[#2a5298]">{qrCodeValue}</span>
        </p>
        <Button 
          onClick={handlePrint}
          className="bg-gradient-to-r from-[#1e3c72] to-[#2a5298] hover:from-[#2a5298] hover:to-[#1e3c72] text-white font-semibold px-6 py-3 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform"
        >
          <Printer className="mr-2 h-5 w-5" />
          Cetak QR Code
        </Button>
      </div>
    </div>
  );
};

export default PrintQRCode;