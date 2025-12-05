import db from "@/db";
import { websitesTable } from "@/db/schema";
import { redis } from "@/lib/redis";
import { requireUser } from "@/lib/server/auth";
import { formatError } from "@/utils/utils";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

type ApiResponse =
    | { ok: true; created?: boolean; data?: any; message?: string }
    | { ok: false; error: string };

export async function POST(req: NextRequest) {
    try {
        // 1. Authenticate & fetch user (will throw a Response on failure)
        const { user } = await requireUser(req);

        const json = await req.json().catch(() => null);

        // Accept boolean false for is_active — only reject if undefined
        if (!json || typeof json.is_active === "undefined" || !json.projectId) {
            return NextResponse.json(
                { ok: false, error: "Invalid request body: is_active flag and projectId required" } as ApiResponse,
                { status: 400 }
            );
        }

        // 2. Fetch project
        const [project] = await db
            .select()
            .from(websitesTable)
            .where(eq(websitesTable.id, json.projectId))
            .limit(1);

        if (!project) {
            return NextResponse.json(
                { ok: false, error: "Project not found" } as ApiResponse,
                { status: 404 }
            );
        }

        // 3. Authorization: must be owner
        if (project.owner_id !== user.id) {
            return NextResponse.json(
                { ok: false, error: "Forbidden: you are not the owner of this project" } as ApiResponse,
                { status: 403 }
            );
        }

        // 4. Update project is_active
        const [updated] = await db
            .update(websitesTable)
            .set({
                is_active: Boolean(json.is_active),
                updated_at: new Date(),
            })
            .where(eq(websitesTable.id, project.id))
            .returning();

        // 5. Sync Redis flag (best-effort)
        try {
            await redis.set(`is_active:${project.id}`, JSON.stringify(Boolean(json.is_active)));
        } catch (rerr) {
            // don't fail the whole request if redis is down — just log
            console.error("redis set failed for is_active flag:", rerr);
        }

        return NextResponse.json(
            { ok: true, data: updated, message: "Project updated" } as ApiResponse,
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error("update-project error:", error);
        return NextResponse.json(
            { ok: false, error: formatError(error) } as ApiResponse,
            { status: 500 }
        );
    }
}
