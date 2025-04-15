import "dotenv/config";
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

(async () => {
    const existingUser = await db.query.users.findFirst({
        where: eq(users.username, "admin"),
    });

    if (!existingUser) {
        await db.insert(users).values({
            username: "admin",
            password: "admin", // ideally hash this
        });
        console.log("✅ Seeded admin user");
    } else {
        console.log("⚠️ Admin user already exists, skipping seed.");
    }
})();
