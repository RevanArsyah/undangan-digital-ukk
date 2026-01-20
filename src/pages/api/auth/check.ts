import type { APIRoute } from "astro";
import { findUserById } from "../../../lib/auth";
import type { AuthSession } from "../../../types";

export const GET: APIRoute = async ({ cookies }) => {
    try {
        const sessionCookie = cookies.get("wedding_admin_session")?.value;

        if (!sessionCookie) {
            return new Response(
                JSON.stringify({ authenticated: false }),
                { status: 401 }
            );
        }

        // Parse session
        const session: AuthSession = JSON.parse(sessionCookie);

        // Verify user still exists and is active
        const user = findUserById(session.userId);
        if (!user) {
            // Invalid session - user deleted or deactivated
            cookies.delete("wedding_admin_session", { path: "/" });
            return new Response(
                JSON.stringify({ authenticated: false }),
                { status: 401 }
            );
        }

        return new Response(
            JSON.stringify({
                authenticated: true,
                user: {
                    username: user.username,
                    fullName: user.full_name,
                    role: user.role,
                },
            }),
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Auth check error:", error);
        return new Response(
            JSON.stringify({ authenticated: false }),
            { status: 401 }
        );
    }
};
