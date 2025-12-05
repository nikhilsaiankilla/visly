"use client";

import { motion } from "framer-motion";
import {
    Activity,
    ArrowRight,
    Ban,
    Code2,
    Cpu,
    Globe,
    Layout,
    LayoutDashboard,
    MapPin,
    Monitor,
    Terminal,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from './Btn';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Image from "next/image";

// --- Framework Logos (SVG) ---
const FrameworkLogos = () => (
    <div className="w-full flex flex-wrap justify-center gap-8 md:gap-12">
        {/* React */}
        <div className="flex items-center gap-2 group cursor-pointer">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-[#61DAFB]" xmlns="http://www.w3.org/2000/svg"><path d="M12 0c-1.65 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.35-3-3-3zm0 4c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm0 16c-1.65 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.35-3-3-3zm0 4c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zM4 12c0-1.65 1.35-3 3-3s3 1.35 3 3-1.35 3-3 3-3-1.35-3-3zm4 0c0 .55-.45 1-1 1s-1-.45-1-1 .45-1 1-1 1 .45 1 1zm16 0c0-1.65-1.35-3-3-3s-3 1.35-3 3 1.35 3 3 3 3-1.35 3-3zm-4 0c0 .55.45 1 1 1s1-.45 1-1-.45-1-1-1-1 .45-1 1z" fill="none" /><circle cx="12" cy="12" r="2" fill="#61DAFB" /><g stroke="#61DAFB" strokeWidth="1" fill="none"><ellipse rx="11" ry="4.2" cx="12" cy="12" /><ellipse rx="11" ry="4.2" cx="12" cy="12" transform="rotate(60 12 12)" /><ellipse rx="11" ry="4.2" cx="12" cy="12" transform="rotate(120 12 12)" /></g></svg>
            <span className="font-semibold text-slate-600 group-hover:text-slate-900">React</span>
        </div>

        {/* Vue */}
        <div className="flex items-center gap-2 group cursor-pointer">
            <svg viewBox="0 0 24 24" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg"><path d="M2 3h3.2l6.8 11.6L18.8 3H22L12 20.4 2 3z" fill="#42b883" /><path d="M12 20.4L5.2 3h3.6l3.2 5.6L15.2 3h3.6L12 20.4z" fill="#35495e" /></svg>
            <span className="font-semibold text-slate-600 group-hover:text-slate-900">Vue</span>
        </div>

        {/* Angular */}
        <div className="flex items-center gap-2 group cursor-pointer">
            <svg viewBox="0 0 24 24" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 5.5l1.8 13.7L12 22l8.2-2.8L22 5.5 12 2zm0 2.4l5.3 11.6h-2.1l-1.1-2.8H9.9l-1.1 2.8H6.7L12 4.4zM9.9 14l2.1-5.3 2.1 5.3H9.9z" fill="#dd0031" /></svg>
            <span className="font-semibold text-slate-600 group-hover:text-slate-900">Angular</span>
        </div>

        {/* Vanilla JS */}
        <div className="flex items-center gap-2 group cursor-pointer">
            <svg viewBox="0 0 24 24" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" fill="#F7DF1E" /><path d="M6.2 16.5c.3.5.7.9 1.4.9.8 0 1.2-.4 1.2-1v-4.8h2.6v4.9c0 2-1.3 3.3-3.7 3.3-1.6 0-2.6-.7-3.2-1.6l2-1.3zm10 0c.3.5.8.9 1.6.9 1 0 1.5-.4 1.5-1.1 0-.7-.4-1-1.3-1.4l-.8-.3c-1.5-.6-2.5-1.4-2.5-3.1 0-1.8 1.4-3.1 3.4-3.1 1.5 0 2.5.7 3 1.5l-1.8 1.2c-.3-.4-.6-.6-1.2-.6-.7 0-1.1.3-1.1.9 0 .6.3.8 1.3 1.2l.8.3c1.7.7 2.6 1.5 2.6 3.2 0 1.9-1.4 3.2-3.6 3.2-1.8 0-2.9-.8-3.4-1.7l2.2-1.3z" fill="#000" /></svg>
            <span className="font-semibold text-slate-600 group-hover:text-slate-900">Vanilla JS</span>
        </div>
    </div>
);

export const dummyAnalytics = {
    data: {
        device: [
            { device_type: "Mobile", cnt: 120 },
            { device_type: "Desktop", cnt: 80 },
            { device_type: "Tablet", cnt: 25 },
        ],

        os: [
            { os: "Windows", cnt: 90 },
            { os: "macOS", cnt: 60 },
            { os: "Linux", cnt: 20 },
            { os: "Android", cnt: 40 },
            { os: "iOS", cnt: 30 },
        ],

        browsers: [
            { browser: "Chrome", version: "120", cnt: 140 },
            { browser: "Safari", version: "17", cnt: 60 },
            { browser: "Firefox", version: "119", cnt: 25 },
            { browser: "Edge", version: "120", cnt: 30 },
        ],

        countries: [
            { country: "US", cnt: 100 },
            { country: "IN", cnt: 80 },
            { country: "GB", cnt: 40 },
            { country: "CA", cnt: 25 },
            { country: "AU", cnt: 20 },
        ],

        cities: [
            { city: "New York", cnt: 40 },
            { city: "Mumbai", cnt: 30 },
            { city: "London", cnt: 25 },
            { city: "Toronto", cnt: 20 },
        ],

        latency: {
            avg_ms: 123.45,
            p50_ms: 90,
            p95_ms: 220,
        },

        eps: [
            { ts: "2025-02-05 10:00", events: 20 },
            { ts: "2025-02-05 10:01", events: 35 },
            { ts: "2025-02-05 10:02", events: 42 },
            { ts: "2025-02-05 10:03", events: 50 },
            { ts: "2025-02-05 10:04", events: 30 },
            { ts: "2025-02-05 10:05", events: 55 },
        ],
    },
};

const Hero = () => {
    const steps = [
        {
            icon: <Terminal className="w-6 h-6 text-[#6A8E58]" />,
            title: "Install Package",
            desc: "Run npm i visly in your project terminal."
        },
        {
            icon: <Code2 className="w-6 h-6 text-[#6A8E58]" />,
            title: "Wrap Provider",
            desc: "Add <VislyProvider /> to your root layout."
        },
        {
            icon: <LayoutDashboard className="w-6 h-6 text-[#6A8E58]" />,
            title: "View Dashboard",
            desc: "Deploy and see data start flowing instantly."
        }
    ];

    return (
        <div className="bg-white min-h-screen font-sans">
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-12 pb-6 lg:pt-20 lg:pb-10 bg-white px-4 md:px-10 lg:px-28">
                {/* 1. Text Content - Centered */}
                <div className="container mx-auto px-4 md:px-6 flex flex-col items-center text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col gap-6 items-center max-w-3xl"
                    >
                        <div className="inline-flex items-center rounded-full border border-green-600/30 bg-green-600/10 px-3 py-1 text-sm font-medium text-green-600 w-fit">
                            <span className="flex h-2 w-2 rounded-full bg-[#6A8E58] mr-2"></span>
                            v1.0 is live
                        </div>

                        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
                            The One-Line Analytics Solution for <span className="text-green-600">the Modern Web</span>
                        </h1>

                        <p className="text-lg text-slate-500 max-w-[600px]">
                            Stop wrestling with complex configurations. Install Visly, wrap your provider, and get instant insights on graphs, bounce rates, and traffic.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 mt-2 justify-center">
                            <Link href={'/login'}>
                                <Button className="h-12 px-8 text-base cursor-pointer group bg-green-600 text-white hover:bg-green-600/90">
                                    Start for free
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </Link>
                            <Link href={'/docs'}>
                                <Button variant="outline" className="h-12 px-8 text-base group cursor-pointer border-slate-200 hover:bg-slate-50">
                                    Read the Docs
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* 2. The 3D Perspective Images - "Laying on floor" */}
            <div className="w-full mt-16 flex justify-center px-4">
                {/* The Container for the Tilt */}
                <motion.div
                    initial={{ opacity: 0, rotateX: 0, y: 50 }}
                    animate={{ opacity: 1, rotateX: 25, y: 0 }} // rotateX(25) creates the "floor" look
                    transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
                    className="relative w-full max-w-5xl aspect-square perspective-[2000px] transform-3d"
                >
                    <div className="space-y-6 w-full absolute inset-0 shadow-2xl border border-green-600/10 rounded-2xl mask-r-from-3.5 mask-b-from-2.5"
                        style={{
                            transform: 'rotateX(20deg) rotateY(-10deg) rotateZ(-35deg)'
                        }}
                    >
                        {/* --- Section 1: Technology Breakdown (3 Columns) --- */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* 1. Device Distribution (Donut Chart) */}
                            <Card className="border-slate-100 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg font-semibold text-slate-800">Devices</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {(dummyAnalytics?.data?.device || []).length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-[250px] text-slate-400">
                                            <Monitor className="h-8 w-8 mb-2 opacity-20" />
                                            <p className="text-sm">No device data</p>
                                        </div>
                                    ) : (
                                        <div className="h-[250px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={dummyAnalytics?.data?.device || []}
                                                        dataKey="cnt"
                                                        nameKey="device_type"
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        // Only add padding if multiple segments exist to avoid gaps in full circles
                                                        paddingAngle={(dummyAnalytics.data?.device || []).length > 1 ? 5 : 0}
                                                    >
                                                        {(dummyAnalytics.data?.device || []).map((entry: any, index: number) => {
                                                            const colors = ['#3b82f6', '#8b5cf6', '#10b981']; // Blue, Violet, Emerald
                                                            return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                                                        })}
                                                    </Pie>
                                                    <Tooltip
                                                        cursor={{ fill: 'transparent' }}
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                    />
                                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* 2. OS Distribution (Bar Chart) */}
                            <Card className="border-slate-100 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg font-semibold text-slate-800">Operating System</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {(dummyAnalytics.data?.os || []).length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-[250px] text-slate-400">
                                            <Cpu className="h-8 w-8 mb-2 opacity-20" />
                                            <p className="text-sm">No OS data</p>
                                        </div>
                                    ) : (
                                        <div className="h-[250px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart
                                                    data={dummyAnalytics.data?.os || []}
                                                    layout="vertical"
                                                    margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                                    <XAxis type="number" hide />
                                                    <YAxis
                                                        dataKey="os"
                                                        type="category"
                                                        width={70}
                                                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                    />
                                                    <Tooltip
                                                        cursor={{ fill: '#f8fafc' }}
                                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                    />
                                                    <Bar
                                                        dataKey="cnt"
                                                        fill="#6366f1" // Indigo
                                                        radius={[0, 4, 4, 0]}
                                                        barSize={24}
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* 3. Browser List (Clean List) */}
                            <Card className="border-slate-100 shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-semibold text-slate-800">Browsers</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {(dummyAnalytics.data?.browsers || []).length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-[200px] text-slate-400">
                                            <Layout className="h-8 w-8 mb-2 opacity-20" />
                                            <p className="text-sm">No browser data</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                            {(dummyAnalytics.data?.browsers || []).map((b: any) => (
                                                <div key={b.browser + b.version} className="flex items-center justify-between pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
                                                            <Globe size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-700">{b.browser}</p>
                                                            <p className="text-xs text-slate-400">v{b.version}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-800">{b.cnt.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* --- Section 2: Geo & Ops (Mixed Grid) --- */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Geo: Countries & Cities */}
                            <Card className="border-slate-100 shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                        Top Countries
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {(dummyAnalytics.data?.countries || []).length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-[250px] text-slate-400">
                                            <Ban className="h-8 w-8 mb-2 opacity-20" />
                                            <p className="text-sm">No location data</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-4">
                                                {(dummyAnalytics.data?.countries || []).slice(0, 5).map((c: any) => (
                                                    <div key={c.country} className="flex items-center justify-between pb-2">
                                                        <div className="flex items-center gap-3">
                                                            {/* Flag CDN */}
                                                            <Image
                                                                src={`https://flagcdn.com/24x18/${c.country.toLowerCase()}.png`}
                                                                alt={c.country}
                                                                width={20}
                                                                height={20}
                                                                unoptimized
                                                                className="h-4 w-8 object-cover shadow-sm"
                                                                onError={(e) => (e.currentTarget.style.display = 'none')}
                                                            />
                                                            <span className="text-sm font-medium text-slate-700">{c.country}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-emerald-500 rounded-full"
                                                                    style={{ width: `${Math.min((c.cnt / (dummyAnalytics.data?.countries[0]?.cnt || 1)) * 100, 100)}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs font-bold text-slate-600 w-8 text-right">{c.cnt}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-6 pt-4 border-t border-slate-100">
                                                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Top Cities</h4>
                                                <div className="space-y-3">
                                                    {(dummyAnalytics.data?.cities || []).slice(0, 3).map((city: any) => (
                                                        <div key={city.city} className="flex items-center justify-between text-sm">
                                                            <div className="flex items-center gap-2 text-slate-600">
                                                                <MapPin size={12} className="text-slate-400" />
                                                                <span className="truncate">{city.city}</span>
                                                            </div>
                                                            <span className="font-medium text-slate-800">{city.cnt}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Ops: Latency & EPS (Spans 2 Columns) */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Latency Cards */}
                                <div className="grid grid-cols-3 gap-4">
                                    <Card className="bg-slate-50 border-slate-100 shadow-none">
                                        <CardContent className="p-4 text-center">
                                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Avg Latency</p>
                                            <p className="text-xl sm:text-2xl font-bold text-slate-700">
                                                {dummyAnalytics.data?.latency?.avg_ms ? Math.round(dummyAnalytics.data.latency.avg_ms) : '—'}ms
                                            </p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-slate-50 border-slate-100 shadow-none">
                                        <CardContent className="p-4 text-center">
                                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">P50</p>
                                            <p className="text-xl sm:text-2xl font-bold text-emerald-600">{dummyAnalytics.data?.latency?.p50_ms ?? '—'}ms</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-slate-50 border-slate-100 shadow-none">
                                        <CardContent className="p-4 text-center">
                                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">P95</p>
                                            <p className="text-xl sm:text-2xl font-bold text-amber-500">{dummyAnalytics.data?.latency?.p95_ms ?? '—'}ms</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* EPS Chart */}
                                <Card className="border-slate-100 shadow-sm flex-1">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                                <Activity className="h-4 w-4 text-rose-500" />
                                                Events Per Second (EPS)
                                            </CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pl-0">
                                        {(dummyAnalytics.data?.eps || []).length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-[220px] text-slate-400">
                                                <Activity className="h-8 w-8 mb-2 opacity-20" />
                                                <p className="text-sm">No traffic data</p>
                                            </div>
                                        ) : (
                                            <div className="h-[220px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={dummyAnalytics.data?.eps || []} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                        <XAxis
                                                            dataKey="ts"
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                                                            dy={10}
                                                            tickFormatter={(t) => {
                                                                if (!t) return "";
                                                                const parts = t.split(' ');
                                                                return parts.length > 1 ? parts[1].slice(0, 5) : t;
                                                            }}
                                                        />
                                                        <YAxis
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                                                        />
                                                        <Tooltip
                                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                                            cursor={{ stroke: '#f43f5e', strokeWidth: 1 }}
                                                        />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="events"
                                                            stroke="#f43f5e" // Rose-500
                                                            strokeWidth={3}
                                                            // Show dots if data points are sparse (<5) so single points are visible
                                                            dot={(dummyAnalytics.data?.eps || []).length < 5}
                                                            activeDot={{ r: 6, fill: '#f43f5e' }}
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="w-full mt-20 border-t border-slate-100 pt-10 pb-10">
                <p className="text-xs text-center font-semibold text-slate-400 uppercase tracking-wider mb-6">Works seamlessly with</p>
                <FrameworkLogos />
            </div>

            {/* <footer className="border-t border-slate-100 bg-white py-12">
                <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Flower2 className="h-5 w-5 text-[#6A8E58]" />
                        <span className="font-bold text-slate-900">Visly</span>
                    </div>
                    <div className="text-sm text-slate-500">
                        © {new Date().getFullYear()} Visly Inc. All rights reserved.
                    </div>
                    <div className="flex gap-6 text-slate-400">
                        <Link href="#" className="hover:text-slate-900 transition-colors">Twitter</Link>
                        <Link href="#" className="hover:text-slate-900 transition-colors">GitHub</Link>
                        <Link href="#" className="hover:text-slate-900 transition-colors">Discord</Link>
                    </div>
                </div>
            </footer> */}
        </div>
    );
};

export default Hero;


//  <div className="rounded-xl bg-[#1e293b] shadow-2xl border border-slate-700 overflow-hidden">
//                                 <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700 bg-[#0f172a]">
//                                     <div className="h-3 w-3 rounded-full bg-red-500" />
//                                     <div className="h-3 w-3 rounded-full bg-yellow-500" />
//                                     <div className="h-3 w-3 rounded-full bg-green-500" />
//                                     <span className="ml-2 text-xs text-slate-400 font-mono">layout.js</span>
//                                 </div>
//                                 <div className="p-6 overflow-x-auto">
//                                     <pre className="font-mono text-sm leading-relaxed text-slate-300">
//                                         <code>
//                                             <span className="text-purple-400">import</span>{" "}
//                                             <span className="text-yellow-300">{`{ VislyProvider }`}</span>{" "}
//                                             <span className="text-purple-400">from</span>{" "}
//                                             <span className="text-green-400">'visly'</span>;
//                                             {"\n\n"}
//                                             <span className="text-purple-400">export default function</span>{" "}
//                                             <span className="text-blue-400">RootLayout</span>
//                                             <span className="text-yellow-300">{`({ children })`}</span>{" "}
//                                             {"{"}
//                                             {"\n  "}<span className="text-purple-400">return</span> (
//                                             {"\n    "}&lt;<span className="text-yellow-300">VislyProvider</span> <span className="text-blue-300">apiKey</span>=<span className="text-green-400">"KEY"</span>&gt;
//                                             {"\n      "}<span className="text-slate-400">{`{children}`}</span>
//                                             {"\n    "}&lt;/<span className="text-yellow-300">VislyProvider</span>&gt;
//                                             {"\n  "});
//                                             {"\n}"}
//                                         </code>
//                                     </pre>
//                                 </div>
//                             </div>