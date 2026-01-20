import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ cookies }) => {
    try {
        // Delete session cookie
        cookies.delete("wedding_admin_session", { path: "/" });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error: any) {
        console.error("Logout error:", error);
        return new Response(
            JSON.stringify({ error: "An error occurred during logout" }),
            { status: 500 }
        );
    }
};
