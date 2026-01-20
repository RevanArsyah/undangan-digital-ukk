import db from "../src/lib/db.js";
import { hashPassword } from "../src/lib/auth.js";
import readline from "readline";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function setupAdmin() {
    console.log("\n=".repeat(60));
    console.log("WEDDING INVITATION - ADMIN SETUP");
    console.log("=".repeat(60));
    console.log("\nCreate your first admin user:\n");

    const username = await question("Username (default: revan): ");
    const password = await question("Password (min 6 characters): ");
    const fullName = await question("Full Name: ");
    const email = await question("Email (optional): ");

    const finalUsername = username.trim() || "revan";

    if (password.length < 6) {
        console.error("\n❌ Password must be at least 6 characters!");
        rl.close();
        process.exit(1);
    }

    if (!fullName.trim()) {
        console.error("\n❌ Full name is required!");
        rl.close();
        process.exit(1);
    }

    try {
        const passwordHash = await hashPassword(password);

        db.prepare(
            "INSERT INTO admin_users (username, password_hash, full_name, email, role) VALUES (?, ?, ?, ?, ?)"
        ).run(
            finalUsername,
            passwordHash,
            fullName.trim(),
            email.trim() || null,
            "super_admin"
        );

        console.log("\n" + "=".repeat(60));
        console.log("✅ ADMIN USER CREATED SUCCESSFULLY!");
        console.log("=".repeat(60));
        console.log(`Username: ${finalUsername}`);
        console.log(`Full Name: ${fullName.trim()}`);
        console.log(`Role: Super Admin`);
        if (email.trim()) {
            console.log(`Email: ${email.trim()}`);
        }
        console.log("\nYou can now login at: http://localhost:4321/admin");
        console.log("=".repeat(60) + "\n");
    } catch (error) {
        if (error.message?.includes("UNIQUE constraint failed")) {
            console.error(`\n❌ Username "${finalUsername}" already exists!`);
        } else {
            console.error("\n❌ Error creating admin user:", error.message);
        }
        rl.close();
        process.exit(1);
    }

    rl.close();
}

setupAdmin().then(() => process.exit(0));
