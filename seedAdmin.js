/**
 * seedAdmin.js — One-time script to create or promote the admin user.
 * 
 * Run once: node seedAdmin.js
 * Then disable or delete this file for security.
 */

if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const mongoose = require("mongoose");
const User = require("./models/user.js");

const MONGO_URL = process.env.ATLASDB_URL;
const ADMIN_EMAIL = "ektaa449@gmail.com";
const ADMIN_USERNAME = "ektaa_admin";
const ADMIN_PASSWORD = "admin123";

async function seedAdmin() {
    await mongoose.connect(MONGO_URL);
    console.log("Connected to DB.");

    const existingUser = await User.findOne({ email: ADMIN_EMAIL });

    if (existingUser) {
        if (existingUser.role === "admin") {
            console.log(`✅ User "${existingUser.username}" (${ADMIN_EMAIL}) is already an admin.`);
        } else {
            existingUser.role = "admin";
            await existingUser.save();
            console.log(`✅ Promoted "${existingUser.username}" (${ADMIN_EMAIL}) to admin role.`);
        }
    } else {
        const adminUser = new User({
            email: ADMIN_EMAIL,
            username: ADMIN_USERNAME,
            role: "admin"
        });
        await User.register(adminUser, ADMIN_PASSWORD);
        console.log(`✅ Created new admin user "${ADMIN_USERNAME}" (${ADMIN_EMAIL}) with password "${ADMIN_PASSWORD}".`);
    }

    await mongoose.connection.close();
    console.log("DB connection closed. You may now delete or disable this script.");
}

seedAdmin().catch(err => {
    console.error("❌ Error seeding admin:", err);
    process.exit(1);
});
