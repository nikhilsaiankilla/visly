// app/api/projects/[id]/stats/behavior/route.ts
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

        const raw = Number(req.nextUrl.searchParams.get("range") || "7");
        const days = Number.isFinite(raw) ? Math.max(1, Math.min(30, Math.floor(raw))) : 7;
        const pathParam = req.nextUrl.searchParams.get("path") || "";

        // Funnels: pageview -> click -> signup
        const funnelsSql = `
      SELECT
        countIf(t_pageview IS NOT NULL) AS step_pageview_sessions,
        countIf(t_pageview IS NOT NULL AND t_click IS NOT NULL AND t_click > t_pageview) AS step_click_sessions,
        countIf(t_pageview IS NOT NULL AND t_click IS NOT NULL AND t_signup IS NOT NULL AND t_click > t_pageview AND t_signup > t_click) AS step_signup_sessions
      FROM (
        SELECT
          session_id,
          minIf(event_time, event = 'pageview') AS t_pageview,
          minIf(event_time, event = 'click') AS t_click,
          minIf(event_time, event = 'signup') AS t_signup
        FROM events
        WHERE project_id = {projectId:String}
          AND event_time >= now() - INTERVAL {days:UInt32} DAY
        GROUP BY session_id
      )
    `;

        // Next-page transitions using arrayJoin with neighbor function
        const nextPagesSql = `
      SELECT 
        prev, 
        next, 
        count() AS cnt
      FROM (
        SELECT
          arrayJoin(
            arrayMap(
              (i) -> (paths[i], paths[i + 1]),
              range(1, length(paths))
            )
          ) AS pair,
          pair.1 AS prev,
          pair.2 AS next
        FROM (
          SELECT
            session_id,
            groupArray(path) AS paths
          FROM events
          WHERE project_id = {projectId:String}
            AND event_time >= now() - INTERVAL {days:UInt32} DAY
            AND path IS NOT NULL
            AND path != ''
          GROUP BY session_id
          HAVING length(paths) >= 2
        )
      )
      WHERE next IS NOT NULL AND next != ''
      GROUP BY prev, next
      ORDER BY cnt DESC
      LIMIT 100
    `;

        const nextPagesFromPathSql = `
      SELECT 
        next, 
        count() AS cnt
      FROM (
        SELECT
          arrayJoin(
            arrayMap(
              (i) -> (paths[i], paths[i + 1]),
              range(1, length(paths))
            )
          ) AS pair,
          pair.1 AS prev,
          pair.2 AS next
        FROM (
          SELECT
            session_id,
            groupArray(path) AS paths
          FROM events
          WHERE project_id = {projectId:String}
            AND event_time >= now() - INTERVAL {days:UInt32} DAY
            AND path IS NOT NULL
            AND path != ''
          GROUP BY session_id
          HAVING length(paths) >= 2
        )
      )
      WHERE prev = {path:String} AND next IS NOT NULL AND next != ''
      GROUP BY next
      ORDER BY cnt DESC
      LIMIT 100
    `;

        // Click targets - simplified query without element_id check
        const clickTargetsSql = `
      SELECT event, count() AS cnt
      FROM events
      WHERE project_id = {projectId:String}
        AND event = 'click'
        AND event_time >= now() - INTERVAL {days:UInt32} DAY
      GROUP BY event
      ORDER BY cnt DESC
      LIMIT 100
    `;

        const [funnelsRes, nextPagesRes] = await Promise.all([
            db.query({ query: funnelsSql, format: "JSON", query_params: { projectId, days } }),
            db.query({ query: nextPagesSql, format: "JSON", query_params: { projectId, days } }),
        ]);

        const funnelsJson = await funnelsRes.json();
        const nextPagesJson = await nextPagesRes.json();

        const funnelsRow: any = Array.isArray(funnelsJson?.data) && funnelsJson.data.length > 0 ? funnelsJson.data[0] : {};
        const funnels = {
            step_pageview_sessions: Number(funnelsRow?.step_pageview_sessions ?? 0),
            step_click_sessions: Number(funnelsRow?.step_click_sessions ?? 0),
            step_signup_sessions: Number(funnelsRow?.step_signup_sessions ?? 0),
        };

        const topNextPages = Array.isArray(nextPagesJson?.data)
            ? nextPagesJson.data.map((r: any) => ({ prev: r.prev, next: r.next, cnt: Number(r.cnt) }))
            : [];

        let topNextFromPath: any[] = [];
        if (pathParam) {
            const nextFromPathRes = await db.query({
                query: nextPagesFromPathSql,
                format: "JSON",
                query_params: { projectId, days, path: pathParam },
            });
            const nextFromPathJson = await nextFromPathRes.json();
            topNextFromPath = Array.isArray(nextFromPathJson?.data) ? nextFromPathJson.data.map((r: any) => ({ next: r.next, cnt: Number(r.cnt) })) : [];
        }

        // Simplified click targets - just count click events
        const clickTargetsRes = await db.query({ query: clickTargetsSql, format: "JSON", query_params: { projectId, days } });
        const clickTargetsJson = await clickTargetsRes.json();
        const clickTargets = Array.isArray(clickTargetsJson?.data)
            ? clickTargetsJson.data.map((r: any) => ({ event: r.event, cnt: Number(r.cnt) }))
            : [];

        const payload = {
            funnels,
            topNextPages,
            topNextFromPath,
            clickTargets,
            meta: { projectId, days },
        };

        return NextResponse.json({ ok: true, data: payload } as ApiResponse);
    } catch (err: unknown) {
        console.error("behavior route error:", err);
        return NextResponse.json({ ok: false, error: formatError(err) } as ApiResponse, { status: 500 });
    }
}