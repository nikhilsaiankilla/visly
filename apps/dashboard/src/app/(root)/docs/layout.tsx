"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, BookOpen, LucideGithub } from "lucide-react";
import sidebarNav from "./sidebar-data.json";
import Nav from "@/app/components/Nav";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import ProfileDropdown from "@/components/profile-dropdown";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react"

export default function DocsLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeHash, setActiveHash] = useState<string>("");

    useEffect(() => {
        if (typeof window === "undefined") return;

        // set initial hash (or default to #introduction)
        setActiveHash(window.location.hash || "#introduction");

        const onHashChange = () => {
            setActiveHash(window.location.hash || "#introduction");
        };

        window.addEventListener("hashchange", onHashChange);
        return () => window.removeEventListener("hashchange", onHashChange);
    }, []);

    const isLinkActive = (href: string) => {
        // if it's a hash link, use hash; else fallback to pathname check
        if (href.startsWith("#")) {
            return activeHash === href;
        }
        return pathname === href;
    };

    const [isOpen, setIsOpen] = useState(false);
    const [stars, setStars] = useState<number | null>(null);
    const [starsLoading, setStarsLoading] = useState(false);
    const session = useSession();

    // repo info
    const owner = "nikhilsaiankilla";
    const repo = "visly";

    const userInitials = session?.data?.user?.name
        ? session?.data?.user?.name.split(" ").map((n) => n[0]).join("").slice(0, 2)
        : "DV";


    useEffect(() => {
        let aborted = false;
        async function fetchStars() {
            setStarsLoading(true);
            try {
                const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
                if (!res.ok) throw new Error(`GitHub API: ${res.status}`);
                const json = await res.json();
                if (!aborted) setStars(json.stargazers_count ?? null);
            } catch (err) {
                console.error("Failed to fetch GitHub stars", err);
                if (!aborted) setStars(null);
            } finally {
                if (!aborted) setStarsLoading(false);
            }
        }
        fetchStars();
        return () => { aborted = true; }
    }, []);

    return (
        <div className="flex min-h-screen flex-col md:flex-row bg-white font-sans text-slate-900">
            {/* Mobile Top Bar */}
            <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 bg-white sticky top-0 z-50">
                <Link href="/" className="flex items-center font-bold text-xl text-slate-900 gap-2">
                    <Image src={'/visly.png'} alt="visly logo" width={30} height={30} />
                </Link>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-md"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Sidebar */}
            <aside
                className={`fixed inset-0 z-40 bg-white transform transition-transform duration-300 ease-in-out
          md:translate-x-0 md:w-64 md:shrink-0 md:border-r md:border-slate-200 md:h-screen md:sticky md:top-0
          ${isMobileMenuOpen ? "translate-x-0 pt-20" : "-translate-x-full md:pt-0"}
        `}
            >
                <div className="h-full overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                    {/* Desktop Logo */}
                    <Link href="/" className="flex items-center font-bold text-xl text-slate-900 gap-2">
                        <Image src={'/visly.png'} alt="visly logo" width={30} height={30} />
                        <span className="hidden md:block">Visly</span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
                            v1.0
                        </span>
                    </Link>

                    <nav className="space-y-8">
                        {sidebarNav.map((section) => (
                            <div key={section.title}>
                                <h4 className="font-semibold text-slate-900 text-sm tracking-wider uppercase mb-3">
                                    {section.title}
                                </h4>
                                <ul className="space-y-1.5 border-l border-slate-100 ml-1 pl-4">
                                    {section.items.map((item: any) => {
                                        const active = isLinkActive(item.href);
                                        return (
                                            <li key={item.href}>
                                                <Link
                                                    href={item.href}
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                    className={`block text-sm transition-all duration-200 ${active
                                                        ? "text-green-600 font-semibold -ml-4 pl-4 border-l border-green-600"
                                                        : "text-slate-500 hover:text-slate-900 hover:translate-x-1"
                                                        }`}
                                                >
                                                    {item.title}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))}
                    </nav>
                </div>
            </aside>
            <div className="w-full">
                <nav className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white backdrop-blur-md px-4">
                    <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                        {/* Logo */}
                        <Link href="/" className="flex items-center font-bold text-xl text-slate-900 gap-2">
                            <Image src={'/visly.png'} alt="visly logo" width={20} height={20} />
                            <span className="hidden md:block">Visly</span>
                        </Link>

                        {/* CTA */}
                        <div className="hidden md:flex gap-2">
                            <div className="flex gap-8 text-sm font-medium text-slate-600">
                                <Link href="/" className="hover:text-green-600 transition-colors">Home</Link>
                                <Link href="/docs" className="hover:text-green-600 transition-colors">Docs</Link>
                                <Link href="https://github.com/nikhilsaiankilla/visly" target="_blank" className="hover:text-green-600 transition-colors">Github</Link>
                                {
                                    session?.status === 'authenticated'
                                        ?
                                        <Link href="/dashboard" className="hover:text-green-600 transition-colors">
                                            Dashboard
                                        </Link>
                                        :
                                        <Link href="/login" className="hover:text-green-600 transition-colors">
                                            Login
                                        </Link>
                                }
                            </div>

                            <Link href="https://github.com/nikhilsaiankilla/visly" target="_blank" className="hover:text-green-600 transition-colors flex items-center gap-1">
                                <Badge variant={'outline'} className="outline outline-green-600 shadow-2xl bg-green-600/10">
                                    <LucideGithub size={15} />
                                    <span className="text-xs ml-2 px-2 py-0.5 rounded-lg flex items-center">
                                        {starsLoading ? "…" : (stars !== null ? <>{stars}</> : "—")}
                                    </span>
                                </Badge>
                            </Link>
                            {
                                session.status === 'authenticated'
                                    ?
                                    <ProfileDropdown
                                        image={session?.data?.user?.image || ""}
                                        name={session?.data?.user?.name || ""}
                                        email={session?.data?.user?.email || ""}
                                        userInitials={userInitials}
                                    />
                                    :
                                    <Link
                                        href={'/login'}
                                    >
                                        <Button className="bg-green-600 hover:bg-green-600/90">Start for Free</Button>
                                    </Link>
                            }
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
                            {isOpen ? <X className="h-6 w-6 text-slate-600" /> : <Menu className="h-6 w-6 text-slate-600" />}
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="md:hidden border-b border-slate-100 bg-white px-4 py-4 space-y-4"
                        >
                            <Link href="/" className="block text-sm font-medium text-slate-600">Home</Link>
                            <Link href="/docs" className="block text-sm font-medium text-slate-600">docs</Link>
                            <Link href="https://github.com/nikhilsaiankilla/visly" target="_blank" className="block text-sm font-medium text-slate-600">Github</Link>
                            {
                                session?.status === 'authenticated'
                                    ?
                                    <Link href="/dashboard" className="block text-sm font-medium text-slate-600">Dashboard</Link>
                                    :
                                    <Link href="/login" className="block text-sm font-medium text-slate-600">Login</Link>
                            }

                            {
                                session.status === 'authenticated'
                                    ?
                                    <ProfileDropdown
                                        image={session?.data?.user?.image || ""}
                                        name={session?.data?.user?.name || ""}
                                        email={session?.data?.user?.email || ""}
                                        userInitials={userInitials}
                                    />
                                    :
                                    <Link
                                        href={'/login'}
                                    >
                                        <Button className="bg-green-600 hover:bg-green-600/90">Start for Free</Button>
                                    </Link>
                            }
                        </motion.div>
                    )}
                </nav>
                {/* Main content */}
                <main className="flex-1 w-full max-w-5xl mx-auto py-10 px-6 md:px-12 min-h-[calc(100vh-4rem)]">
                    {children}
                </main>
            </div>
        </div>
    );
}
