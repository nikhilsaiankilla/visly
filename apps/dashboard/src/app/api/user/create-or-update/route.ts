// app/api/create-or-update-user/route.ts
import { usersTable } from "@/db/schema";
import { db } from "@/db/index";
import { sendWelcomeEmail } from "@/lib/email";
import { formatError } from "@/utils/utils";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

type ApiResponse =
    | { ok: true; created: boolean; user: any; message?: string }
    | { ok: false; error: string };

// Validate email format
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Sanitize input to prevent SQL injection
function sanitizeString(input: string, maxLength: number = 255): string {
    return input.trim().slice(0, maxLength);
}

export async function POST(req: NextRequest) {
    let email: string | null = null;

    try {
        // Parse and validate JSON payload
        const json = await req.json().catch(() => null);

        if (!json || typeof json !== 'object') {
            return NextResponse.json(
                { ok: false, error: "Invalid JSON payload" } as ApiResponse,
                { status: 400 }
            );
        }

        // Validate required fields
        if (!json.email || typeof json.email !== 'string') {
            return NextResponse.json(
                { ok: false, error: "Email is required and must be a string" } as ApiResponse,
                { status: 400 }
            );
        }

        if (!json.name || typeof json.name !== 'string') {
            return NextResponse.json(
                { ok: false, error: "Name is required and must be a string" } as ApiResponse,
                { status: 400 }
            );
        }

        // Sanitize and validate inputs
        email = sanitizeString(json.email.toLowerCase(), 255);
        const name = sanitizeString(json.name, 255);
        const image = json.image && typeof json.image === 'string'
            ? sanitizeString(json.image, 500)
            : null;

        if (!isValidEmail(email)) {
            return NextResponse.json(
                { ok: false, error: "Invalid email format" } as ApiResponse,
                { status: 400 }
            );
        }

        if (name.length < 1) {
            return NextResponse.json(
                { ok: false, error: "Name cannot be empty" } as ApiResponse,
                { status: 400 }
            );
        }

        const now = new Date();

        // Verify database connection
        if (!db) {
            throw new Error("Database connection not initialized");
        }

        // Check for existing user with error handling
        let existing;
        try {
            const results = await db
                .select()
                .from(usersTable)
                .where(eq(usersTable.email, email))
                .limit(1);

            existing = results[0] || null;
        } catch (dbErr) {
            console.error("Database query error (SELECT):", formatError(dbErr));
            throw new Error(`Database query failed: ${formatError(dbErr)}`);
        }

        // Create new user
        if (!existing) {
            try {
                const [created] = await db
                    .insert(usersTable)
                    .values({
                        name,
                        email,
                        image,
                        last_login: now,
                        created_at: now,
                        updated_at: now,
                        is_active: true, // Explicitly set default
                    })
                    .returning();

                // Send welcome email (fire-and-forget with error logging)
                sendWelcomeEmail(email, name).catch((err) =>
                    console.error(`Welcome email failed for ${email}:`, formatError(err))
                );

                return NextResponse.json(
                    {
                        ok: true,
                        created: true,
                        user: created,
                        message: "User created successfully"
                    } as ApiResponse,
                    { status: 201 }
                );
            } catch (insertErr) {
                console.error("Database insert error:", formatError(insertErr));
                throw new Error(`Failed to create user: ${formatError(insertErr)}`);
            }
        }

        // Update existing user
        try {
            const [updated] = await db
                .update(usersTable)
                .set({
                    last_login: now,
                    updated_at: now,
                    name,
                    ...(image !== null && { image }) // Only update image if provided
                })
                .where(eq(usersTable.email, email))
                .returning();

            return NextResponse.json(
                {
                    ok: true,
                    created: false,
                    user: updated,
                    message: "User updated successfully"
                } as ApiResponse,
                { status: 200 }
            );
        } catch (updateErr) {
            console.error("Database update error:", formatError(updateErr));
            throw new Error(`Failed to update user: ${formatError(updateErr)}`);
        }

    } catch (err: unknown) {
        const errorMsg = formatError(err);
        console.error("create-or-update-user error:", {
            error: errorMsg,
            email: email || 'unknown',
            timestamp: new Date().toISOString()
        });

        // Return appropriate status based on error type
        const status = errorMsg.includes("Database") ? 503 : 500;

        return NextResponse.json(
            {
                ok: false,
                error: process.env.NODE_ENV === 'production'
                    ? "Internal server error"
                    : errorMsg
            } as ApiResponse,
            { status }
        );
    }
}

// Optional: Add GET method to retrieve user info
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');

        if (!email || !isValidEmail(email)) {
            return NextResponse.json(
                { ok: false, error: "Valid email parameter required" } as ApiResponse,
                { status: 400 }
            );
        }

        const [user] = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, email.toLowerCase()))
            .limit(1);

        if (!user) {
            return NextResponse.json(
                { ok: false, error: "User not found" } as ApiResponse,
                { status: 404 }
            );
        }

        return NextResponse.json(
            { ok: true, created: false, user } as ApiResponse,
            { status: 200 }
        );
    } catch (err) {
        console.error("GET user error:", formatError(err));
        return NextResponse.json(
            { ok: false, error: "Failed to retrieve user" } as ApiResponse,
            { status: 500 }
        );
    }
}