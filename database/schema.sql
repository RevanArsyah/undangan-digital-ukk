-- ============================================
-- Digital Wedding Invitation Database Schema
-- Project: undangan-digital-ukk
-- Developer: Revan Arsyah - UKK 2026
-- Database: SQLite
-- ============================================

-- ============================================
-- TABLE: rsvps
-- Stores RSVP responses from guests
-- ============================================
CREATE TABLE IF NOT EXISTS rsvps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guest_name TEXT NOT NULL,
    attendance TEXT NOT NULL CHECK(attendance IN ('hadir', 'ragu', 'tidak')),
    guest_count INTEGER DEFAULT 1,
    message TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rsvps_attendance ON rsvps(attendance);
CREATE INDEX IF NOT EXISTS idx_rsvps_created_at ON rsvps(created_at);

-- ============================================
-- TABLE: wishes
-- Stores wedding wishes from guests
-- ============================================
CREATE TABLE IF NOT EXISTS wishes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wishes_created_at ON wishes(created_at);

-- ============================================
-- TABLE: guest_invitations
-- Master table for guest management with tracking
-- ============================================
CREATE TABLE IF NOT EXISTS guest_invitations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guest_name TEXT NOT NULL UNIQUE,
    guest_slug TEXT NOT NULL UNIQUE,
    guest_category TEXT CHECK(guest_category IN ('keluarga', 'teman', 'kerja', 'sekolah', 'lainnya')),
    max_guests INTEGER DEFAULT 1,
    phone_number TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    qr_code_data TEXT,
    qr_open_count INTEGER DEFAULT 0,
    last_opened_at TEXT,
    has_rsvp BOOLEAN DEFAULT 0,
    rsvp_status TEXT CHECK(rsvp_status IN ('hadir', 'ragu', 'tidak')),
    rsvp_guest_count INTEGER,
    rsvp_submitted_at TEXT,
    checked_in_at TEXT,
    checked_in_by TEXT,
    check_in_notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_guest_slug ON guest_invitations(guest_slug);
CREATE INDEX IF NOT EXISTS idx_guest_category ON guest_invitations(guest_category);
CREATE INDEX IF NOT EXISTS idx_has_rsvp ON guest_invitations(has_rsvp);
CREATE INDEX IF NOT EXISTS idx_rsvp_status ON guest_invitations(rsvp_status);
CREATE INDEX IF NOT EXISTS idx_checked_in_at ON guest_invitations(checked_in_at);

-- ============================================
-- TABLE: users
-- Admin users for system management
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'admin' CHECK(role IN ('super_admin', 'admin')),
    reset_token TEXT,
    reset_token_expires TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);

-- ============================================
-- VIEW: v_guest_summary
-- Summary statistics for dashboard
-- ============================================
CREATE VIEW IF NOT EXISTS v_guest_summary AS
SELECT 
    COUNT(*) as total_invitations,
    SUM(CASE WHEN qr_open_count > 0 THEN 1 ELSE 0 END) as total_opened,
    SUM(CASE WHEN has_rsvp = 1 THEN 1 ELSE 0 END) as total_rsvp,
    SUM(CASE WHEN rsvp_status = 'hadir' THEN 1 ELSE 0 END) as total_hadir,
    SUM(CASE WHEN rsvp_status = 'ragu' THEN 1 ELSE 0 END) as total_ragu,
    SUM(CASE WHEN rsvp_status = 'tidak' THEN 1 ELSE 0 END) as total_tidak,
    SUM(CASE WHEN rsvp_status = 'hadir' THEN COALESCE(rsvp_guest_count, 0) ELSE 0 END) as total_confirmed_guests,
    ROUND(CAST(SUM(CASE WHEN qr_open_count > 0 THEN 1 ELSE 0 END) AS REAL) / COUNT(*) * 100, 2) as open_rate,
    ROUND(CAST(SUM(CASE WHEN has_rsvp = 1 THEN 1 ELSE 0 END) AS REAL) / COUNT(*) * 100, 2) as rsvp_rate
FROM guest_invitations;

-- ============================================
-- VIEW: v_category_stats
-- Statistics grouped by category
-- ============================================
CREATE VIEW IF NOT EXISTS v_category_stats AS
SELECT 
    guest_category as category,
    COUNT(*) as total_invitations,
    SUM(CASE WHEN qr_open_count > 0 THEN 1 ELSE 0 END) as total_opened,
    SUM(CASE WHEN has_rsvp = 1 THEN 1 ELSE 0 END) as total_rsvp,
    SUM(CASE WHEN rsvp_status = 'hadir' THEN 1 ELSE 0 END) as total_hadir,
    SUM(CASE WHEN rsvp_status = 'hadir' THEN COALESCE(rsvp_guest_count, 0) ELSE 0 END) as confirmed_guests
FROM guest_invitations
GROUP BY guest_category;

-- ============================================
-- TRIGGER: Update timestamp on guest_invitations
-- ============================================
CREATE TRIGGER IF NOT EXISTS update_guest_invitations_timestamp 
AFTER UPDATE ON guest_invitations
BEGIN
    UPDATE guest_invitations 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;
