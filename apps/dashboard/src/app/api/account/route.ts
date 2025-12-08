import db from "@/db";
import { usersTable } from "@/db/schema";
import { getClickhouseClient } from "@/lib/clickhouse";
import { redis } from "@/lib/redis";
import { requireUser } from "@/lib/server/auth";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { escapeClickhouseString } from "../project/route";

export async function DELETE(req: NextRequest) {
    try {
        // 1. Authenticate (throws Response on failure)
        const { user } = await requireUser(req);
        const userId = user.id;

        // 2. Fetch account
        const [account] = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.id, userId))
            .limit(1);

        if (!account) {
            return NextResponse.json(
                { ok: false, error: "Account not found" },
                { status: 404 }
            );
        }

        // 3. Delete account from DB
        await db.delete(usersTable).where(eq(usersTable.id, userId));

        // -------------------------
        // 4. Cleanup Redis
        // -------------------------
        try {
            await redis.del(`user:${userId}`);
            await redis.del(`session:${userId}`);
        } catch (err) {
            console.error("Redis delete failed for user:", userId, err);
        }

        // -------------------------
        // 5. Cleanup ClickHouse (if you track events per user)
        // -------------------------
        try {
            const clickhouse = getClickhouseClient();
            const escaped = escapeClickhouseString(userId);

            const mutation = `
                ALTER TABLE user_events 
                DELETE WHERE user_id = '${escaped}';
            `;
            await clickhouse.exec({ query: mutation });
        } catch (err) {
            console.error("ClickHouse delete failed for user:", userId, err);
        }

        return NextResponse.json(
            { ok: true, message: "Account deleted successfully" },
            { status: 200 }
        );

    } catch (error) {
        console.error("Delete account error:", error);
        return NextResponse.json(
            { ok: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
