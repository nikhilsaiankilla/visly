import { usersTable, websitesTable } from "@/db/schema";
import { db } from "@/db/index";
import { formatError } from "@/utils/utils";
import { NextRequest, NextResponse } from "next/server";
import { eq, or, and } from "drizzle-orm"; // Import Drizzle operators
import { redis } from "@/lib/redis";
import { requireUser } from "@/lib/server/auth";

type ApiResponse =
    | { ok: true; created: boolean; data: any; message?: string }
    | { ok: false; error: string };

export async function POST(req: NextRequest) {
    try {
        // 1. Authenticate & fetch user (will throw a Response on failure)
        const { user: authUser, session } = await requireUser(req);

        const json = await req.json().catch(() => null);

        // 2. Validate Input
        if (!json || !json.name || !json.domain) {
            return NextResponse.json(
                { ok: false, error: "Invalid request body: Name and Domain are required" } as ApiResponse,
                { status: 400 }
            );
        }

        // 3. Check for duplicates (Same Owner AND (Same Name OR Same Domain))
        const existingProject = await db
            .select()
            .from(websitesTable)
            .where(
                and(
                    eq(websitesTable.owner_id, authUser?.id), // Must belong to this user
                    or(
                        eq(websitesTable.name, json.name),
                        eq(websitesTable.domain, json.domain)
                    )
                )
            )
            .limit(1);

        if (existingProject.length > 0) {
            // Optional: You can check which one caused the conflict to give a better error
            const conflict = existingProject[0];
            const msg = conflict.name === json.name
                ? "You already have a project with this name."
                : "You already have a project with this domain.";

            return NextResponse.json(
                { ok: false, error: msg } as ApiResponse,
                { status: 409 } // 409 Conflict
            );
        }

        // 4. Create the Project
        const [newProject] = await db.insert(websitesTable).values({
            name: json.name,
            domain: json.domain,
            owner_id: authUser?.id,
            created_at: new Date(),
            updated_at: new Date(),
        }).returning();

        await redis.set(`is_active:${newProject.id}`, true);

        return NextResponse.json(
            { ok: true, created: true, data: newProject } as ApiResponse,
            { status: 201 }
        );

    } catch (error: unknown) {
        console.error("create-project error:", error);
        return NextResponse.json(
            { ok: false, error: formatError(error) } as ApiResponse,
            { status: 500 }
        );
    }
}