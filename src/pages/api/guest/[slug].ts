import type { APIRoute } from "astro";
import db from "../../../lib/db";
import { slugToName } from "../../../utils/slugify";

/**
 * GET /api/guest/[slug]
 * Lookup guest by slug and track QR code opening
 */
export const GET: APIRoute = async ({ params }) => {
  try {
    const { slug } = params;

    if (!slug) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Slug parameter is required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Lookup guest by slug
    const guestStmt = db.prepare(`
      SELECT * FROM guest_invitations 
      WHERE guest_slug = ?
    `);
    const guest = guestStmt.get(slug) as any;

    if (!guest) {
      // Fallback: Return slug converted to name for backward compatibility
      return new Response(
        JSON.stringify({
          success: false,
          message: "Guest not found in database",
          fallback_name: slugToName(slug),
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Update tracking: increment open count and update timestamps
    const updateStmt = db.prepare(`
      UPDATE guest_invitations 
      SET 
        qr_open_count = qr_open_count + 1,
        last_opened_at = CURRENT_TIMESTAMP,
        qr_opened_at = COALESCE(qr_opened_at, CURRENT_TIMESTAMP)
      WHERE id = ?
    `);
    updateStmt.run(guest.id);

    // Get updated data
    const updatedGuest = guestStmt.get(slug) as any;

    return new Response(
      JSON.stringify({
        success: true,
        guest: updatedGuest,
        tracking_updated: true,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in GET /api/guest/[slug]:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
