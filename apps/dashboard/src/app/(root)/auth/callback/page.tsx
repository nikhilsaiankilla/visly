"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader } from "lucide-react";
import { toast } from "sonner";

export default function AuthCallbackPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(true);

    useEffect(() => {
        if (status === "loading") return;

        if (!session?.user?.email) {
            toast.error("Authentication failed");
            router.push("/login");
            return;
        }

        const createOrUpdateUser = async () => {
            try {
                const payload = {
                    email: session?.user?.email,
                    name: session?.user?.name ?? "User",
                    image: session?.user?.image ?? null,
                };

                const res = await fetch("/api/user/create-or-update", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                if (!res.ok) {
                    throw new Error(`Failed to create/update user: ${res.status}`);
                }

                const json = await res.json();

                if (!json.ok) {
                    throw new Error(json.error);
                }

                toast.success("Successfully logged in!");
                router.push("/dashboard");
            } catch (err) {
                console.error("User creation error:", err);
                toast.error("Login failed, please try again.");
                router.push("/login");
            } finally {
                setIsProcessing(false);
            }
        };

        createOrUpdateUser();
    }, [session, status, router]);

    return (
        <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader className="w-8 h-8 animate-spin text-green-600" />
                <p className="text-sm text-gray-600">
                    {isProcessing ? "Completing your login..." : "Redirecting..."}
                </p>
            </div>
        </div>
    );
}