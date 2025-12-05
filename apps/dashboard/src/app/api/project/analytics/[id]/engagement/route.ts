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

        // parse & clamp days (1..30)
        const raw = Number(req.nextUrl.searchParams.get("range") || "7");
        const days = Number.isFinite(raw) ? Math.max(1, Math.min(30, Math.floor(raw))) : 7;

        // 1) events per session distribution
        const eventsPerSessionSql = `
      SELECT events_in_session, count() AS sessions
      FROM (
        SELECT session_id, count() AS events_in_session
        FROM events
        WHERE project_id = {projectId:String}
          AND event_time >= now() - INTERVAL {days:UInt32} DAY
        GROUP BY session_id
      )
      GROUP BY events_in_session
      ORDER BY events_in_session
    `;

        // 2) average session duration (seconds) - session with duration > 0
        const avgSessionSql = `
      SELECT
        avg((toUnixTimestamp64Milli(max_event_time) - toUnixTimestamp64Milli(min_event_time)) / 1000.0) AS avg_session_seconds,
        count(*) AS sessions_count
      FROM (
        SELECT session_id, min(event_time) AS min_event_time, max(event_time) AS max_event_time
        FROM events
        WHERE project_id = {projectId:String}
          AND event_time >= now() - INTERVAL {days:UInt32} DAY
        GROUP BY session_id
        HAVING max_event_time > min_event_time
      )
    `;

        // 3) bounce rate: sessions where pageview count == 1 divided by sessions with at least 1 pageview
        const bounceRateSql = `
      SELECT
        100.0 * sum(bounced) / nullIf(count_with_pv, 0) AS bounce_rate_percent,
        sum(bounced) AS bounced_sessions,
        count_with_pv
      FROM (
        SELECT
          session_id,
          countIf(event = 'pageview') AS pv_count,
          (pv_count = 1) AS bounced
        FROM events
        WHERE project_id = {projectId:String}
          AND event_time >= now() - INTERVAL {days:UInt32} DAY
        GROUP BY session_id
      )
      -- count_with_pv is number of sessions that had at least one pageview
      GLOBAL ANY
    `;

        // Note: The above `GLOBAL ANY` is harmless but unnecessary — ClickHouse requires nothing special here.
        // However if your ClickHouse version complains, we can instead compute in two steps. We'll do it in one call below using a different form.

        // safer bounce rate SQL (single query, more portable)
        const bounceRateSqlPortable = `
      SELECT
        100.0 * sumIf(is_bounce, has_pv) / nullIf(countIf(has_pv), 0) AS bounce_rate_percent,
        sumIf(is_bounce, has_pv) AS bounced_sessions,
        countIf(has_pv) AS sessions_with_pv
      FROM (
        SELECT
          session_id,
          (countIf(event = 'pageview') >= 1) AS has_pv,
          (countIf(event = 'pageview') = 1) AS is_bounce
        FROM events
        WHERE project_id = {projectId:String}
          AND event_time >= now() - INTERVAL {days:UInt32} DAY
        GROUP BY session_id
      )
    `;

        // 4) simple events-per-session metric (total events / distinct sessions)
        const eventsPerSessionAvgSql = `
      SELECT
        count() AS total_events,
        uniqExact(session_id) AS distinct_sessions,
        total_events / nullIf(distinct_sessions, 0) AS events_per_session
      FROM events
      WHERE project_id = {projectId:String}
        AND event_time >= now() - INTERVAL {days:UInt32} DAY
    `;

        // 5) top entry pages: path of the first pageview in each session (argMin)
        const topEntryPagesSql = `
      SELECT
        entry_path AS path,
        count() AS sessions
      FROM (
        SELECT argMin(path, event_time) AS entry_path
        FROM events
        WHERE project_id = {projectId:String}
          AND event = 'pageview'
          AND event_time >= now() - INTERVAL {days:UInt32} DAY
        GROUP BY session_id
      )
      GROUP BY entry_path
      ORDER BY sessions DESC
    `;

        // Run queries in parallel
        const [
            eventsPerSessionRes,
            avgSessionRes,
            bounceRateRes,
            epsRes,
            topEntryRes,
        ] = await Promise.all([
            db.query({ query: eventsPerSessionSql, format: "JSON", query_params: { projectId, days } }),
            db.query({ query: avgSessionSql, format: "JSON", query_params: { projectId, days } }),
            // use portable bounce rate query
            db.query({ query: bounceRateSqlPortable, format: "JSON", query_params: { projectId, days } }),
            db.query({ query: eventsPerSessionAvgSql, format: "JSON", query_params: { projectId, days } }),
            db.query({ query: topEntryPagesSql, format: "JSON", query_params: { projectId, days } }),
        ]);

        const eventsPerSessionJson = await eventsPerSessionRes.json();
        const avgSessionJson = await avgSessionRes.json();
        const bounceRateJson = await bounceRateRes.json();
        const epsJson = await epsRes.json();
        const topEntryJson = await topEntryRes.json();

        const eventsPerSessionDistribution =
            Array.isArray(eventsPerSessionJson?.data) ? eventsPerSessionJson.data.map((r: any) => ({ events_in_session: Number(r.events_in_session), sessions: Number(r.sessions) })) : [];

        const avgSessionRow: { avg_session_seconds?: number; sessions_count?: number } =
            Array.isArray(avgSessionJson?.data) && avgSessionJson.data.length > 0 ? avgSessionJson.data[0] as { avg_session_seconds?: number; sessions_count?: number } : {};
        const avgSessionSeconds = Number(avgSessionRow?.avg_session_seconds ?? 0);
        const sessionsCount = Number(avgSessionRow?.sessions_count ?? 0);

        type BounceRow = { bounce_rate_percent?: number; bounced_sessions?: number; sessions_with_pv?: number };
        const bounceRow: BounceRow = Array.isArray(bounceRateJson?.data) && bounceRateJson.data.length > 0 ? bounceRateJson.data[0] as BounceRow : {};
        const bounceRatePercent = Number(bounceRow?.bounce_rate_percent ?? 0);
        const bouncedSessions = Number(bounceRow?.bounced_sessions ?? 0);
        const sessionsWithPv = Number(bounceRow?.sessions_with_pv ?? 0);

        const epsRow = Array.isArray(epsJson?.data) && epsJson.data.length > 0 ? epsJson.data[0] as { total_events?: number; distinct_sessions?: number; events_per_session?: number } : undefined;
        const totalEvents = Number(epsRow?.total_events ?? 0);
        const distinctSessions = Number(epsRow?.distinct_sessions ?? 0);
        const eventsPerSession = Number(epsRow?.events_per_session ?? 0);

        const topEntryPages =
            Array.isArray(topEntryJson?.data) ? topEntryJson.data.map((r: any) => ({ path: r.path ?? r.entry_path, sessions: Number(r.sessions) })) : [];

        const payload = {
            eventsPerSessionDistribution,
            avgSessionSeconds,
            sessionsCount,
            bounceRatePercent,
            bouncedSessions,
            sessionsWithPv,
            eventsPerSession,
            totalEvents,
            distinctSessions,
            topEntryPages,
            meta: { projectId, days },
        };

        return NextResponse.json({ ok: true, data: payload } as ApiResponse);
    } catch (err: unknown) {
        console.error("engagement route error:", err);
        return NextResponse.json({ ok: false, error: formatError(err) } as ApiResponse, { status: 500 });
    }
}
