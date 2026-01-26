/**
 * Database Migration Script
 * Applies the new guest_invitations schema to existing database
 */

import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, "../database/wedding.db");
const schemaPath = join(__dirname, "../database/schema.sql");

console.log("🔄 Starting database migration...\n");

// Open database
const db = new Database(dbPath);

// Enable foreign keys
db.pragma("foreign_keys = ON");

// Read schema file
const schema = fs.readFileSync(schemaPath, "utf-8");

// Extract only the guest_invitations related SQL
const guestInvitationsSQL = `
-- ============================================
-- TABLE: guest_invitations
-- Description: Manajemen daftar undangan tamu dengan tracking
-- ============================================
CREATE TABLE IF NOT EXISTS guest_invitations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Guest Info
  guest_name TEXT NOT NULL,
  guest_slug TEXT UNIQUE NOT NULL,
  phone TEXT,
  email TEXT,
  guest_category TEXT CHECK(guest_category IN ('keluarga', 'teman', 'kantor', 'lainnya')),
  max_guests INTEGER DEFAULT 2 CHECK(max_guests >= 1 AND max_guests <= 20),
  
  -- Tracking
  qr_opened_at TEXT,
  qr_open_count INTEGER DEFAULT 0,
  last_opened_at TEXT,
  has_rsvp INTEGER DEFAULT 0 CHECK(has_rsvp IN (0, 1)),
  rsvp_id INTEGER,
  
  -- Sending Status
  is_sent INTEGER DEFAULT 0 CHECK(is_sent IN (0, 1)),
  sent_at TEXT,
  sent_via TEXT,
  
  -- Metadata
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (rsvp_id) REFERENCES rsvps(id) ON DELETE SET NULL
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_guest_slug ON guest_invitations(guest_slug);
CREATE INDEX IF NOT EXISTS idx_guest_category ON guest_invitations(guest_category);
CREATE INDEX IF NOT EXISTS idx_guest_has_rsvp ON guest_invitations(has_rsvp);
CREATE INDEX IF NOT EXISTS idx_guest_is_sent ON guest_invitations(is_sent);
CREATE INDEX IF NOT EXISTS idx_guest_created_at ON guest_invitations(created_at DESC);

-- Sample Guest Invitations
INSERT OR IGNORE INTO guest_invitations (guest_name, guest_slug, phone, email, guest_category, max_guests) VALUES
('Keluarga Bapak Budi Santoso', 'keluarga-bapak-budi-santoso', '081234567890', 'budi@email.com', 'keluarga', 5),
('Siti Nurhaliza', 'siti-nurhaliza', '082345678901', 'siti@email.com', 'teman', 2),
('Ahmad Dhani & Partner', 'ahmad-dhani-dan-partner', '083456789012', 'ahmad@email.com', 'kantor', 2),
('Keluarga Dr. Rina Wijaya', 'keluarga-dr-rina-wijaya', '084567890123', 'rina@email.com', 'keluarga', 4),
('Teman SMA Bandung', 'teman-sma-bandung', '085678901234', NULL, 'teman', 3);

-- View: Guest Statistics by Category
CREATE VIEW IF NOT EXISTS v_guest_stats AS
SELECT 
  guest_category,
  COUNT(*) as total_invitations,
  SUM(CASE WHEN qr_open_count > 0 THEN 1 ELSE 0 END) as opened_count,
  SUM(CASE WHEN has_rsvp = 1 THEN 1 ELSE 0 END) as rsvp_count,
  SUM(CASE WHEN is_sent = 1 THEN 1 ELSE 0 END) as sent_count,
  ROUND(AVG(qr_open_count), 2) as avg_open_count
FROM guest_invitations
GROUP BY guest_category;

-- View: Guest Summary (Overall Stats)
CREATE VIEW IF NOT EXISTS v_guest_summary AS
SELECT 
  COUNT(*) as total_invitations,
  SUM(CASE WHEN qr_open_count > 0 THEN 1 ELSE 0 END) as total_opened,
  SUM(CASE WHEN has_rsvp = 1 THEN 1 ELSE 0 END) as total_rsvp,
  SUM(CASE WHEN is_sent = 1 THEN 1 ELSE 0 END) as total_sent,
  SUM(CASE WHEN qr_open_count = 0 THEN 1 ELSE 0 END) as total_not_opened,
  ROUND(CAST(SUM(CASE WHEN qr_open_count > 0 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100, 2) as opened_percentage,
  ROUND(CAST(SUM(CASE WHEN has_rsvp = 1 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100, 2) as rsvp_percentage
FROM guest_invitations;

-- Trigger: Auto-update updated_at on guest_invitations
CREATE TRIGGER IF NOT EXISTS trg_guest_updated_at
AFTER UPDATE ON guest_invitations
FOR EACH ROW
BEGIN
  UPDATE guest_invitations 
  SET updated_at = CURRENT_TIMESTAMP 
  WHERE id = NEW.id;
END;
`;

try {
  // Execute migration
  db.exec(guestInvitationsSQL);
  
  console.log("✅ Migration completed successfully!\n");
  
  // Verify tables
  const tables = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='guest_invitations'"
    )
    .all();
  
  if (tables.length > 0) {
    console.log("✅ Table 'guest_invitations' created");
    
    // Count sample data
    const count = db
      .prepare("SELECT COUNT(*) as count FROM guest_invitations")
      .get() as { count: number };
    
    console.log(`✅ Sample data inserted: ${count.count} guests\n`);
  }
  
  // Verify views
  const views = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='view' AND name IN ('v_guest_stats', 'v_guest_summary')"
    )
    .all();
  
  console.log(`✅ Views created: ${views.length}/2\n`);
  
  // Test query
  console.log("📊 Testing guest stats view:");
  const stats = db.prepare("SELECT * FROM v_guest_summary").get();
  console.log(stats);
  
} catch (error) {
  console.error("❌ Migration failed:", error);
  process.exit(1);
} finally {
  db.close();
}

console.log("\n🎉 Database migration completed!");
