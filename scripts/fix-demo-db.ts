
import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, "../database/wedding.db");

console.log("🔧 Fixing database schema...");

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

// 1. Fix missing columns in guest_invitations
console.log("Checking columns...");
const tableInfo = db.prepare("PRAGMA table_info(guest_invitations)").all() as any[];
const columnNames = tableInfo.map((col) => col.name);

const fieldsToAdd = [
  { name: "checked_in_at", type: "TEXT" },
  { name: "checked_in_by", type: "TEXT" },
  { name: "check_in_notes", type: "TEXT" },
];

fieldsToAdd.forEach((field) => {
  if (!columnNames.includes(field.name)) {
    console.log(`  + Adding column: ${field.name}`);
    db.exec(`ALTER TABLE guest_invitations ADD COLUMN ${field.name} ${field.type}`);
  } else {
    console.log(`  - Column ${field.name} exists.`);
  }
});

// 2. Fix missing index
console.log("Checking indexes...");
const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='guest_invitations'").all() as any[];
const indexNames = indexes.map((idx) => idx.name);

if (!indexNames.includes("idx_checked_in_at")) {
  console.log("  + Creating index: idx_checked_in_at");
  db.exec("CREATE INDEX IF NOT EXISTS idx_checked_in_at ON guest_invitations(checked_in_at)");
}

// 3. Fix missing Views
console.log("Checking views...");

// View: Guest Statistics by Category
db.exec(`
  DROP VIEW IF EXISTS v_guest_stats;
  CREATE VIEW v_guest_stats AS
  SELECT 
    guest_category,
    COUNT(*) as total_invitations,
    SUM(CASE WHEN qr_open_count > 0 THEN 1 ELSE 0 END) as opened_count,
    SUM(CASE WHEN has_rsvp = 1 THEN 1 ELSE 0 END) as rsvp_count,
    SUM(CASE WHEN is_sent = 1 THEN 1 ELSE 0 END) as sent_count,
    ROUND(AVG(qr_open_count), 2) as avg_open_count
  FROM guest_invitations
  GROUP BY guest_category;
`);
console.log("  + Recreated view: v_guest_stats");

// View: Guest Summary (Overall Stats)
db.exec(`
  DROP VIEW IF EXISTS v_guest_summary;
  CREATE VIEW v_guest_summary AS
  SELECT 
    COUNT(*) as total_invitations,
    SUM(CASE WHEN qr_open_count > 0 THEN 1 ELSE 0 END) as total_opened,
    SUM(CASE WHEN has_rsvp = 1 THEN 1 ELSE 0 END) as total_rsvp,
    SUM(CASE WHEN is_sent = 1 THEN 1 ELSE 0 END) as total_sent,
    SUM(CASE WHEN qr_open_count = 0 THEN 1 ELSE 0 END) as total_not_opened,
    ROUND(CAST(SUM(CASE WHEN qr_open_count > 0 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100, 2) as opened_percentage,
    ROUND(CAST(SUM(CASE WHEN has_rsvp = 1 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100, 2) as rsvp_percentage
  FROM guest_invitations;
`);
console.log("  + Recreated view: v_guest_summary");

console.log("✅ Database fix completed!");
