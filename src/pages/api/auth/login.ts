import type { APIRoute } from "astro";
import {
    findUserByUsername,
    verifyPassword,
    updateLastLogin,
} from "../../../lib/auth";
import { checkRateLimit } from "../../../lib/rateLimit";

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
    // Rate limiting - 5 attempts per minute
    const ip = clientAddress || "unknown";
    if (!checkRateLimit(ip, 5)) {
        return new Response(
            JSON.stringify({ error: "Too many login attempts. Please try again later." }),
            { status: 429 }
        );
    }

    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return new Response(
                JSON.stringify({ error: "Username and password are required" }),
                { status: 400 }
            );
        }

        // Find user
        const user = findUserByUsername(username);
        if (!user) {
            return new Response(
                JSON.stringify({ error: "Invalid username or password" }),
                { status: 401 }
            );
        }

        // Verify password
        const isValid = await verifyPassword(password, user.password_hash);
        if (!isValid) {
            return new Response(
                JSON.stringify({ error: "Invalid username or password" }),
                { status: 401 }
            );
        }

        // Update last login
        updateLastLogin(user.id);

        // Create session
        const session = {
            userId: user.id,
            username: user.username,
            role: user.role,
        };

        // Set secure cookie
        cookies.set("wedding_admin_session", JSON.stringify(session), {
            path: "/",
            httpOnly: true,
            secure: import.meta.env.PROD,
            maxAge: 60 * 60 * 24, // 24 hours
            sameSite: "lax", // Changed from "strict" for ngrok compatibility
        });

        return new Response(
            JSON.stringify({
                success: true,
                user: {
                    username: user.username,
                    fullName: user.full_name,
                    role: user.role,
                },
            }),
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Login error:", error);
        return new Response(
            JSON.stringify({ error: "An error occurred during login" }),
            { status: 500 }
        );
    }
};
