"use client"

import { useEffect, useState } from "react";
import ProfileDropdown from "@/components/profile-dropdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Menu, Plus, X } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import ProfileCard from "@/components/profile-card";

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const { data: session, status } = useSession();
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Disable body scroll when drawer is open
    useEffect(() => {
        if (drawerOpen) {
            document.documentElement.style.overflow = "hidden";
            document.body.style.overflow = "hidden";
        } else {
            document.documentElement.style.overflow = "";
            document.body.style.overflow = "";
        }
        // clean up if component unmounts
        return () => {
            document.documentElement.style.overflow = "";
            document.body.style.overflow = "";
        };
    }, [drawerOpen]);

    // Close on Escape
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setDrawerOpen(false);
        };
        if (drawerOpen) window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [drawerOpen]);

    // --- Auth Loading State ---
    if (status === "loading") {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-[200px] w-full rounded-xl" />
                </div>
            </div>
        );
    }

    // --- Unauthenticated State ---
    if (!session) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white p-4">
                <Card className="w-full max-w-md border-slate-200 shadow-lg text-center p-6">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-slate-900">Access Denied</CardTitle>
                        <CardDescription>You need to be logged in to view this dashboard.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <Button asChild className="bg-green-600 hover:bg-green-600/80 text-white">
                            <Link href="/login">Sign In</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const userInitials = session.user?.name
        ? session.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)
        : "DV";

    return (
        <main className="min-h-screen text-slate-900 p-6 md:p-10 max-w-6xl mx-auto relative">
            <div className="flex flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <Link href="/dashboard" className="flex items-center font-bold text-xl text-slate-900 gap-2">
                        <Image src={"/visly.png"} alt="visly logo" width={30} height={30} />
                        <span className="hidden md:block">Visly</span>
                    </Link>
                </div>

                <div className="flex items-center gap-2">
                    <Button asChild className="bg-green-600 hover:bg-green-600/90 text-white shadow-sm">
                        <Link href="/dashboard/new">
                            <Plus size={16} />
                        </Link>
                    </Button>

                    <ProfileDropdown
                        image={session?.user?.image || ""}
                        userInitials={userInitials}
                        name={session?.user?.name || ""}
                        email={session?.user?.email || ""}
                    />

                    {/* Mobile menu button */}
                    <button
                        type="button"
                        aria-label="Open menu"
                        className="p-2 rounded-md hover:bg-slate-100"
                        onClick={() => setDrawerOpen(true)}
                    >
                        <Menu />
                    </button>
                </div>
            </div>

            {children}

            {/* Drawer / Slide-over */}
            {/* Backdrop */}
            <div
                aria-hidden={!drawerOpen}
                className={`fixed inset-0 z-40 transition-opacity duration-300 ${drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
                onClick={() => setDrawerOpen(false)}
            >
                <div className="absolute inset-0 bg-black/40" />
            </div>

            {/* Panel */}
            <aside
                role="dialog"
                aria-modal="true"
                aria-hidden={!drawerOpen}
                className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[450px] max-w-full transform transition-transform duration-300 ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}
            >
                <div className="h-full bg-white shadow-xl flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b">
                        <div className="flex items-center gap-3">
                            <Image src={"/visly.png"} alt="logo" width={28} height={28} />
                            <span className="font-semibold">Visly</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="ghost" className="p-2" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
                                <X />
                            </Button>
                        </div>
                    </div>

                    <div className="p-4 space-y-3 overflow-y-auto flex flex-col items-start">
                        <Button variant="outline" asChild className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700 w-full">
                            <Link href="/docs">
                                <BookOpen size={16} className="mr-2" />
                                Docs
                            </Link>
                        </Button>

                        <Button asChild className="bg-green-600 hover:bg-green-600/90 text-white shadow-sm w-full">
                            <Link href="/dashboard/new">
                                <Plus size={16} className="mr-2" />
                                Add Project
                            </Link>
                        </Button>
                    </div>

                    <div className="w-full px-4">
                        <ProfileCard />
                    </div>
                </div>
            </aside>
        </main>
    );
}



