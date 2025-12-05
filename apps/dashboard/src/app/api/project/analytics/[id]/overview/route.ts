import { NextRequest, NextResponse } from "next/server";
import { ClickHouseClient, createClient } from "@clickhouse/client";
import { formatError } from "@/utils/utils";

type ApiResponse =
    | { ok: true; data: any }
    | { ok: false; error: string };

interface Context {
    params: Promise<{ id: string }>;
}

let clickhouseClient: ClickHouseClient | null = null;

function getClickhouseClient() {
    if (clickhouseClient) return clickhouseClient;
    clickhouseClient = createClient({
        url: process.env.CLICKHOUSE_URL!,
        database: process.env.CLICKHOUSE_DATABASE!,
        username: process.env.CLICKHOUSE_USER_NAME!,
        password: process.env.CLICKHOUSE_PASSWORD!,
    });
    return clickhouseClient;
}

export async function GET(req: NextRequest, context: Context) {
    try {
        const db = getClickhouseClient();
        const { id: projectId } = await context.params;

        if (!projectId) {
            return NextResponse.json({ ok: false, error: "projectId is required" }, { status: 400 });
        }

        const days = Number(req.nextUrl.searchParams.get("range") || "7");
        // limit omitted per your preference (no LIMIT)

        // Queries (NOTE: removed all 'FORMAT JSON' from SQL)
        const totalsSql = `
            SELECT
              count() AS total_events,
              uniqExact(user_id) AS unique_users,
              uniqExact(session_id) AS unique_sessions,
              countIf(event = 'pageview') AS pageviews,
              countIf(event = 'click') AS clicks
            FROM events
            WHERE project_id = {projectId:String}
              AND event_time >= now() - INTERVAL {days:UInt32} DAY
        `;

        const timeseriesSql = `
            SELECT
              toDate(event_time) AS day,
              count() AS events
            FROM events
            WHERE project_id = {projectId:String}
              AND event_time >= now() - INTERVAL {days:UInt32} DAY
            GROUP BY day
            ORDER BY day ASC
        `;

        const topPagesSql = `
            SELECT
              path,
              count() AS pageviews,
              uniqExact(session_id) AS sessions
            FROM events
            WHERE project_id = {projectId:String}
              AND event = 'pageview'
              AND event_time >= now() - INTERVAL {days:UInt32} DAY
            GROUP BY path
            ORDER BY pageviews DESC
        `;

        const topReferrersSql = `
            SELECT
              referrer,
              count() AS cnt
            FROM events
            WHERE project_id = {projectId:String}
              AND referrer != ''
              AND event_time >= now() - INTERVAL {days:UInt32} DAY
            GROUP BY referrer
            ORDER BY cnt DESC
        `;

        // Run queries in parallel, instruct client to return JSON
        const [totalsRes, timeseriesRes, topPagesRes, topReferrersRes] = await Promise.all([
            db.query({ query: totalsSql, format: "JSON", query_params: { projectId, days } }),
            db.query({ query: timeseriesSql, format: "JSON", query_params: { projectId, days } }),
            db.query({ query: topPagesSql, format: "JSON", query_params: { projectId, days } }),
            db.query({ query: topReferrersSql, format: "JSON", query_params: { projectId, days } }),
        ]);

        const totalsJson = await totalsRes.json();
        const timeseriesJson = await timeseriesRes.json();
        const topPagesJson = await topPagesRes.json();
        const topReferrersJson = await topReferrersRes.json();

        const totalsRow: any = Array.isArray(totalsJson?.data) && totalsJson.data.length > 0 ? totalsJson.data[0] : {};
        const timeseries: any[] = Array.isArray(timeseriesJson?.data) ? timeseriesJson.data : [];
        const topPages: any[] = Array.isArray(topPagesJson?.data) ? topPagesJson.data : [];
        const topReferrers: any[] = Array.isArray(topReferrersJson?.data) ? topReferrersJson.data : [];

        const payload = {
            totals: {
                total_events: Number(totalsRow?.total_events ?? 0),
                unique_users: Number(totalsRow?.unique_users ?? 0),
                unique_sessions: Number(totalsRow?.unique_sessions ?? 0),
                pageviews: Number(totalsRow?.pageviews ?? 0),
                clicks: Number(totalsRow?.clicks ?? 0),
            },
            timeseries: timeseries.map((r: any) => ({ day: r.day, events: Number(r.events) })),
            topPages: topPages.map((r: any) => ({ path: r.path, pageviews: Number(r.pageviews), sessions: Number(r.sessions) })),
            topReferrers: topReferrers.map((r: any) => ({ referrer: r.referrer, cnt: Number(r.cnt) })),
        };

        return NextResponse.json({ ok: true, data: payload } as ApiResponse);
    } catch (error: unknown) {
        console.error("overview route error:", error);
        return NextResponse.json({ ok: false, error: formatError(error) } as ApiResponse, { status: 500 });
    }
}
