/**
 * Database Migration Script - Add Check-in Fields
 * Adds check-in tracking fields to guest_invitations table
 */

import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, "../database/wedding.db");

console.log("🔄 Adding check-in fields to guest_invitations table...\\n");

// Open database
const db = new Database(dbPath);

// Enable foreign keys
db.pragma("foreign_keys = ON");

try {
  // Check if columns already exist
  const tableInfo = db.prepare("PRAGMA table_info(guest_invitations)").all();
  const columnNames = tableInfo.map((col: any) => col.name);

  const fieldsToAdd = [
    { name: "checked_in_at", type: "TEXT" },
    { name: "checked_in_by", type: "TEXT" },
    { name: "check_in_notes", type: "TEXT" },
  ];

  let addedCount = 0;

  for (const field of fieldsToAdd) {
    if (!columnNames.includes(field.name)) {
      console.log(`Adding column: ${field.name}`);
      db.exec(`ALTER TABLE guest_invitations ADD COLUMN ${field.name} ${field.type}`);
      addedCount++;
    } else {
      console.log(`Column ${field.name} already exists, skipping`);
    }
  }

  // Add index for checked_in_at if it doesn't exist
  const indexes = db
    .prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='guest_invitations'")
    .all();
  const indexNames = indexes.map((idx: any) => idx.name);

  if (!indexNames.includes("idx_checked_in_at")) {
    console.log("Creating index: idx_checked_in_at");
    db.exec("CREATE INDEX IF NOT EXISTS idx_checked_in_at ON guest_invitations(checked_in_at)");
  } else {
    console.log("Index idx_checked_in_at already exists, skipping");
  }

  console.log(`\\n✅ Migration completed! Added ${addedCount} new columns\\n`);

  // Verify the changes
  const updatedTableInfo = db.prepare("PRAGMA table_info(guest_invitations)").all();
  console.log("📊 Current table structure:");
  console.log(updatedTableInfo.map((col: any) => `  - ${col.name} (${col.type})`).join("\\n"));

} catch (error) {
  console.error("❌ Migration failed:", error);
  process.exit(1);
} finally {
  db.close();
}

console.log("\\n🎉 Check-in fields migration completed!");
