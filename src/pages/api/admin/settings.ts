
import type { APIRoute } from "astro";
import db from "../../../lib/db";
import { findUserById } from "../../../lib/auth";

export const GET: APIRoute = async ({ request }) => {
  try {
    // Return key-value pairs
    const stmt = db.prepare("SELECT key, value FROM site_settings");
    const rows = stmt.all() as { key: string; value: string }[];
    
    const settings = rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {} as Record<string, string>);

    return new Response(JSON.stringify(settings), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch settings" }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const sessionCookie = cookies.get("wedding_admin_session")?.value;
  if (!sessionCookie) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  
  try {
      const session = JSON.parse(sessionCookie);
      const user = findUserById(session.userId);
      if(!user) throw new Error("Invalid user");
  } catch(e) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const body = await request.json();
    // Expect body to be { key: value, key2: value2 }
    
    const insertStmt = db.prepare(`
      INSERT INTO site_settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `);

    const updates = db.transaction((settings: Record<string, string>) => {
      for (const [key, value] of Object.entries(settings)) {
        insertStmt.run(key, String(value));
      }
    });

    updates(body);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Settings Update Error:", error);
    return new Response(JSON.stringify({ error: "Failed to update settings" }), { status: 500 });
  }
};
