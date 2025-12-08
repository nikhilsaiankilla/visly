"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

// Shadcn Components
import { Button } from "@/components/ui/button";
import {
    CardContent,
    CardDescription,
    CardFooter,
    CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const session = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleGoogleLogin = async () => {
        setError(null);
        setIsLoading(true);

        try {
            await signIn("google", {
                callbackUrl: "/auth/callback", // Usually better to go straight to dashboard
                redirect: true
            });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Login failed, please try again.";
            console.error("Login error:", err);
            setError(message);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (session.status === 'authenticated') {
            router.push('/dashboard');
        }
    }, [])
    
    return (
        <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden">

            {/* Background Decoration (Optional - matches landing page vibe) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#6A8E58]/5 blur-[100px] rounded-full -z-10" />

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="w-full max-w-sm px-4 z-10"
            >
                <div >
                    <div className="text-center pb-6">
                        <div className="mx-auto p-3 bg-[#6A8E58]/10 rounded-xl mb-4 w-fit">
                            {/* Ensure you have this image in public/visly.png */}
                            <Image
                                src={'/visly.png'}
                                alt="Visly Logo"
                                width={32}
                                height={32}
                                className="object-contain"
                            />
                        </div>
                        <CardTitle className="text-xl font-bold tracking-tight text-slate-900">
                            Log in to Visly
                        </CardTitle>
                        <CardDescription>
                            Your open-source web analytics platform.
                        </CardDescription>
                    </div>

                    <CardContent className="space-y-4">
                        <Button
                            variant="outline"
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="w-full h-12 font-medium bg-green-600 hover:bg-green-600/95 text-white hover:text-white hover:shadow-2xl relative transition-all duration-200 ease-in"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin text-white" />
                            ) : (
                                <>
                                    <div className="absolute left-4">
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
                                            <path
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                fill="#ffffff"
                                            />
                                            <path
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                fill="#ffffff"
                                            />
                                            <path
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                                fill="#ffffff"
                                            />
                                            <path
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                fill="#ffffff"
                                            />
                                        </svg>
                                    </div>
                                    Continue with Google
                                </>
                            )}
                        </Button>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600 text-center">
                                {error}
                            </div>
                        )}
                    </CardContent>

                    <CardFooter>
                        <p className="text-xs text-center text-slate-400 w-full leading-relaxed mt-2">
                            By clicking continue, you agree to our{" "}
                            <Link href="#" className="underline hover:text-[#6A8E58] transition-colors">
                                Terms of Service
                            </Link>{" "}
                            and{" "}
                            <Link href="#" className="underline hover:text-[#6A8E58] transition-colors">
                                Privacy Policy
                            </Link>
                            .
                        </p>
                    </CardFooter>
                </div>
            </motion.div>

            <div className="absolute bottom-6 text-xs text-slate-400">
                &copy; {new Date().getFullYear()} Visly Inc.
            </div>
        </div>
    );
}