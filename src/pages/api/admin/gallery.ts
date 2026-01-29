
import type { APIRoute } from "astro";
import db from "../../../lib/db";
import { findUserById } from "../../../lib/auth";

export const GET: APIRoute = async ({ request }) => {
  try {
    const stmt = db.prepare("SELECT * FROM gallery ORDER BY created_at DESC");
    const images = stmt.all();
    return new Response(JSON.stringify(images), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch gallery" }), { status: 500 });
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
    const { image_url, caption } = body;

    if (!image_url) {
      return new Response(JSON.stringify({ error: "Image URL is required" }), { status: 400 });
    }

    const stmt = db.prepare("INSERT INTO gallery (image_url, caption) VALUES (?, ?)");
    const info = stmt.run(image_url, caption || "");

    return new Response(JSON.stringify({ success: true, id: info.lastInsertRowid }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to add image" }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
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
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(JSON.stringify({ error: "ID is required" }), { status: 400 });
    }

    const stmt = db.prepare("DELETE FROM gallery WHERE id = ?");
    stmt.run(id);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to delete image" }), { status: 500 });
  }
};
