import type { APIRoute } from "astro";
import {
    findUserByEmail,
    createResetToken,
    findResetToken,
    changePassword,
    markTokenAsUsed,
    cleanupExpiredTokens,
} from "../../../lib/auth";
import { checkRateLimit } from "../../../lib/rateLimit";

// Request password reset
export const POST: APIRoute = async ({ request, clientAddress }) => {
    const ip = clientAddress || "unknown";
    if (!checkRateLimit(ip, 3)) {
        return new Response(
            JSON.stringify({ error: "Too many requests. Please try again later." }),
            { status: 429 }
        );
    }

    try {
        const { email } = await request.json();

        if (!email) {
            return new Response(
                JSON.stringify({ error: "Email is required" }),
                { status: 400 }
            );
        }

        // Find user by email
        const user = findUserByEmail(email);
        if (!user) {
            // Don't reveal if email exists or not (security)
            return new Response(
                JSON.stringify({
                    success: true,
                    message: "If the email exists, a reset link will be sent.",
                }),
                { status: 200 }
            );
        }

        // Cleanup old tokens
        cleanupExpiredTokens();

        // Create reset token
        const resetToken = createResetToken(user.id);

        // In a real app, you would send an email here
        // For now, we'll just log it (or you can integrate with a service)
        console.log("=".repeat(60));
        console.log("PASSWORD RESET TOKEN GENERATED");
        console.log("=".repeat(60));
        console.log(`User: ${user.username} (${user.email})`);
        console.log(`Token: ${resetToken.token}`);
        console.log(`Expires: ${resetToken.expires_at}`);
        console.log(`Reset URL: /admin/reset-password?token=${resetToken.token}`);
        console.log("=".repeat(60));

        return new Response(
            JSON.stringify({
                success: true,
                message: "Password reset instructions have been sent.",
                // In development, include the token
                ...(import.meta.env.DEV && { token: resetToken.token }),
            }),
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Password reset request error:", error);
        return new Response(
            JSON.stringify({ error: "An error occurred" }),
            { status: 500 }
        );
    }
};

// Reset password with token
export const PUT: APIRoute = async ({ request }) => {
    try {
        const { token, newPassword } = await request.json();

        if (!token || !newPassword) {
            return new Response(
                JSON.stringify({ error: "Token and new password are required" }),
                { status: 400 }
            );
        }

        if (newPassword.length < 6) {
            return new Response(
                JSON.stringify({ error: "Password must be at least 6 characters" }),
                { status: 400 }
            );
        }

        // Find valid token
        const resetToken = findResetToken(token);
        if (!resetToken) {
            return new Response(
                JSON.stringify({ error: "Invalid or expired reset token" }),
                { status: 400 }
            );
        }

        // Change password
        await changePassword(resetToken.user_id, newPassword);

        // Mark token as used
        markTokenAsUsed(resetToken.id);

        return new Response(
            JSON.stringify({
                success: true,
                message: "Password has been reset successfully",
            }),
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Password reset error:", error);
        return new Response(
            JSON.stringify({ error: "An error occurred" }),
            { status: 500 }
        );
    }
};
