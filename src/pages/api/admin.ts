import type { APIRoute } from "astro";
import db from "../../lib/db";
import { findUserById } from "../../lib/auth";
import type { AuthSession } from "../../types";

export const POST: APIRoute = async ({ request, cookies }) => {
  // Verify session
  const sessionCookie = cookies.get("wedding_admin_session")?.value;
  if (!sessionCookie) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    const session: AuthSession = JSON.parse(sessionCookie);
    const user = findUserById(session.userId);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    const body = await request.json();
    const { action, id, ids, data } = body;

    const targetIds = ids || (id ? [id] : []);
    if (targetIds.length === 0 && !data) {
      return new Response(JSON.stringify({ error: "No valid ID provided" }), {
        status: 400,
      });
    }

    const placeholders = targetIds.map(() => "?").join(",");

    // --- RSVP ACTIONS ---
    if (action === "update_rsvp") {
      const { guest_name, attendance, guest_count, message } = data;
      db.prepare(
        "UPDATE rsvps SET guest_name=?, attendance=?, guest_count=?, message=? WHERE id=?"
      ).run(guest_name, attendance, guest_count, message, id);
      return new Response(JSON.stringify({ success: true }));
    }

    if (action === "delete_rsvp") {
      db.prepare(`DELETE FROM rsvps WHERE id IN (${placeholders})`).run(
        ...targetIds
      );
      return new Response(JSON.stringify({ success: true }));
    }

    // --- WISHES ACTIONS ---
    if (action === "update_wish") {
      const { name, message } = data;
      db.prepare("UPDATE wishes SET name=?, message=? WHERE id=?").run(
        name,
        message,
        id
      );
      return new Response(JSON.stringify({ success: true }));
    }

    if (action === "delete_wish") {
      db.prepare(`DELETE FROM wishes WHERE id IN (${placeholders})`).run(
        ...targetIds
      );
      return new Response(JSON.stringify({ success: true }));
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
    });
  } catch (error: any) {
    console.error("Admin API Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Server Error" }),
      { status: 500 }
    );
  }
};
