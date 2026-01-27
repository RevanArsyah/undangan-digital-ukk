import React, { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, Download, Loader2 } from "lucide-react";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  guestName: string;
}

interface GuestData {
  id: number;
  guest_name: string;
  guest_slug: string;
  guest_category?: string;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  guestName,
}) => {
  const [guestData, setGuestData] = useState<GuestData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && guestName) {
      fetchGuestData();
    }
  }, [isOpen, guestName]);

  const fetchGuestData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Convert guest name to slug format for API call
      const slug = guestName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

      const response = await fetch(`/api/guest/${slug}`);
      const data = await response.json();

      if (data.success && data.guest) {
        setGuestData(data.guest);
      } else {
        // Fallback: use guest name if not found in database
        setGuestData({
          id: 0,
          guest_name: guestName,
          guest_slug: slug,
        });
      }
    } catch (err) {
      console.error("Error fetching guest data:", err);
      setError("Gagal memuat data tamu");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Generate QR code data using guest_slug for backend compatibility
  const qrData = guestData?.guest_slug || guestName;

  const handleDownload = () => {
    const canvas = document.createElement("canvas");
    const svg = document.querySelector("#guest-qr-code") as SVGElement;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `qr-${guestData?.guest_slug || "guest"}.png`;
            link.click();
          }
        });
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl border border-white/20 bg-white/95 dark:bg-slate-900/95 p-6 md:p-8 shadow-2xl animate-scaleIn max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-[250] rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors shadow-lg bg-white dark:bg-slate-900"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-accent" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Memuat QR Code...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={fetchGuestData}
              className="text-sm text-accent hover:underline"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            {/* Title */}
            <div className="space-y-1 pt-2">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
                QR Check-in
              </h2>
              <p className="text-base font-medium text-slate-700 dark:text-slate-300">
                {guestData?.guest_name || guestName}
              </p>
              {guestData?.guest_category && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {guestData.guest_category}
                </p>
              )}
            </div>

            {/* QR Code - Larger and more prominent */}
            <div className="flex justify-center rounded-2xl bg-white p-6 shadow-inner dark:bg-slate-800">
              <QRCodeSVG
                id="guest-qr-code"
                value={qrData}
                size={280}
                level="H"
                includeMargin={true}
                className="rounded-lg"
              />
            </div>

            {/* Instructions */}
            <div className="space-y-2 rounded-xl bg-blue-50 p-3 dark:bg-blue-900/20">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                📱 Tunjukkan QR ini saat check-in
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Simpan screenshot atau tunjukkan langsung dari halaman ini
                kepada panitia di lokasi acara
              </p>
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 font-semibold text-white shadow-lg transition-all hover:bg-accent/90 hover:shadow-xl active:scale-95 dark:bg-accent dark:text-slate-900"
            >
              <Download className="h-5 w-5" />
              Download QR Code
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default QRCodeModal;

