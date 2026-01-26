import type { APIRoute } from "astro";
import db from "../../../lib/db";
import { generateGuestSlug, ensureUniqueSlug } from "../../../utils/slugify";

/**
 * GET /api/admin/guests
 * Get all guests with optional filters
 */
export const GET: APIRoute = async ({ url, request }) => {
  try {
    // Check admin authentication
    const cookie = request.headers.get("cookie");
    if (!cookie?.includes("admin_session")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse query parameters
    const category = url.searchParams.get("category");
    const hasRsvp = url.searchParams.get("has_rsvp");
    const isOpened = url.searchParams.get("is_opened");
    const search = url.searchParams.get("search");
    const limit = parseInt(url.searchParams.get("limit") || "100");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Build query
    let query = "SELECT * FROM guest_invitations WHERE 1=1";
    const params: any[] = [];

    if (category) {
      query += " AND guest_category = ?";
      params.push(category);
    }

    if (hasRsvp !== null) {
      query += " AND has_rsvp = ?";
      params.push(hasRsvp === "true" ? 1 : 0);
    }

    if (isOpened === "true") {
      query += " AND qr_open_count > 0";
    } else if (isOpened === "false") {
      query += " AND qr_open_count = 0";
    }

    if (search) {
      query += " AND (guest_name LIKE ? OR phone LIKE ? OR email LIKE ?)";
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const stmt = db.prepare(query);
    const guests = stmt.all(...params);

    // Get total count
    let countQuery = "SELECT COUNT(*) as total FROM guest_invitations WHERE 1=1";
    const countParams: any[] = [];

    if (category) {
      countQuery += " AND guest_category = ?";
      countParams.push(category);
    }

    if (hasRsvp !== null) {
      countQuery += " AND has_rsvp = ?";
      countParams.push(hasRsvp === "true" ? 1 : 0);
    }

    if (isOpened === "true") {
      countQuery += " AND qr_open_count > 0";
    } else if (isOpened === "false") {
      countQuery += " AND qr_open_count = 0";
    }

    if (search) {
      countQuery += " AND (guest_name LIKE ? OR phone LIKE ? OR email LIKE ?)";
      const searchPattern = `%${search}%`;
      countParams.push(searchPattern, searchPattern, searchPattern);
    }

    const countStmt = db.prepare(countQuery);
    const { total } = countStmt.get(...countParams) as { total: number };

    return new Response(
      JSON.stringify({
        success: true,
        guests,
        total,
        limit,
        offset,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in GET /api/admin/guests:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch guests" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * POST /api/admin/guests
 * Add new guest
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Check admin authentication
    const cookie = request.headers.get("cookie");
    if (!cookie?.includes("admin_session")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await request.json();
    const { guest_name, phone, email, guest_category, max_guests, notes } = data;

    // Validation
    if (!guest_name || !guest_name.trim()) {
      return new Response(
        JSON.stringify({ error: "Guest name is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generate slug
    const baseSlug = generateGuestSlug(guest_name);

    // Check for existing slugs to ensure uniqueness
    const existingSlugsStmt = db.prepare("SELECT guest_slug FROM guest_invitations");
    const existingSlugs = (existingSlugsStmt.all() as any[]).map(
      (row) => row.guest_slug
    );

    const uniqueSlug = ensureUniqueSlug(baseSlug, existingSlugs);

    // Insert guest
    const insertStmt = db.prepare(`
      INSERT INTO guest_invitations 
      (guest_name, guest_slug, phone, email, guest_category, max_guests, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      guest_name.trim(),
      uniqueSlug,
      phone || null,
      email || null,
      guest_category || "lainnya",
      max_guests || 2,
      notes || null
    );

    // Get the created guest
    const getStmt = db.prepare("SELECT * FROM guest_invitations WHERE id = ?");
    const newGuest = getStmt.get(result.lastInsertRowid);

    return new Response(
      JSON.stringify({
        success: true,
        guest: newGuest,
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in POST /api/admin/guests:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create guest" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * PUT /api/admin/guests
 * Update guest (expects id in body)
 */
export const PUT: APIRoute = async ({ request }) => {
  try {
    // Check admin authentication
    const cookie = request.headers.get("cookie");
    if (!cookie?.includes("admin_session")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await request.json();
    const { id, guest_name, phone, email, guest_category, max_guests, notes } = data;

    if (!id) {
      return new Response(
        JSON.stringify({ error: "Guest ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if guest exists
    const checkStmt = db.prepare("SELECT * FROM guest_invitations WHERE id = ?");
    const existingGuest = checkStmt.get(id) as any;

    if (!existingGuest) {
      return new Response(
        JSON.stringify({ error: "Guest not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // If name changed, regenerate slug
    let newSlug = existingGuest.guest_slug;
    if (guest_name && guest_name !== existingGuest.guest_name) {
      const baseSlug = generateGuestSlug(guest_name);
      const existingSlugsStmt = db.prepare(
        "SELECT guest_slug FROM guest_invitations WHERE id != ?"
      );
      const existingSlugs = (existingSlugsStmt.all(id) as any[]).map(
        (row) => row.guest_slug
      );
      newSlug = ensureUniqueSlug(baseSlug, existingSlugs);
    }

    // Update guest
    const updateStmt = db.prepare(`
      UPDATE guest_invitations 
      SET 
        guest_name = ?,
        guest_slug = ?,
        phone = ?,
        email = ?,
        guest_category = ?,
        max_guests = ?,
        notes = ?
      WHERE id = ?
    `);

    updateStmt.run(
      guest_name || existingGuest.guest_name,
      newSlug,
      phone !== undefined ? phone : existingGuest.phone,
      email !== undefined ? email : existingGuest.email,
      guest_category || existingGuest.guest_category,
      max_guests !== undefined ? max_guests : existingGuest.max_guests,
      notes !== undefined ? notes : existingGuest.notes,
      id
    );

    // Get updated guest
    const updatedGuest = checkStmt.get(id);

    return new Response(
      JSON.stringify({
        success: true,
        guest: updatedGuest,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in PUT /api/admin/guests:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update guest" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * DELETE /api/admin/guests
 * Delete guest (expects id in body)
 */
export const DELETE: APIRoute = async ({ request }) => {
  try {
    // Check admin authentication
    const cookie = request.headers.get("cookie");
    if (!cookie?.includes("admin_session")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await request.json();
    const { id } = data;

    if (!id) {
      return new Response(
        JSON.stringify({ error: "Guest ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Delete guest
    const deleteStmt = db.prepare("DELETE FROM guest_invitations WHERE id = ?");
    const result = deleteStmt.run(id);

    if (result.changes === 0) {
      return new Response(
        JSON.stringify({ error: "Guest not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Guest deleted successfully",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in DELETE /api/admin/guests:", error);
    return new Response(
      JSON.stringify({ error: "Failed to delete guest" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
