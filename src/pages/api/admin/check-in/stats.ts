import type { APIRoute } from "astro";
import db from "../../../../lib/db";

export const GET: APIRoute = async ({ request }) => {
  try {
    // Check admin authentication
    const cookie = request.headers.get("cookie");
    if (!cookie?.includes("admin_session")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get check-in statistics
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

    const stats: CheckInStats = {
      total_guests: 0,
      checked_in: 0,
      not_checked_in: 0,
      check_in_rate: 0,
      recent_check_ins: [],
    };

    // Total guests
    const totalStmt = db.prepare(
      "SELECT COUNT(*) as count FROM guest_invitations"
    );
    stats.total_guests = (totalStmt.get() as any).count;

    // Checked in count
    const checkedInStmt = db.prepare(
      "SELECT COUNT(*) as count FROM guest_invitations WHERE checked_in_at IS NOT NULL"
    );
    stats.checked_in = (checkedInStmt.get() as any).count;

    // Not checked in
    stats.not_checked_in = stats.total_guests - stats.checked_in;

    // Check-in rate
    stats.check_in_rate =
      stats.total_guests > 0
        ? Math.round((stats.checked_in / stats.total_guests) * 100)
        : 0;

    // Recent check-ins (last 10)
    const recentStmt = db.prepare(`
      SELECT 
        id,
        guest_name,
        guest_category,
        checked_in_at,
        checked_in_by,
        check_in_notes
      FROM guest_invitations 
      WHERE checked_in_at IS NOT NULL
      ORDER BY checked_in_at DESC
      LIMIT 10
    `);
    stats.recent_check_ins = recentStmt.all() as Array<{
      id: number;
      guest_name: string;
      guest_category: string;
      checked_in_at: string;
      checked_in_by: string;
      check_in_notes: string;
    }>;

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching check-in stats:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch check-in stats" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
