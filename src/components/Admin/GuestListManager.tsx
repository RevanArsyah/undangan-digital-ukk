import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle,
  Clock,
} from "lucide-react";
import { generateGuestSlug } from "../../utils/slugify";

interface Guest {
  id: number;
  guest_name: string;
  guest_slug: string;
  phone: string | null;
  email: string | null;
  guest_category: string;
  max_guests: number;
  qr_open_count: number;
  has_rsvp: number;
  is_sent: number;
  created_at: string;
}

const GuestListManager: React.FC = () => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [formData, setFormData] = useState({
    guest_name: "",
    phone: "",
    email: "",
    guest_category: "lainnya",
    max_guests: 2,
    notes: "",
  });

  useEffect(() => {
    fetchGuests();
  }, [categoryFilter, statusFilter]);

  const fetchGuests = async () => {
    setLoading(true);
    try {
      let url = "/api/admin/guests?limit=1000";
      if (categoryFilter) url += `&category=${categoryFilter}`;
      if (statusFilter === "opened") url += `&is_opened=true`;
      if (statusFilter === "not_opened") url += `&is_opened=false`;
      if (statusFilter === "has_rsvp") url += `&has_rsvp=true`;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingGuest
        ? "/api/admin/guests"
        : "/api/admin/guests";
      const method = editingGuest ? "PUT" : "POST";

      const payload = editingGuest
        ? { id: editingGuest.id, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        alert(editingGuest ? "Guest updated!" : "Guest added!");
        setShowForm(false);
        setEditingGuest(null);
        resetForm();
        fetchGuests();
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error("Error saving guest:", error);
      alert("Failed to save guest");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this guest?")) return;

    try {
      const res = await fetch("/api/admin/guests", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Guest deleted!");
        fetchGuests();
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error("Error deleting guest:", error);
      alert("Failed to delete guest");
    }
  };

  const handleEdit = (guest: Guest) => {
    setEditingGuest(guest);
    setFormData({
      guest_name: guest.guest_name,
      phone: guest.phone || "",
      email: guest.email || "",
      guest_category: guest.guest_category,
      max_guests: guest.max_guests,
      notes: "",
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      guest_name: "",
      phone: "",
      email: "",
      guest_category: "lainnya",
      max_guests: 2,
      notes: "",
    });
  };

  const filteredGuests = guests.filter((guest) =>
    guest.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      keluarga: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      teman: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      kantor: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      lainnya: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    };
    return colors[category] || colors.lainnya;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Guest List
            </h2>
            <p className="text-sm text-slate-500">
              Manage invitation guests ({filteredGuests.length} total)
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingGuest(null);
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          Add Guest
        </button>
      </div>

      {/* Filters */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search guests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        >
          <option value="">All Categories</option>
          <option value="keluarga">Keluarga</option>
          <option value="teman">Teman</option>
          <option value="kantor">Kantor</option>
          <option value="lainnya">Lainnya</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        >
          <option value="">All Status</option>
          <option value="opened">Opened</option>
          <option value="not_opened">Not Opened</option>
          <option value="has_rsvp">Has RSVP</option>
        </select>
      </div>

      {/* Guest Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 dark:bg-slate-800">
            <h3 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">
              {editingGuest ? "Edit Guest" : "Add New Guest"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Guest Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.guest_name}
                  onChange={(e) =>
                    setFormData({ ...formData, guest_name: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                {formData.guest_name && (
                  <p className="mt-1 text-xs text-blue-600 font-mono">
                    Slug: {generateGuestSlug(formData.guest_name)}
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Category
                  </label>
                  <select
                    value={formData.guest_category}
                    onChange={(e) =>
                      setFormData({ ...formData, guest_category: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="keluarga">Keluarga</option>
                    <option value="teman">Teman</option>
                    <option value="kantor">Kantor</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Max Guests
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formData.max_guests}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_guests: parseInt(e.target.value),
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  {editingGuest ? "Update" : "Add"} Guest
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingGuest(null);
                    resetForm();
                  }}
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-2 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Guest Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                Guest Name
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                Contact
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                Category
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                Max
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                Status
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Loading...
                </td>
              </tr>
            ) : filteredGuests.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No guests found
                </td>
              </tr>
            ) : (
              filteredGuests.map((guest) => (
                <tr
                  key={guest.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {guest.guest_name}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">
                        {guest.guest_slug}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {guest.phone && <div>{guest.phone}</div>}
                    {guest.email && <div className="text-xs">{guest.email}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getCategoryBadge(
                        guest.guest_category
                      )}`}
                    >
                      {guest.guest_category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-slate-600 dark:text-slate-400">
                    {guest.max_guests}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      {guest.has_rsvp === 1 && (
                        <CheckCircle className="h-4 w-4 text-green-600" title="Has RSVP" />
                      )}
                      {guest.qr_open_count > 0 ? (
                        <span className="text-xs text-blue-600" title={`Opened ${guest.qr_open_count} times`}>
                          👁️ {guest.qr_open_count}
                        </span>
                      ) : (
                        <Clock className="h-4 w-4 text-slate-400" title="Not opened yet" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <a
                        href={`/?to=${guest.guest_slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                        title="Open invitation"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => handleEdit(guest)}
                        className="text-slate-600 hover:text-slate-700"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(guest.id)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GuestListManager;
