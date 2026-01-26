-- ============================================
-- WEDDING INVITATION DATABASE SCHEMA
-- ============================================
-- Database: SQLite
-- Project: Undangan Digital Pernikahan
-- Created: 2026-01-27
-- ============================================

-- ============================================
-- TABLE: rsvps
-- Description: Manajemen konfirmasi kehadiran tamu
-- ============================================
CREATE TABLE IF NOT EXISTS rsvps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guest_name TEXT NOT NULL,
  phone TEXT,
  attendance TEXT CHECK(attendance IN ('Hadir', 'Tidak Hadir', 'Ragu')),
  guest_count INTEGER CHECK(guest_count >= 0 AND guest_count <= 20),
  message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_rsvps_guest_name ON rsvps(guest_name);
CREATE INDEX IF NOT EXISTS idx_rsvps_attendance ON rsvps(attendance);
CREATE INDEX IF NOT EXISTS idx_rsvps_created_at ON rsvps(created_at DESC);

-- ============================================
-- TABLE: wishes
-- Description: Buku tamu digital (ucapan & doa)
-- ============================================
CREATE TABLE IF NOT EXISTS wishes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_wishes_name ON wishes(name);
CREATE INDEX IF NOT EXISTS idx_wishes_created_at ON wishes(created_at DESC);

-- ============================================
-- TABLE: admin_users
-- Description: Manajemen pengguna admin
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'admin' CHECK(role IN ('admin', 'super_admin', 'operator')),
  is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_login TEXT
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_admin_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_active ON admin_users(is_active);

-- ============================================
-- TABLE: password_reset_tokens
-- Description: Token untuk reset password admin
-- ============================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  used INTEGER DEFAULT 0 CHECK(used IN (0, 1)),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_tokens_expires_at ON password_reset_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_tokens_used ON password_reset_tokens(used);

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Sample RSVP data
INSERT OR IGNORE INTO rsvps (guest_name, phone, attendance, guest_count, message) VALUES
('Budi Santoso', '081234567890', 'Hadir', 3, 'Selamat menempuh hidup baru!'),
('Siti Nurhaliza', '082345678901', 'Tidak Hadir', 0, 'Mohon maaf tidak bisa hadir'),
('Ahmad Dhani', '083456789012', 'Ragu', 2, 'Akan konfirmasi lagi nanti');

-- Sample Wishes data
INSERT OR IGNORE INTO wishes (name, message) VALUES
('Rina Wijaya', 'Barakallahu lakuma wa baraka alaikuma wa jamaa bainakuma fi khair'),
('Doni Pratama', 'Semoga menjadi keluarga yang sakinah, mawaddah, warahmah'),
('Lisa Andriani', 'Selamat menempuh hidup baru, semoga langgeng sampai kakek nenek!');

-- Sample Admin User (password: admin123)
-- Hash generated with: bcrypt.hash('admin123', 10)
INSERT OR IGNORE INTO admin_users (username, password_hash, full_name, email, role) VALUES
('admin', '$2b$10$YourBcryptHashHere', 'Administrator', 'admin@wedding.com', 'super_admin');

-- ============================================
-- VIEWS (Optional - for easier querying)
-- ============================================

-- View: RSVP Statistics
CREATE VIEW IF NOT EXISTS v_rsvp_stats AS
SELECT 
  COUNT(*) as total_responses,
  SUM(CASE WHEN attendance = 'Hadir' THEN 1 ELSE 0 END) as total_hadir,
  SUM(CASE WHEN attendance = 'Hadir' THEN guest_count ELSE 0 END) as total_pax,
  SUM(CASE WHEN attendance = 'Ragu' THEN 1 ELSE 0 END) as total_ragu,
  SUM(CASE WHEN attendance = 'Tidak Hadir' THEN 1 ELSE 0 END) as total_tidak_hadir
FROM rsvps;

-- View: Recent RSVPs
CREATE VIEW IF NOT EXISTS v_recent_rsvps AS
SELECT 
  id,
  guest_name,
  phone,
  attendance,
  guest_count,
  message,
  created_at
FROM rsvps
ORDER BY created_at DESC
LIMIT 50;

-- View: Recent Wishes
CREATE VIEW IF NOT EXISTS v_recent_wishes AS
SELECT 
  id,
  name,
  message,
  created_at
FROM wishes
ORDER BY created_at DESC
LIMIT 50;

-- View: Active Admins
CREATE VIEW IF NOT EXISTS v_active_admins AS
SELECT 
  id,
  username,
  full_name,
  email,
  role,
  last_login,
  created_at
FROM admin_users
WHERE is_active = 1
ORDER BY last_login DESC;

-- ============================================
-- TRIGGERS (Optional - for auto-update)
-- ============================================

-- Trigger: Auto-update updated_at on admin_users
CREATE TRIGGER IF NOT EXISTS trg_admin_updated_at
AFTER UPDATE ON admin_users
FOR EACH ROW
BEGIN
  UPDATE admin_users 
  SET updated_at = CURRENT_TIMESTAMP 
  WHERE id = NEW.id;
END;

-- Trigger: Auto-cleanup expired tokens (on insert)
CREATE TRIGGER IF NOT EXISTS trg_cleanup_expired_tokens
AFTER INSERT ON password_reset_tokens
BEGIN
  DELETE FROM password_reset_tokens
  WHERE datetime(expires_at) < datetime('now')
     OR used = 1;
END;

-- ============================================
-- MAINTENANCE QUERIES
-- ============================================

-- Enable WAL mode for better concurrency
PRAGMA journal_mode = WAL;

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- Optimize database
VACUUM;
ANALYZE;

-- ============================================
-- END OF SCHEMA
-- ============================================
