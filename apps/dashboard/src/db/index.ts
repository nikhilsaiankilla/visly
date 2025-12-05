// src/db/index.ts
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { Sql } from "postgres";

type GlobalForDb = typeof globalThis & {
    __pgClient?: ReturnType<typeof postgres>;
    __drizzle?: ReturnType<typeof drizzle>;
};

const globalForDb = globalThis as GlobalForDb;

const connectionString = process.env.DATABASE_URL!;
if (!connectionString) {
    throw new Error("Missing DATABASE_URL");
}

// Optional SSL: set DB_SSL=true in production if required by your provider
const useSsl = process.env.DB_SSL === "true" || process.env.PGSSLMODE === "require";

// Create (or reuse) postgres-js client
const sqlClient =
    globalForDb.__pgClient ??
    postgres(connectionString, {
        // postgres.js options
        ssl: useSsl ? { rejectUnauthorized: false } : undefined,
        max: Number(process.env.PG_MAX_CLIENTS ?? 10), // change if needed
        // prepare: false is recommended for some environments, but default is fine
        prepare: true,
    });

// Create (or reuse) drizzle instance
export const db = globalForDb.__drizzle ?? drizzle(sqlClient as unknown as Sql);

// Cache for hot-reload / serverless reuse (only in non-production)
if (process.env.NODE_ENV !== "production") {
    globalForDb.__pgClient = sqlClient;
    globalForDb.__drizzle = db;
}

// Optional: lightweight initial check (non-blocking) — logs whether `users` exists
(async () => {
    try {
        const r = await sqlClient`select to_regclass('public.users') as users_exists;`;
        const usersExists = r?.[0]?.users_exists ?? null;
        console.log("[DB] connected (postgres-js). users_exists:", usersExists);
    } catch (err: any) {
        console.error("[DB] initial check failed:", {
            message: err.message,
            code: err.code,
            detail: err.detail,
        });
    }
})();

export default db;
