
import type { APIRoute } from "astro";
import fs from "node:fs";
import path from "node:path";
import { findUserById } from "../../lib/auth";

export const POST: APIRoute = async ({ request, cookies }) => {
  // 1. Auth Check
  const sessionCookie = cookies.get("wedding_admin_session")?.value;
  if (!sessionCookie) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  let user;
  try {
     const session = JSON.parse(sessionCookie);
     user = findUserById(session.userId);
     if (!user) throw new Error("Invalid user");
  } catch(e) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), { status: 400 });
    }

    // 2. Validate File Type
    if (!file.type.startsWith("image/")) {
      return new Response(JSON.stringify({ error: "Only images are allowed" }), { status: 400 });
    }

    // 3. Prepare Upload Directory
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 4. Generate Unique Filename
    const timestamp = Date.now();
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${timestamp}-${cleanName}`;
    const filePath = path.join(uploadDir, filename);

    // 5. Save File
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    // 6. Return Public URL
    const publicUrl = `/uploads/${filename}`;
    return new Response(JSON.stringify({ 
      success: true, 
      url: publicUrl,
      filename: filename
    }), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Upload Error:", error);
    return new Response(JSON.stringify({ error: "Upload failed" }), { status: 500 });
  }
};
