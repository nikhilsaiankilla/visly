// app/api/projects/[id]/stats/tech_geo_ops/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ClickHouseClient, createClient } from "@clickhouse/client";
import { formatError } from "@/utils/utils";

type ApiResponse = | { ok: true; data: any } | { ok: false; error: string };

interface Context { params: Promise<{ id: string }>; }

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
    if (!projectId) return NextResponse.json({ ok: false, error: "projectId is required" }, { status: 400 });

    const raw = Number(req.nextUrl.searchParams.get("range") || "7");
    const days = Number.isFinite(raw) ? Math.max(1, Math.min(30, Math.floor(raw))) : 7;

    // choose proper ClickHouse function names (case-sensitive)
    const gran = days <= 1 ? "second" : "minute";
    const toStartFunc = gran === "second" ? "toStartOfSecond" : "toStartOfMinute";

    const deviceSql = `
      SELECT device_type, count() AS cnt
      FROM events
      WHERE project_id = {projectId:String}
        AND device_type != '' AND device_type IS NOT NULL
        AND event_time >= now() - INTERVAL {days:UInt32} DAY
      GROUP BY device_type
      ORDER BY cnt DESC
    `;

    const browserSql = `
      SELECT browser, browser_version, count() AS cnt
      FROM events
      WHERE project_id = {projectId:String}
        AND browser != '' AND browser IS NOT NULL
        AND event_time >= now() - INTERVAL {days:UInt32} DAY
      GROUP BY browser, browser_version
      ORDER BY cnt DESC
    `;

    const osSql = `
      SELECT os, os_version, count() AS cnt
      FROM events
      WHERE project_id = {projectId:String}
        AND os != '' AND os IS NOT NULL
        AND event_time >= now() - INTERVAL {days:UInt32} DAY
      GROUP BY os, os_version
      ORDER BY cnt DESC
    `;

    const viewportBucketsSql = `
      SELECT
        case
          when viewport_w < 600 then 'xs'
          when viewport_w >= 600 and viewport_w < 900 then 'sm'
          when viewport_w >= 900 and viewport_w < 1280 then 'md'
          when viewport_w >= 1280 and viewport_w < 1920 then 'lg'
          else 'xl'
        end AS bucket,
        count() AS cnt
      FROM events
      WHERE project_id = {projectId:String}
        AND viewport_w IS NOT NULL
        AND event_time >= now() - INTERVAL {days:UInt32} DAY
      GROUP BY bucket
      ORDER BY cnt DESC
    `;

    const topViewportsSql = `
      SELECT concat(toString(viewport_w), 'x', toString(viewport_h)) AS size, count() AS cnt
      FROM events
      WHERE project_id = {projectId:String}
        AND viewport_w IS NOT NULL
        AND viewport_h IS NOT NULL
        AND event_time >= now() - INTERVAL {days:UInt32} DAY
      GROUP BY size
      ORDER BY cnt DESC
      LIMIT 50
    `;

    const countrySql = `
      SELECT country, count() AS cnt
      FROM events
      WHERE project_id = {projectId:String}
        AND country != '' AND country IS NOT NULL
        AND event_time >= now() - INTERVAL {days:UInt32} DAY
      GROUP BY country
      ORDER BY cnt DESC
    `;

    const citySql = `
      SELECT country, region, city, count() AS cnt
      FROM events
      WHERE project_id = {projectId:String}
        AND city != '' AND city IS NOT NULL
        AND event_time >= now() - INTERVAL {days:UInt32} DAY
      GROUP BY country, region, city
      ORDER BY cnt DESC
      LIMIT 200
    `;

    const latencySql = `
      SELECT
        avg(lat_ms) AS avg_ms,
        quantile(0.5)(lat_ms) AS p50_ms,
        quantile(0.95)(lat_ms) AS p95_ms,
        count() AS samples
      FROM (
        SELECT (toUnixTimestamp64Milli(server_time) - toUnixTimestamp64Milli(event_time)) AS lat_ms
        FROM events
        WHERE project_id = {projectId:String}
          AND server_time IS NOT NULL
          AND event_time IS NOT NULL
          AND event_time >= now() - INTERVAL {days:UInt32} DAY
      )
    `;

    // correct function injection here
    const epsSql = `
      SELECT ${toStartFunc}(event_time) AS ts, count() AS events
      FROM events
      WHERE project_id = {projectId:String}
        AND event_time >= now() - INTERVAL {days:UInt32} DAY
      GROUP BY ts
      ORDER BY ts ASC
    `;

    const [
      deviceRes,
      browserRes,
      osRes,
      viewportBucketsRes,
      topViewportsRes,
      countryRes,
      cityRes,
      latencyRes,
      epsRes,
    ] = await Promise.all([
      db.query({ query: deviceSql, format: "JSON", query_params: { projectId, days } }),
      db.query({ query: browserSql, format: "JSON", query_params: { projectId, days } }),
      db.query({ query: osSql, format: "JSON", query_params: { projectId, days } }),
      db.query({ query: viewportBucketsSql, format: "JSON", query_params: { projectId, days } }),
      db.query({ query: topViewportsSql, format: "JSON", query_params: { projectId, days } }),
      db.query({ query: countrySql, format: "JSON", query_params: { projectId, days } }),
      db.query({ query: citySql, format: "JSON", query_params: { projectId, days } }),
      db.query({ query: latencySql, format: "JSON", query_params: { projectId, days } }),
      db.query({ query: epsSql, format: "JSON", query_params: { projectId, days } }),
    ]);

    const deviceJson = await deviceRes.json();
    const browserJson = await browserRes.json();
    const osJson = await osRes.json();
    const viewportBucketsJson = await viewportBucketsRes.json();
    const topViewportsJson = await topViewportsRes.json();
    const countryJson = await countryRes.json();
    const cityJson = await cityRes.json();
    const latencyJson = await latencyRes.json();
    const epsJson = await epsRes.json();

    const device = Array.isArray(deviceJson?.data) ? deviceJson.data.map((r: any) => ({ device_type: r.device_type, cnt: Number(r.cnt) })) : [];
    const browsers = Array.isArray(browserJson?.data) ? browserJson.data.map((r: any) => ({ browser: r.browser, version: r.browser_version, cnt: Number(r.cnt) })) : [];
    const os = Array.isArray(osJson?.data) ? osJson.data.map((r: any) => ({ os: r.os, version: r.os_version, cnt: Number(r.cnt) })) : [];
    const viewportBuckets = Array.isArray(viewportBucketsJson?.data) ? viewportBucketsJson.data.map((r: any) => ({ bucket: r.bucket, cnt: Number(r.cnt) })) : [];
    const topViewports = Array.isArray(topViewportsJson?.data) ? topViewportsJson.data.map((r: any) => ({ size: r.size, cnt: Number(r.cnt) })) : [];
    const countries = Array.isArray(countryJson?.data) ? countryJson.data.map((r: any) => ({ country: r.country, cnt: Number(r.cnt) })) : [];
    const cities = Array.isArray(cityJson?.data) ? cityJson.data.map((r: any) => ({ country: r.country, region: r.region, city: r.city, cnt: Number(r.cnt) })) : [];

    const latencyRow: any = Array.isArray(latencyJson?.data) && latencyJson.data.length > 0 ? latencyJson.data[0] : {};
    const latency = {
      avg_ms: Number(latencyRow?.avg_ms ?? 0),
      p50_ms: Number(latencyRow?.p50_ms ?? 0),
      p95_ms: Number(latencyRow?.p95_ms ?? 0),
      samples: Number(latencyRow?.samples ?? 0),
    };

    const eps = Array.isArray(epsJson?.data) ? epsJson.data.map((r: any) => ({ ts: r.ts, events: Number(r.events) })) : [];

    const payload = {
      device,
      browsers,
      os,
      viewportBuckets,
      topViewports,
      countries,
      cities,
      latency,
      eps,
      meta: { projectId, days, granularity: gran },
    };

    return NextResponse.json({ ok: true, data: payload } as ApiResponse);
  } catch (err: unknown) {
    console.error("tech_geo_ops route error:", err);
    return NextResponse.json({ ok: false, error: formatError(err) } as ApiResponse, { status: 500 });
  }
}
