
import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, "../database/wedding.db");

console.log("🔧 Fixing Admin Role...");

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

try {
  const result = db.prepare(
    "UPDATE admin_users SET role = 'super_admin' WHERE role = 'superadmin'"
  ).run();
  
  if (result.changes > 0) {
    console.log(`✅ Updated ${result.changes} user(s) from 'superadmin' to 'super_admin'.`);
  } else {
    console.log("ℹ️ No users found with role 'superadmin'.");
  }

  // Also enable is_active just in case
  db.prepare("UPDATE admin_users SET is_active = 1 WHERE username = 'admin'").run();

} catch (error) {
  console.error("❌ Error updating role:", error);
}

console.log("Done.");
