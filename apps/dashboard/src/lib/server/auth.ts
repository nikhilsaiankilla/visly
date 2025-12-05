// lib/server/auth.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm"; // or your query builder helper
import { authOptions } from "../auth";
import db from "@/db";
import { usersTable } from "@/db/schema";

type RequireUserResult = {
    session: Awaited<ReturnType<typeof getServerSession>>;
    user: any; // replace `any` with your User type
};

/**
 * Require an authenticated user and return the DB user record.
 * If not authenticated or user is missing, this function throws a NextResponse
 * which immediately ends the request in App Router / edge handlers.
 */
export async function requireUser(req?: NextRequest): Promise<RequireUserResult> {
    // getServerSession doesn't need `req` in many setups, but you can pass it if required.
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        // Throwing a Response short-circuits the handler.
        throw NextResponse.json(
            { ok: false, error: "Unauthorized" },
            { status: 401 }
        );
    }

    const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, session.user.email))
        .limit(1);

    if (!user) {
        throw NextResponse.json(
            { ok: false, error: "Unauthenticated User" },
            { status: 404 }
        );
    }

    return { session, user };
}
