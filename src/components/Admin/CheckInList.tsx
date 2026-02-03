import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, RefreshCw, Search } from "lucide-react";

interface Guest {
  id: number;
  guest_name: string;
  guest_category: string;
  phone_number: string;
  max_guests: number;
  checked_in_at: string | null;
  checked_in_by: string | null;
  check_in_notes: string | null;
  has_rsvp: boolean;
  rsvp_status: string | null;
}

interface CheckInListProps {
  currentUserRole?: string;
}

const CheckInList: React.FC<CheckInListProps> = ({ currentUserRole }) => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "checked_in" | "not_checked_in">(
    "all"
  );
  const [searchQuery, setSearchQuery] = useState("");

  const fetchGuests = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/guests?limit=1000");
      if (response.ok) {
        const data = await response.json();
        setGuests(data.guests);
      }
    } catch (error) {
      console.error("Failed to fetch guests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, []);

  const handleManualCheckIn = async (guestId: number, guestName: string) => {
    if (!confirm(`Check-in ${guestName}?`)) return;

    try {
      const response = await fetch(`/api/admin/guests/${guestId}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checked_in_by: "Manual Entry",
          check_in_notes: "Manual check-in by admin",
        }),
      });

      if (response.ok) {
        alert(`✅ ${guestName} berhasil check-in!`);
        fetchGuests(); // Refresh list
      } else {
        alert("Gagal melakukan check-in");
      }
    } catch (error) {
      console.error("Check-in error:", error);
      alert("Terjadi kesalahan");
    }
  };

  const filteredGuests = guests
    .filter((guest) => {
      if (filter === "checked_in") return guest.checked_in_at !== null;
      if (filter === "not_checked_in") return guest.checked_in_at === null;
      return true;
    })
    .filter((guest) =>
      guest.guest_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari nama tamu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilter("checked_in")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "checked_in"
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Sudah Check-in
          </button>
          <button
            onClick={() => setFilter("not_checked_in")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "not_checked_in"
                ? "bg-orange-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Belum Check-in
          </button>
        </div>
      </div>

      {/* Guest List */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Nama Tamu
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Kategori
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Status Check-in
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Waktu Check-in
                </th>
                {currentUserRole !== "viewer" && (
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Aksi
                </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={currentUserRole === "viewer" ? 4 : 5} className="px-4 py-8 text-center text-gray-500">
                    Tidak ada tamu ditemukan
                  </td>
                </tr>
              ) : (
                filteredGuests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {guest.guest_name}
                        </p>
                        {guest.phone_number && (
                          <p className="text-sm text-gray-500">
                            {guest.phone_number}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {guest.guest_category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {guest.checked_in_at ? (
                        <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                          <CheckCircle className="w-4 h-4" />
                          Check-in
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-400">
                          <XCircle className="w-4 h-4" />
                          Belum
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {guest.checked_in_at ? (
                        <div>
                          <p>
                            {new Date(guest.checked_in_at).toLocaleDateString(
                              "id-ID"
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(guest.checked_in_at).toLocaleTimeString(
                              "id-ID"
                            )}
                          </p>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    {currentUserRole !== "viewer" && (
                    <td className="px-4 py-3">
                      {!guest.checked_in_at && (
                        <button
                          onClick={() =>
                            handleManualCheckIn(guest.id, guest.guest_name)
                          }
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          Check-in Manual
                        </button>
                      )}
                    </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="text-sm text-gray-600 text-center">
        Menampilkan {filteredGuests.length} dari {guests.length} tamu
      </div>
    </div>
  );
};

export default CheckInList;
