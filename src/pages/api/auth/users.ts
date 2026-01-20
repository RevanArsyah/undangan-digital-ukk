import type { APIRoute } from "astro";
import {
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    hasPermission,
    findUserById,
    changePassword,
} from "../../../lib/auth";
import type { AuthSession } from "../../../types";

// Helper to verify admin session
function verifyAdminSession(cookies: any): AuthSession | null {
    try {
        const sessionCookie = cookies.get("wedding_admin_session")?.value;
        if (!sessionCookie) return null;

        const session: AuthSession = JSON.parse(sessionCookie);
        const user = findUserById(session.userId);
        if (!user) return null;

        return session;
    } catch {
        return null;
    }
}

// GET: List all users
export const GET: APIRoute = async ({ cookies }) => {
    const session = verifyAdminSession(cookies);
    if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
        });
    }

    // Check permission
    if (!hasPermission(session.role, "manage_users")) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403,
        });
    }

    try {
        const users = getAllUsers();
        // Remove password hashes from response
        const safeUsers = users.map((u) => ({
            id: u.id,
            username: u.username,
            full_name: u.full_name,
            email: u.email,
            role: u.role,
            is_active: u.is_active,
            created_at: u.created_at,
            updated_at: u.updated_at,
            last_login: u.last_login,
        }));

        return new Response(JSON.stringify({ users: safeUsers }), { status: 200 });
    } catch (error: any) {
        console.error("Get users error:", error);
        return new Response(JSON.stringify({ error: "Server error" }), {
            status: 500,
        });
    }
};

// POST: Create new user
export const POST: APIRoute = async ({ request, cookies }) => {
    const session = verifyAdminSession(cookies);
    if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
        });
    }

    if (!hasPermission(session.role, "manage_users")) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403,
        });
    }

    try {
        const { username, password, fullName, email, role } = await request.json();

        if (!username || !password || !fullName) {
            return new Response(
                JSON.stringify({ error: "Username, password, and full name are required" }),
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return new Response(
                JSON.stringify({ error: "Password must be at least 6 characters" }),
                { status: 400 }
            );
        }

        const validRoles = ["super_admin", "admin", "viewer"];
        if (!validRoles.includes(role)) {
            return new Response(
                JSON.stringify({ error: "Invalid role" }),
                { status: 400 }
            );
        }

        const user = await createUser(username, password, fullName, email || null, role);

        return new Response(
            JSON.stringify({
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    full_name: user.full_name,
                    email: user.email,
                    role: user.role,
                },
            }),
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Create user error:", error);
        if (error.message?.includes("UNIQUE constraint failed")) {
            return new Response(
                JSON.stringify({ error: "Username already exists" }),
                { status: 400 }
            );
        }
        return new Response(JSON.stringify({ error: "Server error" }), {
            status: 500,
        });
    }
};

// PUT: Update user
export const PUT: APIRoute = async ({ request, cookies }) => {
    const session = verifyAdminSession(cookies);
    if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
        });
    }

    if (!hasPermission(session.role, "manage_users")) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403,
        });
    }

    try {
        const { userId, full_name, email, role, is_active, newPassword } =
            await request.json();

        if (!userId) {
            return new Response(
                JSON.stringify({ error: "User ID is required" }),
                { status: 400 }
            );
        }

        // Update user data
        const updateData: any = {};
        if (full_name !== undefined) updateData.full_name = full_name;
        if (email !== undefined) updateData.email = email;
        if (role !== undefined) updateData.role = role;
        if (is_active !== undefined) updateData.is_active = is_active;

        await updateUser(userId, updateData);

        // Change password if provided
        if (newPassword) {
            if (newPassword.length < 6) {
                return new Response(
                    JSON.stringify({ error: "Password must be at least 6 characters" }),
                    { status: 400 }
                );
            }
            await changePassword(userId, newPassword);
        }

        return new Response(
            JSON.stringify({ success: true, message: "User updated successfully" }),
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Update user error:", error);
        return new Response(JSON.stringify({ error: "Server error" }), {
            status: 500,
        });
    }
};

// DELETE: Delete user (soft delete)
export const DELETE: APIRoute = async ({ request, cookies }) => {
    const session = verifyAdminSession(cookies);
    if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
        });
    }

    if (!hasPermission(session.role, "manage_users")) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403,
        });
    }

    try {
        const { userId } = await request.json();

        if (!userId) {
            return new Response(
                JSON.stringify({ error: "User ID is required" }),
                { status: 400 }
            );
        }

        // Prevent deleting yourself
        if (userId === session.userId) {
            return new Response(
                JSON.stringify({ error: "Cannot delete your own account" }),
                { status: 400 }
            );
        }

        deleteUser(userId);

        return new Response(
            JSON.stringify({ success: true, message: "User deleted successfully" }),
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Delete user error:", error);
        return new Response(JSON.stringify({ error: "Server error" }), {
            status: 500,
        });
    }
};
