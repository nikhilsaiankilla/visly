// app/api/projects/[id]/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ClickHouseClient, createClient } from "@clickhouse/client";
import { formatError } from "@/utils/utils";

// 1. Define Response Type
type ApiResponse =
    | { ok: true; data: any }
    | { ok: false; error: string };

// 2. Define Context Type (Next.js 15+ treats params as a Promise)
interface Context {
    params: Promise<{ id: string }>;
}

let clickhouseClient: ClickHouseClient | null = null;

export const getClickhouseClient = (): ClickHouseClient => {
    if (clickhouseClient) return clickhouseClient;

    const url = process.env.CLICKHOUSE_URL;
    const database = process.env.CLICKHOUSE_DATABASE;
    const username = process.env.CLICKHOUSE_USER_NAME;
    const password = process.env.CLICKHOUSE_PASSWORD;

    if (!url || !database || !username || !password)
        throw new Error("Missing ClickHouse configuration.");

    clickhouseClient = createClient({ url, database, username, password });
    console.log("ClickHouse client created for database:", database);

    return clickhouseClient;
};
export async function GET(req: NextRequest, context: Context) {
    try {
        const clickhouse = getClickhouseClient();
        // ---------------------------------------------------------
        // 1. Get Params (Correct, Future-proof way)
        // ---------------------------------------------------------
        const { id: projectId } = await context.params;

        if (!projectId) {
            return NextResponse.json(
                { ok: false, error: "Project ID is required" },
                { status: 400 }
            );
        }

        // ---------------------------------------------------------
        // 2. Parse Query Params (e.g., ?range=7)
        // ---------------------------------------------------------
        const searchParams = req.nextUrl.searchParams;
        const rangeParam = searchParams.get("range") || "7";
        const days = parseInt(rangeParam, 10) || 7;

        // ---------------------------------------------------------
        // 3. Execute ClickHouse Query
        // ---------------------------------------------------------
        const sql = `
      SELECT
        toDate(event_time) as day,
        count() as visits
      FROM events
      WHERE project_id = {projectId:String}
        AND event_time >= now() - INTERVAL {days:UInt32} DAY
      GROUP BY day
      ORDER BY day ASC
      FORMAT JSON
    `;

        if (!clickhouse) {
            throw new Error('Clickhouse client is missing please inform admin!!')
        }

        const resultSet = await clickhouse.query({
            query: sql,
            format: 'JSON',
            query_params: {
                projectId: projectId,
                days: days
            }
        });

        const result = await resultSet.json();

        // ---------------------------------------------------------
        // 4. Return Data
        // ---------------------------------------------------------
        return NextResponse.json({
            ok: true,
            data: {
                projectId,
                days,
                stats: result.data // ClickHouse returns { data: [...], meta: [...] }
            }
        });

    } catch (error: unknown) {
        console.error("API Error:", error);
        return NextResponse.json(
            { ok: false, error: formatError(error) },
            { status: 500 }
        );
    }
}