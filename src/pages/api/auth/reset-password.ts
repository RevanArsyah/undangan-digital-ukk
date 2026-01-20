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

        // Send email
        const { sendPasswordResetEmail, isEmailConfigured } = await import(
            "../../../utils/email"
        );

        let emailSent = false;
        if (isEmailConfigured()) {
            emailSent = await sendPasswordResetEmail(
                user.email!,
                user.username,
                resetToken.token
            );
        }

        // Log token for development
        if (!emailSent || import.meta.env.DEV) {
            console.log("=".repeat(60));
            console.log("PASSWORD RESET TOKEN GENERATED");
            console.log("=".repeat(60));
            console.log(`User: ${user.username} (${user.email})`);
            console.log(`Token: ${resetToken.token}`);
            console.log(`Expires: ${resetToken.expires_at}`);
            console.log(`Reset URL: /admin/reset-password?token=${resetToken.token}`);
            if (!emailSent) {
                console.log("\n⚠️  Email not sent (email not configured or failed)");
                console.log("Configure email in .env to send actual emails:");
                console.log("  EMAIL_HOST=smtp.gmail.com");
                console.log("  EMAIL_PORT=587");
                console.log("  EMAIL_USER=your-email@gmail.com");
                console.log("  EMAIL_PASSWORD=your-app-password");
            }
            console.log("=".repeat(60));
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: emailSent
                    ? "Password reset instructions have been sent to your email."
                    : "If the email exists, a reset link will be sent.",
                // In development, include the token if email wasn't sent
                ...(import.meta.env.DEV && !emailSent && { token: resetToken.token }),
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
