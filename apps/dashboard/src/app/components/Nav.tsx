"use client"

import Link from "next/link";
import { useEffect, useState } from "react";
import { LucideGithub, Menu, X } from "lucide-react";
import { motion } from "motion/react"
import Image from "next/image";
import { useSession } from "next-auth/react";
import ProfileDropdown from "@/components/profile-dropdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const Nav = () => {
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
        <nav className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white backdrop-blur-md px-4 md:px-10 lg:px-28">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                {/* Logo */}
                <Link href="/" className="flex items-center font-bold text-xl text-slate-900 gap-2">
                    <Image src={'/visly.png'} alt="visly logo" width={30} height={30} />
                    <span className="hidden md:block">Visly</span>
                </Link>

                {/* CTA */}
                <div className="hidden md:flex gap-5 items-center">
                    {/* Desktop Links */}
                    <div className="text-sm font-medium text-slate-600 flex items-center gap-5">
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
                                {starsLoading ? "…" : (stars !== null ? <>{stars}</> : "-")}
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
    );
};

export default Nav;