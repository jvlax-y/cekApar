import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Html5QrcodeScanner } from "html5-qrcode";

const ScanApar = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const locationId = searchParams.get("id");
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [manualInput, setManualInput] = useState("");
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    if (isScanning) {
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        false
      );

      scannerRef.current.render(
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        (error) => {
          console.warn("QR scan error:", error);
        }
      );
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, [isScanning]);

  const handleScanSuccess = (aparCode: string) => {
    if (!locationId) {
      toast.error("ID lokasi tidak ditemukan");
      return;
    }

    toast.success("QR APAR berhasil dipindai");
    navigate(`/cek-apar?id=${locationId}&apar=${aparCode}`);
  };

  const handleManualSubmit = () => {
    if (!manualInput.trim()) {
      toast.error("Masukkan kode APAR terlebih dahulu");
      return;
    }
    handleScanSuccess(manualInput);
  };

  return (
    <div className="flex flex-col items-center p-4 space-y-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Scan QR APAR</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isScanning ? (
            <>
              <div id="qr-reader" style={{ width: "100%" }}></div>
              <Button 
                variant="outline"
                onClick={() => setIsScanning(false)}
                className="w-full"
              >
                Input Manual
              </Button>
            </>
          ) : (
            <>
              <Input
                placeholder="Masukkan kode APAR (contoh: APAR001)"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
              />
              <Button 
                onClick={handleManualSubmit}
                className="w-full"
                disabled={!manualInput.trim()}
              >
                Lanjutkan Cek APAR
              </Button>
              <Button 
                variant="outline"
                onClick={() => setIsScanning(true)}
                className="w-full"
              >
                Kembali ke Scanner
              </Button>
            </>
          )}
          <Button 
            variant="outline"
            onClick={() => navigate(-1)}
            className="w-full"
          >
            Kembali
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScanApar;