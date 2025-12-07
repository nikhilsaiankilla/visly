"use client"

import {
    Activity,
    Ban,
    Calendar,
    Cpu,
    Globe,
    Layout,
    MapPin,
    Monitor,
    Trophy,
    UserCheck,
    Users,
    Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Image from "next/image";
import { motion } from "framer-motion";

export const DUMMY_DATA = {
    audience: {
        dau: 128,
        wau: 640,
        mau: 2100,
        stickiness: 128 / 2100, // 0.06 → 6%

        // --- 7-day daily active users (for AreaChart) ---
        dauTimeseries: [
            { day: "2025-02-01", dau: 98 },
            { day: "2025-02-02", dau: 105 },
            { day: "2025-02-03", dau: 112 },
            { day: "2025-02-04", dau: 120 },
            { day: "2025-02-05", dau: 126 },
            { day: "2025-02-06", dau: 135 },
            { day: "2025-02-07", dau: 128 },
        ],

        // --- Power Users ---
        topUsers: [
            { user_id: "user_001", events: 52 },
            { user_id: "user_014", events: 49 },
            { user_id: "user_088", events: 45 },
            { user_id: "user_031", events: 41 },
            { user_id: "user_120", events: 34 },
        ],

        // --- Retention Cohorts ---
        retention: [
            {
                cohort_date: "2025-01-29",
                totals: 50,
                retention: [50, 30, 25, 18, 12, 10, 6, 4], // Day0 → Day7
            },
            {
                cohort_date: "2025-01-30",
                totals: 42,
                retention: [42, 26, 20, 15, 9, 5, 2, 1],
            },
            {
                cohort_date: "2025-01-31",
                totals: 60,
                retention: [60, 40, 32, 24, 18, 14, 10, 7],
            },
            {
                cohort_date: "2025-02-01",
                totals: 55,
                retention: [55, 33, 27, 20, 13, 9, 5, 3],
            },
            {
                cohort_date: "2025-02-02",
                totals: 48,
                retention: [48, 29, 22, 16, 10, 6, 2, 1],
            },
        ],
    },
};

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

const page = () => {
    return (
        <div className='w-full p-10 space-y-10'>
            <div className='w-full max-w-5xl space-y-6 p-5 bg-white rounded-2xl shadow-2xl'>
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

            <div className='w-full max-w-5xl space-y-6 p-5 bg-white rounded-2xl shadow-2xl'>
                {/* --- Row 1: Core KPIs --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* DAU */}
                    <Card className="border-slate-100 shadow-sm">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Daily Active (DAU)</p>
                                <h2 className="text-3xl font-bold text-blue-600">
                                    {DUMMY_DATA?.audience?.dau ?? "—"}
                                </h2>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* WAU */}
                    <Card className="border-slate-100 shadow-sm">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Weekly Active (WAU)</p>
                                <h2 className="text-3xl font-bold text-violet-600">
                                    {DUMMY_DATA?.audience?.wau ?? "—"}
                                </h2>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-violet-50 flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-violet-600" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* MAU */}
                    <Card className="border-slate-100 shadow-sm">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Monthly Active (MAU)</p>
                                <h2 className="text-3xl font-bold text-fuchsia-600">
                                    {DUMMY_DATA.audience?.mau ?? "—"}
                                </h2>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-fuchsia-50 flex items-center justify-center">
                                <UserCheck className="h-5 w-5 text-fuchsia-600" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stickiness */}
                    <Card className="border-slate-100 shadow-sm">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Stickiness (DAU/MAU)</p>
                                <h2 className="text-3xl font-bold text-amber-500">
                                    {DUMMY_DATA.audience?.stickiness ? `${(DUMMY_DATA.audience.stickiness * 100).toFixed(1)}%` : "—"}
                                </h2>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center">
                                <Zap className="h-5 w-5 text-amber-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* --- Row 2: Charts & Lists --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* DAU Trend Chart */}
                    <div className="lg:col-span-2">
                        <Card className="h-full border-slate-100 shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-semibold text-slate-800">Growth Trend</CardTitle>
                                <p className="text-sm text-slate-400">Daily Active Users over last 7 days</p>
                            </CardHeader>
                            <CardContent className="pl-0">
                                <div className="h-[250px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={DUMMY_DATA.audience?.dauTimeseries || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorDau" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis
                                                dataKey="day"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                                dy={10}
                                                tickFormatter={(value) => value.slice(5)} // Show MM-DD
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                cursor={{ stroke: '#2563eb', strokeWidth: 1, strokeDasharray: '4 4' }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="dau"
                                                stroke="#2563eb"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorDau)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Top Users List */}
                    <div>
                        <Card className="h-full border-slate-100 shadow-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                    Power Users
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                                    {(DUMMY_DATA.audience?.topUsers || []).map((user: any, i: number) => (
                                        <div key={user.user_id} className="flex items-center justify-between pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-1.5 rounded-md ${i < 3 ? 'bg-amber-50 text-amber-500' : 'bg-slate-100 text-slate-500'}`}>
                                                    <Trophy size={14} />
                                                </div>
                                                <span className="text-sm font-medium text-slate-700 truncate w-24 sm:w-auto">
                                                    {user.user_id}
                                                </span>
                                            </div>
                                            <span className="text-sm font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full">
                                                {user.events}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* --- Row 3: Retention Heatmap --- */}
                <div className="md:col-span-3">
                    <Card className="border-slate-100 shadow-sm overflow-hidden">
                        <CardHeader className="pb-4 bg-white">
                            <CardTitle className="text-lg font-semibold text-slate-800">Retention Cohorts</CardTitle>
                            <p className="text-sm text-slate-400">Percentage of users returning after first visit</p>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto">
                            <div className="min-w-[600px] p-6 pt-0">
                                {/* Header Row */}
                                <div className="flex mb-2">
                                    <div className="w-32 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</div>
                                    <div className="w-20 text-xs font-semibold text-slate-400 text-center uppercase tracking-wider">Users</div>
                                    {[...Array(8)].map((_, i) => (
                                        <div key={i} className="flex-1 text-center text-xs font-semibold text-slate-400">
                                            {i === 0 ? 'Day 0' : `Day ${i}`}
                                        </div>
                                    ))}
                                </div>

                                {/* Data Rows */}
                                {(DUMMY_DATA.audience?.retention || []).map((cohort: any) => (
                                    <div key={cohort.cohort_date} className="flex items-center mb-1 group hover:bg-slate-50 transition-colors rounded-md p-1">
                                        <div className="w-32 text-sm font-medium text-slate-600">
                                            {cohort.cohort_date}
                                        </div>
                                        <div className="w-20 text-sm text-center text-slate-500">
                                            {cohort.totals}
                                        </div>
                                        <div className="flex-1 flex gap-1">
                                            {cohort.retention.map((val: number, dayIndex: number) => {
                                                const percentage = cohort.totals > 0 ? Math.round((val / cohort.totals) * 100) : 0;
                                                // Dynamic blue opacity based on retention %
                                                // Day 0 is always 100%, so we handle it gracefully
                                                const bgStyle = dayIndex === 0
                                                    ? 'bg-slate-100 text-slate-400'
                                                    : `bg-blue-600 text-white`;

                                                // Calculate opacity for the blue background
                                                const opacity = dayIndex === 0 ? 1 : Math.max(0.1, percentage / 100);

                                                return (
                                                    <div
                                                        key={dayIndex}
                                                        className="flex-1 h-8 rounded flex items-center justify-center text-xs font-medium transition-all"
                                                        style={{
                                                            backgroundColor: dayIndex === 0 ? '#f1f5f9' : `rgba(37, 99, 235, ${opacity})`,
                                                            color: dayIndex === 0 ? '#94a3b8' : (opacity > 0.4 ? '#fff' : '#1e3a8a')
                                                        }}
                                                        title={`${val} users (${percentage}%)`}
                                                    >
                                                        {val > 0 ? `${percentage}%` : ''}
                                                    </div>
                                                );
                                            })}
                                            {/* Fill remaining empty cells if array is short */}
                                            {[...Array(8 - (cohort.retention?.length || 0))].map((_, k) => (
                                                <div key={`empty-${k}`} className="flex-1 h-8 bg-slate-50/50 rounded" />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default page