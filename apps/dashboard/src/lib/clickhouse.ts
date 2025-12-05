import { ClickHouseClient, createClient } from "@clickhouse/client";

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