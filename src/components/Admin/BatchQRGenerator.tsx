import React, { useState, useEffect, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, QrCode, Loader2 } from "lucide-react";
import { WEDDING_CONFIG } from "../../constants";
import JSZip from "jszip";

interface Guest {
  id: number;
  guest_name: string;
  guest_slug: string;
  guest_category: string;
}

interface BatchQRGeneratorProps {
  siteUrl: string;
}

const BatchQRGenerator: React.FC<BatchQRGeneratorProps> = ({ siteUrl }) => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const canvasRefs = useRef<{ [key: number]: HTMLCanvasElement | null }>({});

  const baseUrl = siteUrl?.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl || "";

  // Generate center logo (same as QRCodeGenerator)
  const centerLogo = React.useMemo(() => {
    try {
      const bInitial = (WEDDING_CONFIG?.couple?.bride?.name || "B")
        .charAt(0)
        .toUpperCase();
      const gInitial = (WEDDING_CONFIG?.couple?.groom?.name || "G")
        .charAt(0)
        .toUpperCase();

      const svgString = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#F59E0B;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#B45309;stop-opacity:1" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="48" fill="white" />
          <circle cx="50" cy="50" r="46" fill="none" stroke="url(#goldGradient)" stroke-width="2" />
          <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" stroke-width="1" />
          <g font-family="'Times New Roman', Times, serif" font-weight="bold" font-size="40" fill="#334155" text-anchor="middle">
             <text x="26" y="64">${bInitial}</text>
             <text x="74" y="64">${gInitial}</text>
          </g>
          <path d="M50 38 
                   C 46 32, 36 33, 36 42 
                   C 36 52, 50 64, 50 64 
                   C 50 64, 64 52, 64 42 
                   C 64 33, 54 32, 50 38 Z" 
                fill="#e11d48" 
                stroke="white" 
                stroke-width="1.5" />
        </svg>
      `.trim();

      return `data:image/svg+xml;base64,${btoa(svgString)}`;
    } catch (e) {
      console.error("Logo Generation Error:", e);
      return "";
    }
  }, []);

  useEffect(() => {
    fetchGuests();
  }, [selectedCategory]);

  const fetchGuests = async () => {
    setLoading(true);
    try {
      let url = "/api/admin/guests?limit=1000";
      if (selectedCategory) url += `&category=${selectedCategory}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setGuests(data.guests);
      }
    } catch (error) {
      console.error("Error fetching guests:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadAllQR = async () => {
    setGenerating(true);
    
    try {
      // Wait for all canvases to render
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create ZIP file
      const zip = new JSZip();
      const qrFolder = zip.folder("QR-Codes");

      // Add each QR code to ZIP
      guests.forEach((guest) => {
        const canvas = canvasRefs.current[guest.id];
        if (canvas && qrFolder) {
          // Convert canvas to base64 (remove data:image/png;base64, prefix)
          const base64Data = canvas.toDataURL("image/png").split(",")[1];
          qrFolder.file(`${guest.guest_slug}.png`, base64Data, { base64: true });
        }
      });

      // Generate ZIP and download
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(zipBlob);
      downloadLink.download = `QR-Codes-${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(downloadLink.href);

      alert(`✅ Downloaded ${guests.length} QR codes as ZIP!`);
    } catch (error) {
      console.error("Error generating ZIP:", error);
      alert("❌ Failed to generate ZIP file");
    } finally {
      setGenerating(false);
    }
  };

  const downloadSingleQR = (guest: Guest) => {
    const canvas = canvasRefs.current[guest.id];
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `QR-${guest.guest_slug}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const filteredGuests = guests;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <QrCode className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Batch QR Generator
            </h2>
            <p className="text-sm text-slate-500">
              Generate QR codes for all guests ({filteredGuests.length} total)
            </p>
          </div>
        </div>
        <button
          onClick={downloadAllQR}
          disabled={generating || filteredGuests.length === 0}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {generating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-5 w-5" />
              Download All ({filteredGuests.length})
            </>
          )}
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-4">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        >
          <option value="">All Categories</option>
          <option value="keluarga">Keluarga</option>
          <option value="teman">Teman</option>
          <option value="kantor">Kantor</option>
          <option value="lainnya">Lainnya</option>
        </select>
      </div>

      {/* QR Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : filteredGuests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
          <QrCode className="mb-2 h-12 w-12" />
          <p>No guests found</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredGuests.map((guest) => (
            <div
              key={guest.id}
              className="flex flex-col items-center rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="mb-3 rounded-lg border border-slate-100 bg-white p-3 dark:border-slate-700">
                <QRCodeCanvas
                  ref={(el) => (canvasRefs.current[guest.id] = el)}
                  value={`${baseUrl}/?to=${guest.guest_slug}`}
                  size={180}
                  level="H"
                  includeMargin={true}
                  imageSettings={
                    centerLogo
                      ? {
                          src: centerLogo,
                          height: 45,
                          width: 45,
                          excavate: true,
                        }
                      : undefined
                  }
                />
              </div>
              <div className="mb-3 text-center">
                <p className="font-medium text-slate-900 dark:text-white">
                  {guest.guest_name}
                </p>
                <p className="text-xs text-slate-500 font-mono">
                  {guest.guest_slug}
                </p>
                <span className="mt-1 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {guest.guest_category}
                </span>
              </div>
              <button
                onClick={() => downloadSingleQR(guest)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BatchQRGenerator;
