import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db/index"; // Using the export from your previous code
import type { Adapter } from "next-auth/adapters";

export const authOptions: NextAuthOptions = {
    // 1. ADAPTER: Connects NextAuth to your Drizzle DB
    // Note: The 'as Adapter' cast is often needed for type compatibility between 
    // NextAuth v4 and the newer @auth/drizzle-adapter
    adapter: DrizzleAdapter(db) as Adapter,

    // 2. PROVIDERS: Only Google for now
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            // Optional: Force Google to send a refresh token
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                },
            },
        }),
    ],

    // 3. SESSION: Use JWT to avoid database lookups on every page load
    // Even with an adapter, this is often preferred for performance
    session: {
        strategy: "jwt",
    },

    // 4. CALLBACKS: Add the user ID to the client-side session
    callbacks: {
        async jwt({ token, user }) {
            // When user first signs in, 'user' object is available
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            // Make the ID available in the frontend (e.g. session.user.id)
            if (session.user) {
                // @ts-expect-error: 'id' is not on default Session type (requires module augmentation)
                session.user.id = token.id as string;
            }
            return session;
        },
    },

    // 5. PAGES: Optional custom paths
    pages: {
        signIn: '/login', // If you have a custom login page
        error: '/auth/error',
    },

    // 6. DEBUG: Enable this if you run into issues
    debug: process.env.NODE_ENV === "development",
};