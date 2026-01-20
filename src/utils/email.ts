import nodemailer from "nodemailer";

// Email configuration from environment variables
const EMAIL_HOST = import.meta.env.EMAIL_HOST || "smtp.gmail.com";
const EMAIL_PORT = parseInt(import.meta.env.EMAIL_PORT || "587");
const EMAIL_SECURE = import.meta.env.EMAIL_SECURE === "true"; // true for 465, false for other ports
const EMAIL_USER = import.meta.env.EMAIL_USER || "";
const EMAIL_PASSWORD = import.meta.env.EMAIL_PASSWORD || "";
const EMAIL_FROM = import.meta.env.EMAIL_FROM || EMAIL_USER;
const SITE_URL = import.meta.env.SITE_URL || "http://localhost:4321";

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: EMAIL_HOST,
            port: EMAIL_PORT,
            secure: EMAIL_SECURE,
            auth: {
                user: EMAIL_USER,
                pass: EMAIL_PASSWORD,
            },
        });
    }
    return transporter;
}

// Check if email is configured
export function isEmailConfigured(): boolean {
    return !!(EMAIL_USER && EMAIL_PASSWORD);
}

// Send password reset email
export async function sendPasswordResetEmail(
    to: string,
    username: string,
    resetToken: string
): Promise<boolean> {
    if (!isEmailConfigured()) {
        console.warn("Email not configured. Skipping email send.");
        return false;
    }

    const resetUrl = `${SITE_URL}/admin/reset-password?token=${resetToken}`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #1e293b;
      font-size: 24px;
      margin: 0;
    }
    .content {
      margin-bottom: 30px;
    }
    .button {
      display: inline-block;
      background: #3b82f6;
      color: #ffffff;
      text-decoration: none;
      padding: 12px 30px;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .button:hover {
      background: #2563eb;
    }
    .footer {
      text-align: center;
      color: #64748b;
      font-size: 14px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }
    .warning {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .code {
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: monospace;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Reset Your Password</h1>
    </div>
    
    <div class="content">
      <p>Hi <strong>${username}</strong>,</p>
      
      <p>We received a request to reset your password for the Wedding Invitation Admin Panel.</p>
      
      <p>Click the button below to reset your password:</p>
      
      <div style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </div>
      
      <p>Or copy and paste this link into your browser:</p>
      <p><a href="${resetUrl}" style="color: #3b82f6; word-break: break-all;">${resetUrl}</a></p>
      
      <div class="warning">
        <strong>⚠️ Security Notice:</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>This link will expire in <strong>1 hour</strong></li>
          <li>If you didn't request this, please ignore this email</li>
          <li>Your password won't change until you create a new one</li>
        </ul>
      </div>
    </div>
    
    <div class="footer">
      <p>This is an automated email from Wedding Invitation Admin Panel.</p>
      <p>Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `;

    const textContent = `
Reset Your Password

Hi ${username},

We received a request to reset your password for the Wedding Invitation Admin Panel.

Click the link below to reset your password:
${resetUrl}

Security Notice:
- This link will expire in 1 hour
- If you didn't request this, please ignore this email
- Your password won't change until you create a new one

This is an automated email from Wedding Invitation Admin Panel.
Please do not reply to this email.
  `;

    try {
        const info = await getTransporter().sendMail({
            from: `"Wedding Admin" <${EMAIL_FROM}>`,
            to: to,
            subject: "Reset Your Password - Wedding Invitation Admin",
            text: textContent,
            html: htmlContent,
        });

        console.log("Password reset email sent:", info.messageId);
        return true;
    } catch (error) {
        console.error("Failed to send password reset email:", error);
        return false;
    }
}

// Send welcome email for new admin user
export async function sendWelcomeEmail(
    to: string,
    username: string,
    fullName: string,
    role: string
): Promise<boolean> {
    if (!isEmailConfigured()) {
        console.warn("Email not configured. Skipping email send.");
        return false;
    }

    const loginUrl = `${SITE_URL}/admin`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Wedding Admin Panel</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #1e293b;
      font-size: 24px;
      margin: 0;
    }
    .info-box {
      background: #f1f5f9;
      border-radius: 6px;
      padding: 20px;
      margin: 20px 0;
    }
    .info-box p {
      margin: 8px 0;
    }
    .button {
      display: inline-block;
      background: #3b82f6;
      color: #ffffff;
      text-decoration: none;
      padding: 12px 30px;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #64748b;
      font-size: 14px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to the Team!</h1>
    </div>
    
    <div class="content">
      <p>Hi <strong>${fullName}</strong>,</p>
      
      <p>Your admin account has been created for the Wedding Invitation Admin Panel.</p>
      
      <div class="info-box">
        <p><strong>Your Account Details:</strong></p>
        <p>👤 Username: <strong>${username}</strong></p>
        <p>🔑 Role: <strong>${role.replace("_", " ").toUpperCase()}</strong></p>
      </div>
      
      <p>You can now login to the admin panel:</p>
      
      <div style="text-align: center;">
        <a href="${loginUrl}" class="button">Go to Admin Panel</a>
      </div>
      
      <p><strong>What you can do:</strong></p>
      <ul>
        <li>View and manage RSVP responses</li>
        <li>Moderate guest wishes</li>
        <li>Generate QR codes for invitations</li>
        <li>Export data to CSV</li>
        ${role === "super_admin" ? "<li>Manage admin users</li>" : ""}
      </ul>
    </div>
    
    <div class="footer">
      <p>If you have any questions, please contact the system administrator.</p>
    </div>
  </div>
</body>
</html>
  `;

    try {
        const info = await getTransporter().sendMail({
            from: `"Wedding Admin" <${EMAIL_FROM}>`,
            to: to,
            subject: "Welcome to Wedding Admin Panel",
            html: htmlContent,
        });

        console.log("Welcome email sent:", info.messageId);
        return true;
    } catch (error) {
        console.error("Failed to send welcome email:", error);
        return false;
    }
}

// Test email configuration
export async function testEmailConfiguration(): Promise<boolean> {
    if (!isEmailConfigured()) {
        return false;
    }

    try {
        await getTransporter().verify();
        console.log("Email configuration is valid");
        return true;
    } catch (error) {
        console.error("Email configuration error:", error);
        return false;
    }
}
