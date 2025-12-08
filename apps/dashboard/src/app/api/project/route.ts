import { usersTable, websitesTable } from "@/db/schema";
import { db } from "@/db/index";
import { eq, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { redis } from "@/lib/redis";
import { getClickhouseClient } from "@/lib/clickhouse";

type ApiResponse =
    | { ok: true; data: any; message?: string }
    | { ok: false; error: string };

export async function GET(req: NextRequest) {
    try {
        // 1. Authenticate & fetch user (will throw a Response on failure)
        const { user: authUser, session } = await requireUser(req);

        if (!session || !authUser?.email) {
            return NextResponse.json(
                { ok: false, error: "Unauthorized" } as ApiResponse,
                { status: 401 }
            );
        }

        // 2. Get User ID
        const [user] = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, authUser.email))
            .limit(1);

        if (!user) {
            return NextResponse.json(
                { ok: false, error: "User not found" } as ApiResponse,
                { status: 404 }
            )
        }

        // 3. Fetch Projects
        // FIXED: Removed [ ] destructuring so we get the full array, not just the first item
        const projects = await db
            .select()
            .from(websitesTable)
            .where(eq(websitesTable.owner_id, user.id))
            .orderBy(desc(websitesTable.created_at)) // Sort by newest first
            .limit(10); // Increased limit slightly for better UX

        // Note: It is okay to return an empty array [] if no projects exist.
        // The frontend handles the empty state.

        return NextResponse.json(
            { ok: true, data: projects } as ApiResponse,
            { status: 200 }
        );

    } catch (error: unknown) {
        console.error("Fetch projects error:", error);
        return NextResponse.json(
            { ok: false, error: "Internal Server Error" } as ApiResponse,
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    try {
        // 1. Authenticate & fetch user (will throw a Response on failure)
        const { user } = await requireUser(req);

        const searchParams = req.nextUrl.searchParams;
        const projectId = searchParams.get("id");

        if (!projectId) {
            return NextResponse.json(
                { ok: false, error: "Project ID is required" },
                { status: 400 }
            );
        }

        // 3. Fetch project
        const [project] = await db
            .select()
            .from(websitesTable)
            .where(eq(websitesTable.id, projectId))
            .limit(1);


        if (!project) {
            return NextResponse.json(
                { ok: false, error: "Project not found" },
                { status: 404 }
            );
        }


        // 4. Ensure ownership
        if (project.owner_id !== user.id) {
            return NextResponse.json(
                { ok: false, error: "Forbidden: not your project" },
                { status: 403 }
            );
        }

        // 5. Delete project
        await db.delete(websitesTable).where(eq(websitesTable.id, projectId));

        try {
            await redis.del(`is_active:${projectId}`);
        } catch (error) {
            console.error("Redis delete failed:", error);
        }

        try {
            const clickhouse = getClickhouseClient();

            const escaped = escapeClickhouseString(projectId);

            // Use ALTER TABLE ... DELETE WHERE ... : this is how ClickHouse performs deletes (mutation).
            // If your table is distributed or on cluster you may need to add ON CLUSTER <clusterName>
            const mutation = `ALTER TABLE events DELETE WHERE project_id = '${escaped}';`;
            await clickhouse.exec({ query: mutation })

        } catch (error) {
            console.error("ClickHouse delete failed for project:", projectId, error);
        }

        return NextResponse.json(
            { ok: true, message: "Project deleted successfully" },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error("Fetch projects error:", error);
        return NextResponse.json(
            { ok: false, error: "Internal Server Error" } as ApiResponse,
            { status: 500 }
        );
    }
}

export function escapeClickhouseString(s: string) {
    // ClickHouse string literal escaping: double single-quotes inside single-quoted literal
    // e.g. O'Reilly -> 'O''Reilly'
    return s.replace(/'/g, "''");
}
