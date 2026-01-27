import React, { useState, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, X, CheckCircle, AlertCircle } from "lucide-react";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);

  useEffect(() => {
    const qrScanner = new Html5Qrcode("qr-reader");
    setScanner(qrScanner);

    return () => {
      if (qrScanner.isScanning) {
        qrScanner.stop().catch(console.error);
      }
    };
  }, []);

  const startScanning = async () => {
    if (!scanner) return;

    try {
      setError(null);
      setIsScanning(true);

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Successfully scanned
          onScanSuccess(decodedText);
          stopScanning();
        },
        (errorMessage) => {
          // Scanning error (can be ignored, happens frequently)
          console.debug("QR scan error:", errorMessage);
        }
      );
    } catch (err) {
      console.error("Failed to start scanner:", err);
      setError("Gagal mengakses kamera. Pastikan izin kamera telah diberikan.");
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scanner && scanner.isScanning) {
      try {
        await scanner.stop();
        setIsScanning(false);
      } catch (err) {
        console.error("Failed to stop scanner:", err);
      }
    }
  };

  const handleClose = async () => {
    await stopScanning();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Scan QR Code Tamu
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="p-4">
          <div
            id="qr-reader"
            className="w-full rounded-lg overflow-hidden border-2 border-gray-200"
            style={{ minHeight: "300px" }}
          ></div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {!isScanning && !error && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 text-center">
                Klik tombol di bawah untuk memulai scan QR code
              </p>
            </div>
          )}

          {isScanning && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 text-center flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Arahkan kamera ke QR code tamu
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t flex gap-2">
          {!isScanning ? (
            <button
              onClick={startScanning}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Mulai Scan
            </button>
          ) : (
            <button
              onClick={stopScanning}
              className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Berhenti Scan
            </button>
          )}
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
