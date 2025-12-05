import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }),
    ],
    // Optional: Custom pages configuration to use your custom Login component 
    // instead of the default NextAuth one if the user visits /api/auth/signin
    pages: {
        signIn: '/login',
    },
})

export { handler as GET, handler as POST }