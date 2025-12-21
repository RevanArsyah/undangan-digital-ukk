import Database from "better-sqlite3";

// File database akan dibuat otomatis di root project dengan nama 'wedding.db'
const db = new Database("wedding.db");

// Mode WAL untuk performa dan concurrency yang lebih baik
db.pragma("journal_mode = WAL");

// Inisialisasi tabel jika belum ada
db.exec(`
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
`);

export default db;
