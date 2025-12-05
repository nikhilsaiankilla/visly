// app/api/projects/[id]/stats/acquisition/route.ts
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

        // Helpful: if you have pre-parsed utm_* columns, replace extractURLParameter(utm, 'utm_source') with utm_source
        // 1) UTM sources
        const utmSourcesSql = `
      SELECT
        extractURLParameter(utm, 'utm_source') AS utm_source,
        count() AS cnt
      FROM events
      WHERE project_id = {projectId:String}
        AND utm != '' AND utm IS NOT NULL
        AND event_time >= now() - INTERVAL {days:UInt32} DAY
      GROUP BY utm_source
      ORDER BY cnt DESC
    `;

        // 2) UTM mediums
        const utmMediumsSql = `
      SELECT
        extractURLParameter(utm, 'utm_medium') AS utm_medium,
        count() AS cnt
      FROM events
      WHERE project_id = {projectId:String}
        AND utm != '' AND utm IS NOT NULL
        AND event_time >= now() - INTERVAL {days:UInt32} DAY
      GROUP BY utm_medium
      ORDER BY cnt DESC
    `;

        // 3) UTM campaigns
        const utmCampaignsSql = `
      SELECT
        extractURLParameter(utm, 'utm_campaign') AS utm_campaign,
        count() AS cnt
      FROM events
      WHERE project_id = {projectId:String}
        AND utm != '' AND utm IS NOT NULL
        AND event_time >= now() - INTERVAL {days:UInt32} DAY
      GROUP BY utm_campaign
      ORDER BY cnt DESC
    `;

        // 4) Conversions by UTM source (example conversion = 'signup')
        // We take the earliest utm per session using argMin(utm, event_time) and then count sessions with signup
        const conversionsByUtmSql = `
      SELECT
        utm_source,
        count() AS conversions
      FROM (
        SELECT
          session_id,
          argMin(extractURLParameter(utm, 'utm_source'), event_time) AS utm_source,
          maxIf(1, event = 'signup') AS has_signup -- 1 if session contains signup
        FROM events
        WHERE project_id = {projectId:String}
          AND event_time >= now() - INTERVAL {days:UInt32} DAY
        GROUP BY session_id
      )
      WHERE has_signup = 1
      GROUP BY utm_source
      ORDER BY conversions DESC
    `;

        // 5) Top referrers (raw, no limit)
        const topReferrersSql = `
      SELECT
        referrer,
        count() AS cnt
      FROM events
      WHERE project_id = {projectId:String}
        AND referrer != '' AND referrer IS NOT NULL
        AND event_time >= now() - INTERVAL {days:UInt32} DAY
      GROUP BY referrer
      ORDER BY cnt DESC
    `;

        // 6) New vs Returning users (best-effort)
        // Approach: for each user, compute their first_event_time overall (min event_time in table),
        // then check if that date falls within the window -> mark as new; otherwise returning.
        // WARNING: if your table is very large this can be heavy; better to maintain a users table with first_seen.
        const newVsReturningSql = `
      SELECT
        sumIf(is_new, 1) AS new_users,
        sumIf(is_new, 0) AS returning_users,
        count() AS total_users
      FROM (
        SELECT
          user_id,
          toDate(min_event_time) = toDate(min_event_time_in_window) AS is_new
        FROM (
          SELECT
            user_id,
            min(event_time) AS min_event_time,
            minIf(event_time, event_time >= now() - INTERVAL {days:UInt32} DAY) AS min_event_time_in_window
          FROM events
          WHERE project_id = {projectId:String}
            AND user_id != '' AND user_id IS NOT NULL
          GROUP BY user_id
        )
      )
    `;

        // Run queries in parallel
        const [utmSourcesRes, utmMediumsRes, utmCampaignsRes, conversionsRes, topReferrersRes, newVsReturningRes] = await Promise.all([
            db.query({ query: utmSourcesSql, format: "JSON", query_params: { projectId, days } }),
            db.query({ query: utmMediumsSql, format: "JSON", query_params: { projectId, days } }),
            db.query({ query: utmCampaignsSql, format: "JSON", query_params: { projectId, days } }),
            db.query({ query: conversionsByUtmSql, format: "JSON", query_params: { projectId, days } }),
            db.query({ query: topReferrersSql, format: "JSON", query_params: { projectId, days } }),
            db.query({ query: newVsReturningSql, format: "JSON", query_params: { projectId, days } }),
        ]);

        const utmSourcesJson = await utmSourcesRes.json();
        const utmMediumsJson = await utmMediumsRes.json();
        const utmCampaignsJson = await utmCampaignsRes.json();
        const conversionsJson = await conversionsRes.json();
        const topReferrersJson = await topReferrersRes.json();
        const newVsReturningJson = await newVsReturningRes.json();

        const utmSources = Array.isArray(utmSourcesJson?.data) ? utmSourcesJson.data.map((r: any) => ({ utm_source: r.utm_source ?? '(none)', cnt: Number(r.cnt) })) : [];
        const utmMediums = Array.isArray(utmMediumsJson?.data) ? utmMediumsJson.data.map((r: any) => ({ utm_medium: r.utm_medium ?? '(none)', cnt: Number(r.cnt) })) : [];
        const utmCampaigns = Array.isArray(utmCampaignsJson?.data) ? utmCampaignsJson.data.map((r: any) => ({ utm_campaign: r.utm_campaign ?? '(none)', cnt: Number(r.cnt) })) : [];
        const conversionsByUtm = Array.isArray(conversionsJson?.data) ? conversionsJson.data.map((r: any) => ({ utm_source: r.utm_source ?? '(none)', conversions: Number(r.conversions) })) : [];
        const topReferrers = Array.isArray(topReferrersJson?.data) ? topReferrersJson.data.map((r: any) => ({ referrer: r.referrer, cnt: Number(r.cnt) })) : [];
        const newVsReturningRow: any = Array.isArray(newVsReturningJson?.data) && newVsReturningJson.data.length > 0 ? newVsReturningJson.data[0] : {};
        const newVsReturning = {
            new_users: Number(newVsReturningRow?.new_users ?? 0),
            returning_users: Number(newVsReturningRow?.returning_users ?? 0),
            total_users: Number(newVsReturningRow?.total_users ?? 0),
        };

        const payload = {
            utmSources,
            utmMediums,
            utmCampaigns,
            conversionsByUtm,
            topReferrers,
            newVsReturning,
            meta: { projectId, days },
        };

        return NextResponse.json({ ok: true, data: payload } as ApiResponse);
    } catch (err: unknown) {
        console.error("acquisition route error:", err);
        return NextResponse.json({ ok: false, error: formatError(err) } as ApiResponse, { status: 500 });
    }
}
