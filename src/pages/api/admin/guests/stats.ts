import type { APIRoute } from "astro";
import db from "../../../../lib/db";

/**
 * GET /api/admin/guests/stats
 * Get guest invitation statistics
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    // Check admin authentication
    const cookie = request.headers.get("cookie");
    if (!cookie?.includes("admin_session")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get overall summary
    const summaryStmt = db.prepare("SELECT * FROM v_guest_summary");
    const summary = summaryStmt.get() as any;

    // Get stats by category
    const categoryStmt = db.prepare("SELECT * FROM v_guest_stats");
    const byCategory = categoryStmt.all();

    // Get recent activity (last 10 opened invitations)
    const recentStmt = db.prepare(`
      SELECT guest_name, guest_slug, last_opened_at, qr_open_count
      FROM guest_invitations
      WHERE qr_open_count > 0
      ORDER BY last_opened_at DESC
      LIMIT 10
    `);
    const recentActivity = recentStmt.all();

    return new Response(
      JSON.stringify({
        success: true,
        summary: summary || {
          total_invitations: 0,
          total_opened: 0,
          total_rsvp: 0,
          total_sent: 0,
          total_not_opened: 0,
          opened_percentage: 0,
          rsvp_percentage: 0,
        },
        by_category: byCategory,
        recent_activity: recentActivity,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in GET /api/admin/guests/stats:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch statistics" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
