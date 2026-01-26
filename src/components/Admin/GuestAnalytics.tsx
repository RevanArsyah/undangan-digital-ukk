import React, { useState, useEffect } from "react";
import { BarChart3, Users, Eye, CheckCircle, Send } from "lucide-react";

interface GuestStats {
  summary: {
    total_invitations: number;
    total_opened: number;
    total_rsvp: number;
    total_sent: number;
    total_not_opened: number;
    opened_percentage: number;
    rsvp_percentage: number;
  };
  by_category: Array<{
    guest_category: string;
    total_invitations: number;
    opened_count: number;
    rsvp_count: number;
    sent_count: number;
    avg_open_count: number;
  }>;
  recent_activity: Array<{
    guest_name: string;
    guest_slug: string;
    last_opened_at: string;
    qr_open_count: number;
  }>;
}

const GuestAnalytics: React.FC = () => {
  const [stats, setStats] = useState<GuestStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/guests/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-500">Loading analytics...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-500">Failed to load analytics</div>
      </div>
    );
  }

  const { summary, by_category, recent_activity } = stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Guest Analytics
          </h2>
          <p className="text-sm text-slate-500">
            Invitation tracking and statistics
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Invitations</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {summary.total_invitations}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900">
              <Eye className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Opened</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {summary.total_opened}
              </p>
              <p className="text-xs text-green-600">
                {summary.opened_percentage.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900">
              <CheckCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500">RSVP Received</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {summary.total_rsvp}
              </p>
              <p className="text-xs text-purple-600">
                {summary.rsvp_percentage.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-100 p-3 dark:bg-orange-900">
              <Send className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Sent</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {summary.total_sent}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          Breakdown by Category
        </h3>
        <div className="space-y-4">
          {by_category.map((cat) => (
            <div key={cat.guest_category} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium capitalize text-slate-700 dark:text-slate-300">
                  {cat.guest_category}
                </span>
                <span className="text-sm text-slate-500">
                  {cat.total_invitations} guests
                </span>
              </div>
              <div className="flex gap-4 text-xs text-slate-600 dark:text-slate-400">
                <span>👁️ {cat.opened_count} opened</span>
                <span>✅ {cat.rsvp_count} RSVP</span>
                <span>📧 {cat.sent_count} sent</span>
                <span>📊 {cat.avg_open_count} avg opens</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                <div
                  className="h-full bg-blue-600"
                  style={{
                    width: `${(cat.opened_count / cat.total_invitations) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          Recent Activity
        </h3>
        <div className="space-y-3">
          {recent_activity.length === 0 ? (
            <p className="text-sm text-slate-500">No activity yet</p>
          ) : (
            recent_activity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 dark:border-slate-700"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {activity.guest_name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(activity.last_opened_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-blue-600">
                    {activity.qr_open_count} opens
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default GuestAnalytics;
