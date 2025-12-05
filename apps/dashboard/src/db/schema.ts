import {
    integer,
    pgTable,
    varchar,
    timestamp,
    boolean,
    uuid // 1. Import uuid
} from "drizzle-orm/pg-core";

/**
 * Users table
 * (Kept as Integer ID per your previous code. 
 * If you want this to be UUID too, let me know, as it changes the logic).
 */
export const usersTable = pgTable("users", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    image: varchar("image", { length: 2000 }).default(""),
    last_login: timestamp("last_login", { mode: "date" }),
    created_at: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
    is_active: boolean("is_active").default(true).notNull(),
});

/**
 * Websites table
 * - id: CHANGED to UUID v4
 */
export const websitesTable = pgTable("websites", {
    // 2. Define ID as UUID with defaultRandom()
    id: uuid("id").primaryKey().defaultRandom(),

    // Note: owner_id stays integer because it references usersTable.id (which is an integer)
    owner_id: integer("owner_id")
        .notNull()
        .references(() => usersTable.id, { onDelete: 'cascade' }), // Added cascade for safety

    name: varchar("name", { length: 255 }).notNull(),
    domain: varchar("domain", { length: 255 }).notNull().unique(),
    created_at: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
    is_active: boolean("is_active").default(true).notNull(),
});