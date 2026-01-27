import React, { useState, useEffect } from "react";
import {
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  Camera,
  RefreshCw,
} from "lucide-react";
import QRScanner from "./QRScanner";

interface CheckInStats {
  total_guests: number;
  checked_in: number;
  not_checked_in: number;
  check_in_rate: number;
  recent_check_ins: Array<{
    id: number;
    guest_name: string;
    guest_category: string;
    checked_in_at: string;
    checked_in_by: string;
    check_in_notes: string;
  }>;
}

const CheckInDashboard: React.FC = () => {
  const [stats, setStats] = useState<CheckInStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/check-in/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleScanSuccess = async (decodedText: string) => {
    try {
      let slug: string | null = null;

      // Try to parse as URL first
      try {
        const url = new URL(decodedText);
        slug = url.searchParams.get("to");
      } catch {
        // If not a URL, treat as direct slug
        slug = decodedText.trim();
      }

      if (!slug) {
        setCheckInMessage({
          type: "error",
          text: "QR code tidak valid. Tidak ditemukan data tamu.",
        });
        setShowScanner(false);
        return;
      }

      // Find guest by slug
      const guestResponse = await fetch(`/api/guest/${slug}`);
      if (!guestResponse.ok) {
        setCheckInMessage({
          type: "error",
          text: "Tamu tidak ditemukan dalam database.",
        });
        setShowScanner(false);
        return;
      }

      const guestData = await guestResponse.json();
      const guest = guestData.guest;

      // Check if already checked in
      if (guest.checked_in_at) {
        setCheckInMessage({
          type: "error",
          text: `${guest.guest_name} sudah check-in pada ${new Date(guest.checked_in_at).toLocaleString("id-ID")}`,
        });
        setShowScanner(false);
        return;
      }

      // Perform check-in
      const checkInResponse = await fetch(
        `/api/admin/guests/${guest.id}/check-in`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            checked_in_by: "QR Scanner",
            check_in_notes: "Check-in via QR code scan",
          }),
        }
      );

      if (checkInResponse.ok) {
        setShowScanner(false);
        setCheckInMessage({
          type: "success",
          text: `✅ ${guest.guest_name} berhasil check-in!`,
        });
        // Refresh stats
        fetchStats();
      } else {
        setCheckInMessage({
          type: "error",
          text: "Gagal melakukan check-in. Silakan coba lagi.",
        });
        setShowScanner(false);
      }
    } catch (error) {
      console.error("Check-in error:", error);
      setCheckInMessage({
        type: "error",
        text: "Terjadi kesalahan. Pastikan QR code valid.",
      });
      setShowScanner(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">Gagal memuat statistik check-in.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tamu</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.total_guests}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sudah Check-in</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.checked_in}
              </p>
            </div>
            <UserCheck className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Belum Check-in</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.not_checked_in}
              </p>
            </div>
            <UserX className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tingkat Kehadiran</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.check_in_rate}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowScanner(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 shadow-lg"
        >
          <Camera className="w-5 h-5" />
          Scan QR Code Tamu
        </button>
      </div>

      {/* Check-in Message */}
      {checkInMessage && (
        <div
          className={`p-4 rounded-lg border ${
            checkInMessage.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          <p className="font-medium">{checkInMessage.text}</p>
          <button
            onClick={() => setCheckInMessage(null)}
            className="mt-2 text-sm underline"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Recent Check-ins */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-lg">Check-in Terbaru</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {stats.recent_check_ins.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Belum ada tamu yang check-in
            </div>
          ) : (
            stats.recent_check_ins.map((checkIn) => (
              <div key={checkIn.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {checkIn.guest_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {checkIn.guest_category}
                    </p>
                    {checkIn.check_in_notes && (
                      <p className="text-sm text-gray-500 mt-1">
                        {checkIn.check_in_notes}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>
                      {new Date(checkIn.checked_in_at).toLocaleDateString(
                        "id-ID"
                      )}
                    </p>
                    <p>
                      {new Date(checkIn.checked_in_at).toLocaleTimeString(
                        "id-ID"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};

export default CheckInDashboard;
