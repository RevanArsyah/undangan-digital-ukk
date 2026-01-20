import bcrypt from "bcryptjs";
import db from "./db";
import crypto from "crypto";

export interface AdminUser {
    id: number;
    username: string;
    password_hash: string;
    full_name?: string;
    email?: string;
    role: "super_admin" | "admin" | "viewer";
    is_active: number;
    created_at: string;
    updated_at: string;
    last_login?: string;
}

export interface AuthSession {
    userId: number;
    username: string;
    role: string;
}

export interface PasswordResetToken {
    id: number;
    user_id: number;
    token: string;
    expires_at: string;
    used: number;
    created_at: string;
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

export async function verifyPassword(
    password: string,
    hash: string
): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

// User management
export function findUserByUsername(username: string): AdminUser | undefined {
    return db
        .prepare("SELECT * FROM admin_users WHERE username = ? AND is_active = 1")
        .get(username) as AdminUser | undefined;
}

export function findUserById(userId: number): AdminUser | undefined {
    return db
        .prepare("SELECT * FROM admin_users WHERE id = ? AND is_active = 1")
        .get(userId) as AdminUser | undefined;
}

export function findUserByEmail(email: string): AdminUser | undefined {
    return db
        .prepare("SELECT * FROM admin_users WHERE email = ? AND is_active = 1")
        .get(email) as AdminUser | undefined;
}

export function getAllUsers(): AdminUser[] {
    return db
        .prepare("SELECT * FROM admin_users ORDER BY created_at DESC")
        .all() as AdminUser[];
}

export function updateLastLogin(userId: number): void {
    db.prepare(
        "UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(userId);
}

export async function createUser(
    username: string,
    password: string,
    fullName: string,
    email: string | null,
    role: "super_admin" | "admin" | "viewer"
): Promise<AdminUser> {
    const passwordHash = await hashPassword(password);
    const result = db
        .prepare(
            "INSERT INTO admin_users (username, password_hash, full_name, email, role) VALUES (?, ?, ?, ?, ?)"
        )
        .run(username, passwordHash, fullName, email, role);

    return findUserById(result.lastInsertRowid as number)!;
}

export async function updateUser(
    userId: number,
    data: {
        full_name?: string;
        email?: string;
        role?: "super_admin" | "admin" | "viewer";
        is_active?: number;
    }
): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.full_name !== undefined) {
        fields.push("full_name = ?");
        values.push(data.full_name);
    }
    if (data.email !== undefined) {
        fields.push("email = ?");
        values.push(data.email);
    }
    if (data.role !== undefined) {
        fields.push("role = ?");
        values.push(data.role);
    }
    if (data.is_active !== undefined) {
        fields.push("is_active = ?");
        values.push(data.is_active);
    }

    if (fields.length > 0) {
        fields.push("updated_at = CURRENT_TIMESTAMP");
        values.push(userId);
        db.prepare(
            `UPDATE admin_users SET ${fields.join(", ")} WHERE id = ?`
        ).run(...values);
    }
}

export async function changePassword(
    userId: number,
    newPassword: string
): Promise<void> {
    const passwordHash = await hashPassword(newPassword);
    db.prepare(
        "UPDATE admin_users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(passwordHash, userId);
}

export function deleteUser(userId: number): void {
    // Soft delete
    db.prepare(
        "UPDATE admin_users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(userId);
}

// Password reset tokens
export function generateResetToken(): string {
    return crypto.randomBytes(32).toString("hex");
}

export function createResetToken(userId: number): PasswordResetToken {
    const token = generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    const result = db
        .prepare(
            "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)"
        )
        .run(userId, token, expiresAt);

    return {
        id: result.lastInsertRowid as number,
        user_id: userId,
        token,
        expires_at: expiresAt,
        used: 0,
        created_at: new Date().toISOString(),
    };
}

export function findResetToken(token: string): PasswordResetToken | undefined {
    return db
        .prepare(
            "SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0 AND expires_at > datetime('now')"
        )
        .get(token) as PasswordResetToken | undefined;
}

export function markTokenAsUsed(tokenId: number): void {
    db.prepare("UPDATE password_reset_tokens SET used = 1 WHERE id = ?").run(
        tokenId
    );
}

export function cleanupExpiredTokens(): void {
    db.prepare(
        "DELETE FROM password_reset_tokens WHERE expires_at < datetime('now')"
    ).run();
}

// Check if any admin exists
export function hasAdminUsers(): boolean {
    const result = db
        .prepare("SELECT COUNT(*) as count FROM admin_users")
        .get() as { count: number };
    return result.count > 0;
}

// Role-based permissions
export function hasPermission(
    role: string,
    action: "view" | "edit" | "delete" | "manage_users"
): boolean {
    const permissions = {
        super_admin: ["view", "edit", "delete", "manage_users"],
        admin: ["view", "edit", "delete"],
        viewer: ["view"],
    };

    return permissions[role as keyof typeof permissions]?.includes(action) ?? false;
}
