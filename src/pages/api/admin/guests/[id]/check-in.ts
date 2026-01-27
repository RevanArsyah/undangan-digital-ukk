import type { APIRoute } from "astro";
import db from "../../../../../lib/db";

export const POST: APIRoute = async ({ params, request, cookies }) => {
  try {
    // Check authentication
    const sessionToken = cookies.get("wedding_admin_session")?.value;
    if (!sessionToken) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id } = params;
    const body = await request.json();
    const { checked_in_by, check_in_notes } = body;

    // Verify guest exists
    const guest = db
      .prepare("SELECT * FROM guest_invitations WHERE id = ?")
      .get(id);

    if (!guest) {
      return new Response(JSON.stringify({ error: "Guest not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update check-in status
    const stmt = db.prepare(`
      UPDATE guest_invitations 
      SET checked_in_at = CURRENT_TIMESTAMP,
          checked_in_by = ?,
          check_in_notes = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(checked_in_by || "Admin", check_in_notes || "", id);

    // Get updated guest data
    const updatedGuest = db
      .prepare("SELECT * FROM guest_invitations WHERE id = ?")
      .get(id);

    return new Response(JSON.stringify(updatedGuest), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Check-in error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to check in guest" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
