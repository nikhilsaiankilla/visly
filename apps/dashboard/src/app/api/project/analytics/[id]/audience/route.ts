// app/api/projects/[id]/stats/audience/route.ts
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

        // range days clamp 1..30 (for timeseries / retention window)
        const raw = Number(req.nextUrl.searchParams.get("range") || "7");
        const days = Number.isFinite(raw) ? Math.max(1, Math.min(30, Math.floor(raw))) : 7;

        // 1) DAU / WAU / MAU totals (last 1 / 7 / 30 days respectively)
        const dauWauMauSql = `
      SELECT
        uniqExactIf(user_id, event_time >= now() - INTERVAL 1 DAY) AS dau,
        uniqExactIf(user_id, event_time >= now() - INTERVAL 7 DAY) AS wau,
        uniqExactIf(user_id, event_time >= now() - INTERVAL 30 DAY) AS mau
      FROM events
      WHERE project_id = {projectId:String}
        AND event_time >= now() - INTERVAL 30 DAY
    `;

        // 2) DAU timeseries for the requested range (one row per day)
        const dauTimeseriesSql = `
      SELECT toDate(event_time) AS day, uniqExact(user_id) AS dau
      FROM events
      WHERE project_id = {projectId:String}
        AND event_time >= now() - INTERVAL {days:UInt32} DAY
      GROUP BY day
      ORDER BY day ASC
    `;

        // 3) top users by event count in range
        const topUsersSql = `
      SELECT user_id, count() AS events
      FROM events
      WHERE project_id = {projectId:String}
        AND user_id != '' AND user_id IS NOT NULL
        AND event_time >= now() - INTERVAL {days:UInt32} DAY
      GROUP BY user_id
      ORDER BY events DESC
      LIMIT 100
    `;

        // 4) Retention / cohorts:
        //  - First compute per-user first_seen overall (min(event_time))
        //  - Then consider users whose first_seen is within the `days` window (recent cohorts)
        //  - Join events to compute day offsets (0..days-1) from first_seen and count distinct users per cohort/day.
        //
        // Result: rows of (cohort_date, day_offset, users)
        const retentionSql = `
      SELECT
        toDate(u.first_seen) AS cohort_date,
        day_offset,
        countDistinct(ev.user_id) AS users
      FROM
      (
        -- first seen per user (global)
        SELECT user_id, min(event_time) AS first_seen
        FROM events
        WHERE project_id = {projectId:String}
          AND user_id != '' AND user_id IS NOT NULL
        GROUP BY user_id
      ) AS u
      JOIN
      (
        -- events in window for retention counting (we only need events up to days after first_seen)
        SELECT user_id, event_time
        FROM events
        WHERE project_id = {projectId:String}
          AND event_time >= now() - INTERVAL {days:UInt32} DAY
      ) AS ev
      ON ev.user_id = u.user_id
      WHERE
        toDate(u.first_seen) >= toDate(now() - INTERVAL {days:UInt32} DAY)
        AND dateDiff('day', toDate(u.first_seen), toDate(ev.event_time)) BETWEEN 0 AND {maxOffset:UInt32}
      GROUP BY cohort_date, day_offset
      ORDER BY cohort_date ASC, day_offset ASC
    `;

        // The above uses `day_offset` but we need to compute it; modify to compute day_offset in the SELECT.
        const retentionSqlFixed = `
      SELECT
        toDate(u.first_seen) AS cohort_date,
        dateDiff('day', toDate(u.first_seen), toDate(ev.event_time)) AS day_offset,
        countDistinct(ev.user_id) AS users
      FROM
      (
        SELECT user_id, min(event_time) AS first_seen
        FROM events
        WHERE project_id = {projectId:String}
          AND user_id != '' AND user_id IS NOT NULL
        GROUP BY user_id
      ) AS u
      JOIN
      (
        SELECT user_id, event_time
        FROM events
        WHERE project_id = {projectId:String}
          AND event_time >= now() - INTERVAL {days:UInt32} DAY
      ) AS ev
      ON ev.user_id = u.user_id
      WHERE
        toDate(u.first_seen) >= toDate(now() - INTERVAL {days:UInt32} DAY)
        AND dateDiff('day', toDate(u.first_seen), toDate(ev.event_time)) BETWEEN 0 AND {maxOffset:UInt32}
      GROUP BY cohort_date, day_offset
      ORDER BY cohort_date ASC, day_offset ASC
    `;

        // set maxOffset to days-1 (cap retention width to 30)
        const maxOffset = Math.max(0, days - 1);

        // Run queries in parallel
        const [dauRes, dauSeriesRes, topUsersRes, retentionRes] = await Promise.all([
            db.query({ query: dauWauMauSql, format: "JSON", query_params: { projectId } }),
            db.query({ query: dauTimeseriesSql, format: "JSON", query_params: { projectId, days } }),
            db.query({ query: topUsersSql, format: "JSON", query_params: { projectId, days } }),
            db.query({ query: retentionSqlFixed, format: "JSON", query_params: { projectId, days, maxOffset } }),
        ]);

        const dauJson = await dauRes.json();
        const dauSeriesJson = await dauSeriesRes.json();
        const topUsersJson = await topUsersRes.json();
        const retentionJson = await retentionRes.json();

        // Parse dau/wau/mau
        const dauRow: any = Array.isArray(dauJson?.data) && dauJson.data.length > 0 ? dauJson.data[0] : {};
        const dau = Number(dauRow?.dau ?? 0);
        const wau = Number(dauRow?.wau ?? 0);
        const mau = Number(dauRow?.mau ?? 0);
        const stickiness = mau > 0 ? +(dau / mau) : null;

        // Parse timeseries
        const dauTimeseries =
            Array.isArray(dauSeriesJson?.data)
                ? dauSeriesJson.data.map((r: any) => ({ day: r.day, dau: Number(r.dau) }))
                : [];

        // Parse top users
        const topUsers =
            Array.isArray(topUsersJson?.data)
                ? topUsersJson.data.map((r: any) => ({ user_id: r.user_id, events: Number(r.events) }))
                : [];

        // Parse retention rows and reshape into matrix ready for frontend
        // retentionJson.data: [{ cohort_date, day_offset, users }, ...]
        const retentionRows: Array<{ cohort_date: string; day_offset: number; users: number }> =
            Array.isArray(retentionJson?.data)
                ? retentionJson.data.map((r: any) => ({ cohort_date: r.cohort_date, day_offset: Number(r.day_offset), users: Number(r.users) }))
                : [];

        // transform into an object: { cohort_date: { 0: users, 1: users, ... } }
        const retentionMap: Record<string, Record<number, number>> = {};
        for (const row of retentionRows) {
            retentionMap[row.cohort_date] = retentionMap[row.cohort_date] || {};
            retentionMap[row.cohort_date][row.day_offset] = row.users;
        }

        // Build a frontend-friendly retention object: array of cohorts with counts for offsets 0..maxOffset
        const retention: Array<{ cohort_date: string; totals: number; retention: number[] }> = [];
        for (const cohortDate of Object.keys(retentionMap).sort()) {
            const offsets = [];
            let total = 0;
            for (let i = 0; i <= maxOffset; i++) {
                const v = retentionMap[cohortDate]?.[i] ?? 0;
                offsets.push(v);
                if (i === 0) total = v;
            }
            retention.push({ cohort_date: cohortDate, totals: total, retention: offsets });
        }

        const payload = {
            dau,
            wau,
            mau,
            stickiness,
            dauTimeseries,
            topUsers,
            retention,
            meta: { projectId, days },
        };

        return NextResponse.json({ ok: true, data: payload } as ApiResponse);
    } catch (err: unknown) {
        console.error("audience route error:", err);
        return NextResponse.json({ ok: false, error: formatError(err) } as ApiResponse, { status: 500 });
    }
}
