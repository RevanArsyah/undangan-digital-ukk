
import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, "../database/wedding.db");

// 1. DELETE EXISTING DATABASE
if (fs.existsSync(dbPath)) {
  console.log("🗑️  Deleting existing database...");
  try {
    fs.unlinkSync(dbPath);
    if (fs.existsSync(dbPath + "-wal")) fs.unlinkSync(dbPath + "-wal");
    if (fs.existsSync(dbPath + "-shm")) fs.unlinkSync(dbPath + "-shm");
  } catch (e) {
    console.error("Failed to delete database. Is it open?", e);
    process.exit(1);
  }
}

// 2. INITIALIZE DATABASE
console.log("✨ Initializing new database...");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

// Complete Schema (including check-in fields and views)
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS rsvps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guest_name TEXT NOT NULL,
    phone TEXT,
    attendance TEXT,
    guest_count INTEGER,
    message TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS wishes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    email TEXT,
    role TEXT DEFAULT 'admin',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_login TEXT
  );

  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TEXT NOT NULL,
    used INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES admin_users(id)
  );

  CREATE TABLE IF NOT EXISTS gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_url TEXT NOT NULL,
    caption TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Guest Invitations Table (Complete with Check-in fields)
  CREATE TABLE IF NOT EXISTS guest_invitations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guest_name TEXT NOT NULL,
    guest_slug TEXT UNIQUE NOT NULL,
    phone TEXT,
    email TEXT,
    guest_category TEXT CHECK(guest_category IN ('keluarga', 'teman', 'kantor', 'lainnya')),
    max_guests INTEGER DEFAULT 5 CHECK(max_guests >= 1),
    
    qr_opened_at TEXT,
    qr_open_count INTEGER DEFAULT 0,
    last_opened_at TEXT,
    has_rsvp INTEGER DEFAULT 0 CHECK(has_rsvp IN (0, 1)),
    rsvp_id INTEGER,
    
    is_sent INTEGER DEFAULT 0 CHECK(is_sent IN (0, 1)),
    sent_at TEXT,
    sent_via TEXT,
    
    -- Check-in fields
    checked_in_at TEXT,
    checked_in_by TEXT,
    check_in_notes TEXT,
    
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (rsvp_id) REFERENCES rsvps(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_guest_slug ON guest_invitations(guest_slug);
  CREATE INDEX IF NOT EXISTS idx_guest_category ON guest_invitations(guest_category);
  CREATE INDEX IF NOT EXISTS idx_checked_in_at ON guest_invitations(checked_in_at);

  -- Views
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
`;

db.exec(SCHEMA);

// 3. SEED ADMIN USER (Correct Role: super_admin)
console.log("👤 Seeding admin user...");
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync("admin123", salt);
db.prepare(`
  INSERT INTO admin_users (username, password_hash, full_name, email, role)
  VALUES ('admin', ?, 'Administrator', 'admin@example.com', 'super_admin')
`).run(hash);


// 4. SEED SETTINGS
console.log("⚙️  Seeding settings...");
const settings = {
  // Groom
  "groom.name": "Agus",
  "groom.fullName": "Agus Pratama, S.T.",
  "groom.parents": "Putra dari Bpk. Bambang & Ibu Siti",
  "groom.instagram": "agus_pratama",
  "groom.image": "https://placehold.co/600x800?text=Agus+Photo",
  // Bride
  "bride.name": "Dina",
  "bride.fullName": "Dina Kusuma, S.Kom.",
  "bride.parents": "Putri dari Bpk. Wahyu & Ibu Ratna",
  "bride.instagram": "dina_kusuma",
  "bride.image": "https://placehold.co/600x800?text=Dina+Photo",
  // Venue
  "venue.name": "Grand Ballroom Hotel Mulia",
  "venue.address": "Jl. Asia Afrika, Senayan, Jakarta Pusat",
  "venue.mapUrl": "https://maps.google.com/?q=Hotel+Mulia+Senayan",
  // Akad
  "akad.title": "Akad Nikah",
  "akad.date": "Sabtu, 25 Oktober 2025",
  "akad.startTime": "08:00",
  "akad.endTime": "10:00",
  // Resepsi
  "resepsi.title": "Resepsi Pernikahan",
  "resepsi.date": "Sabtu, 25 Oktober 2025",
  "resepsi.startTime": "11:00",
  "resepsi.endTime": "14:00",
  // Bank Accounts
  "bank_accounts": JSON.stringify([
    { bank: "BCA", number: "1234567890", name: "Agus Pratama" },
    { bank: "Mandiri", number: "0987654321", name: "Dina Kusuma" },
    { bank: "GoPay", number: "08123456789", name: "Dina Kusuma" }
  ])
};

const insertSetting = db.prepare("INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)");
Object.entries(settings).forEach(([key, val]) => insertSetting.run(key, val));


// 5. SEED GUESTS (Realistic Names)
console.log("👥 Seeding guests...");
const guests = [
  // Keluarga
  { name: "Bpk. H. Supriadi & Ibu", category: "keluarga", max: 2, open: 2, rsvp: 'hadir', pax: 2 },
  { name: "Keluarga Besar Bpk. Widjaja", category: "keluarga", max: 4, open: 5, rsvp: 'hadir', pax: 4 },
  { name: "Ibu Sri Rahayu", category: "keluarga", max: 1, open: 1, rsvp: null },
  { name: "Om Herman & Tante Nani", category: "keluarga", max: 2, open: 0, rsvp: null },
  
  // Teman
  { name: "Budi Santoso", category: "teman", max: 1, open: 3, rsvp: 'hadir', pax: 1 },
  { name: "Siti Aminah", category: "teman", max: 1, open: 1, rsvp: 'maaf', pax: 0, msg: "Maaf tidak bisa hadir, ada dinas luar kota. Selamat ya!" },
  { name: "Rino & Pasangan", category: "teman", max: 2, open: 2, rsvp: 'hadir', pax: 2 },
  { name: "Grup Futsal Alumni", category: "teman", max: 5, open: 10, rsvp: 'hadir', pax: 5 },
  { name: "Dewi Lestari", category: "teman", max: 1, open: 0, rsvp: null },
  
  // Kantor
  { name: "Pak Direktur Utama", category: "kantor", max: 2, open: 1, rsvp: 'hadir', pax: 1, msg: "Selamat menempuh hidup baru." },
  { name: "Divisi IT Support", category: "kantor", max: 5, open: 15, rsvp: 'hadir', pax: 4 },
  { name: "Bu HRD", category: "kantor", max: 2, open: 0, rsvp: null },

  // Lainnya (VIP etc)
  { name: "Bpk. Walikota & Ibu", category: "lainnya", max: 2, open: 1, rsvp: null },
  { name: "Komunitas Sepeda Jkt", category: "lainnya", max: 5, open: 8, rsvp: 'hadir', pax: 5 }
];

const insertGuest = db.prepare(`
  INSERT INTO guest_invitations 
  (guest_name, guest_slug, guest_category, max_guests, qr_open_count, has_rsvp, is_sent) 
  VALUES (?, ?, ?, ?, ?, ?, 1)
`);

const insertRsvp = db.prepare(`
  INSERT INTO rsvps (guest_name, attendance, guest_count, message) VALUES (?, ?, ?, ?)
`);

const insertWish = db.prepare(`
  INSERT INTO wishes (name, message) VALUES (?, ?)
`);

// Simple slugify
function slugify(text: string) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

guests.forEach(g => {
  const slug = slugify(g.name);
  const rsvpStatus = g.rsvp ? 1 : 0;
  
  // Insert Guest
  const info = insertGuest.run(g.name, slug, g.category, g.max, g.open, rsvpStatus);
  const guestId = info.lastInsertRowid;

  // Insert RSVP if exists
  if (g.rsvp) {
    const attendance = g.rsvp === 'hadir' ? 'hadir' : 'tidak_hadir';
    const rsvpInfo = insertRsvp.run(g.name, attendance, g.pax || 0, g.msg || "Turut berbahagia!");
    
    // Update guest with rsvp_id
    db.prepare("UPDATE guest_invitations SET rsvp_id = ? WHERE id = ?").run(rsvpInfo.lastInsertRowid, guestId);

    // Also insert specific Wish for some
    if(g.msg || g.rsvp === 'hadir') {
      const msg = g.msg || `Selamat menempuh hidup baru untuk ${settings["groom.name"]} & ${settings["bride.name"]}. Semoga Samawa!`;
      insertWish.run(g.name, msg);
    }
  }
});

console.log(`✅ Seeded ${guests.length} guests.`);

// 6. Verify
const rowCount = db.prepare("SELECT count(*) as c FROM guest_invitations").get() as { c: number };
console.log(`🎉 Database ready! Total Guests: ${rowCount.c}`);
console.log("   Admin Login: admin / admin123");
