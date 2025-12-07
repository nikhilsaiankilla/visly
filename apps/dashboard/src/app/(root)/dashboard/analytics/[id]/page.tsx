"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, ArrowRight, ArrowRightCircle, ArrowUpRight, Ban, Calendar, Check, Clock, Copy, Cpu, Eye, Filter, Globe, Hash, Layout, Loader, LogIn, Mail, MapPin, Megaphone, Monitor, MousePointer2, MousePointerClick, Repeat, Trash, TrendingDown, Trophy, UserCheck, UserPlus, Users, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { formatError } from "@/utils/utils";
import { toast } from "sonner";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { CopyInput } from "@/app/components/copy-input";

export default function Page() {
    const params = useParams();
    let id = (params as any)?.id ?? "unknown";
    const router = useRouter();

    // Range: days (1..30)
    const [days, setDays] = useState<number>(7);
    const [customDaysInput, setCustomDaysInput] = useState<string>("7");
    const [delLoading, setDelLoading] = useState<boolean>(false)
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState('')

    // Tabs (controlled)
    const [activeTab, setActiveTab] = useState<string>("overview");

    // Loading / error / data states per category
    const [loading, setLoading] = useState<Record<string, boolean>>({
        overview: false,
        engagement: false,
        behavior: false,
        acquisition: false,
        audience: false,
        tech_geo_ops: false,
    });

    const [error, setError] = useState<Record<string, string | null>>({
        overview: null,
        engagement: null,
        behavior: null,
        acquisition: null,
        audience: null,
        tech_geo_ops: null,
    });

    const [data, setData] = useState<Record<string, any>>({
        overview: null,
        engagement: null,
        behavior: null,
        acquisition: null,
        audience: null,
        tech_geo_ops: null,
    });

    // helper: clamp days 1..30
    const clampDays = (n: number) => Math.max(1, Math.min(30, Math.floor(n)));

    // preset handler
    const applyPreset = (d: number) => {
        const c = clampDays(d);
        setDays(c);
        setCustomDaysInput(String(c));
    };

    // custom input handler (applies when user presses Enter or clicks Apply)
    const applyCustomDays = () => {
        const parsed = Number(customDaysInput || 0);
        if (!Number.isFinite(parsed) || parsed <= 0) {
            setCustomDaysInput(String(days));
            return;
        }
        const c = clampDays(parsed);
        setDays(c);
        setCustomDaysInput(String(c));
    };

    // fetch a single category endpoint
    const fetchCategory = useCallback(
        async (category: string) => {
            setLoading((s) => ({ ...s, [category]: true }));
            setError((s) => ({ ...s, [category]: null }));

            try {
                const url = `/api/project/analytics/${encodeURIComponent(id)}/${category}?range=${days}`;
                const res = await fetch(url, { cache: "no-store" });
                if (!res.ok) {
                    const txt = await res.text().catch(() => res.statusText);
                    throw new Error(txt || `HTTP ${res.status}`);
                }

                const json = await res.json();

                if (!json?.ok) throw new Error(json?.error ?? "invalid response");
                setData((d) => ({ ...d, [category]: json.data }));
            } catch (err: unknown) {
                setError((s) => ({ ...s, [category]: formatError(err) }));
                setData((d) => ({ ...d, [category]: null }));
            } finally {
                setLoading((s) => ({ ...s, [category]: false }));
            }
        },
        [id, days]
    );

    // called when activeTab or days or id changes
    useEffect(() => {
        // fetch only the active tab for responsiveness
        fetchCategory(activeTab);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, days, id]);

    // small refresh for current tab
    const refreshCurrent = () => fetchCategory(activeTab);

    // Prefill sample overview locally so UI shows without network (optional)
    useEffect(() => {
        // only if no real data yet
        if (!data.overview) {
            setData((d) => ({
                ...d,
                overview: {
                    totals: { total_events: 1234, pageviews: 987, clicks: 247 },
                    uniques: { users: 432, sessions: 321 },
                    timeseries: [{ day: "2025-12-01", events: 400 }, { day: "2025-12-02", events: 834 }],
                    topPages: [{ path: "/", pageviews: 400 }, { path: "/pricing", pageviews: 120 }],
                    topReferrers: [{ referrer: "https://google.com", cnt: 300 }],
                },
            }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDelLoading(true)
        try {
            if (!value) {
                toast.error("Type DELETE to continue.");
                setDelLoading(false)
                return
            }

            if (value !== "DELETE") {
                toast.error("The confirmation text must be exactly: DELETE");
                setDelLoading(false)
                return
            }

            const res = await fetch(`/api/project?id=${id}`, {
                method: 'DELETE'
            })

            if (!res.ok) {
                setDelLoading(false);
                return toast.error('something went wrong please try again')
            }

            const json = await res.json();

            if (!json.ok) {
                setDelLoading(false);
                return toast.error(json.error)
            }

            router.push('/dashboard')
            setDelLoading(false)
            toast.success(json.message);
        } catch (error: unknown) {
            setDelLoading(false);
            return toast.error(formatError(error))
        }
    };

    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('Project Id Copied!')
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 w-full py-8">
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl font-bold">Analytics </h1>

                {/* Range controls */}
                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleCopy}
                        className="bg-green-600 hover:bg-green-600/95 cursor-pointer"
                    >   
                    Copy Project Id
                        {copied ? (
                            <Check size={16} className="text-white" />
                        ) : (
                            <Copy size={16} className="text-white" />
                        )}
                    </Button>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant={'outline'}
                            className={`px-3 py-1 rounded ${days === 7 ? "bg-green-600 text-white" : "border"}`}
                            onClick={() => applyPreset(7)}
                        >
                            7d
                        </Button>
                        <Button
                            variant={'outline'}
                            className={`px-3 py-1 rounded ${days === 14 ? "bg-green-600 text-white" : "border"}`}
                            onClick={() => applyPreset(14)}
                        >
                            14d
                        </Button>
                        <Button
                            variant={'outline'}
                            className={`px-3 py-1 rounded ${days === 30 ? "bg-green-600 text-white" : "border"}`}
                            onClick={() => applyPreset(30)}
                        >
                            30d
                        </Button>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Input
                            type="number"
                            min={1}
                            max={30}
                            value={customDaysInput}
                            onChange={(e) => setCustomDaysInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") applyCustomDays();
                            }}
                            className="w-20 px-2 py-1 border rounded"
                            aria-label="Custom range days (1-30)"
                        />
                        <Button
                            variant={'outline'}
                            onClick={applyCustomDays}
                            className="px-3 py-1 rounded border"
                            title="Apply custom range (1-30 days)"
                        >
                            Apply
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant={'outline'}
                            onClick={refreshCurrent}
                            className="px-3 py-1 rounded border flex items-center gap-2"
                            title="Refresh current tab"
                        >
                            <span className="text-sm">Refresh</span>
                            <Loader size={14} />
                        </Button>
                    </div>

                    <Button
                        variant={'outline'}
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setOpen(true);
                        }}
                        className="px-3 py-1 rounded border flex items-center gap-2 text-red-600 hover:text-white hover:bg-red-600 transaction-all duration-250 ease-in"
                        title="Delete Project"
                    >
                        {
                            delLoading ? <Loader className="animate-spin" size={14} /> : <Trash size={14} />
                        }
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)} defaultValue="overview">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="engagement">Engagement</TabsTrigger>
                    <TabsTrigger value="behavior">Behavior</TabsTrigger>
                    <TabsTrigger value="acquisition">Acquisition</TabsTrigger>
                    <TabsTrigger value="audience">Audience</TabsTrigger>
                    <TabsTrigger value="tech_geo_ops">Tech / Geo / Ops</TabsTrigger>
                </TabsList>

                {/* ------------------ Overview ------------------ */}
                <TabsContent value="overview" className="space-y-6">
                    {loading.overview ? (
                        <div className="flex h-64 items-center justify-center text-slate-400">
                            <Loader className="animate-spin" />
                        </div>
                    ) : error.overview ? (
                        <div className="p-4 rounded-lg bg-red-50 text-red-500 border border-red-100">
                            {error.overview}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* --- Top Metrics --- */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Total Events */}
                                <Card className="border-slate-100 shadow-sm">
                                    <CardContent className="p-6 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-500 mb-1">Total events</p>
                                            <h2 className="text-3xl font-bold text-indigo-600">
                                                {data.overview?.totals?.total_events ?? "—"}
                                            </h2>
                                        </div>
                                        <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center">
                                            <Activity className="h-5 w-5 text-indigo-500" />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Pageviews */}
                                <Card className="border-slate-100 shadow-sm">
                                    <CardContent className="p-6 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-500 mb-1">Pageviews</p>
                                            <h2 className="text-3xl font-bold text-emerald-500">
                                                {data.overview?.totals?.pageviews ?? "—"}
                                            </h2>
                                        </div>
                                        <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center">
                                            <Eye className="h-5 w-5 text-emerald-500" />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Clicks */}
                                <Card className="border-slate-100 shadow-sm">
                                    <CardContent className="p-6 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-500 mb-1">Clicks</p>
                                            <h2 className="text-3xl font-bold text-rose-500">
                                                {data.overview?.totals?.clicks ?? "—"}
                                            </h2>
                                        </div>
                                        <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center">
                                            <MousePointer2 className="h-5 w-5 text-rose-500" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* --- Chart Section --- */}
                                <div className="lg:col-span-2">
                                    <Card className="h-full border-slate-100 shadow-sm">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-lg font-semibold text-slate-800">
                                                Timeseries (last {days} days)
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pl-0">
                                            <div className="h-[300px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={data.overview?.timeseries || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                        <defs>
                                                            <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                        <XAxis
                                                            dataKey="day"
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                                                            dy={10}
                                                        />
                                                        <YAxis
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                                                        />
                                                        <Tooltip
                                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                            itemStyle={{ color: '#6366f1', fontWeight: 'bold' }}
                                                            cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                                        />
                                                        <Area
                                                            type="monotone"
                                                            dataKey="events"
                                                            stroke="#6366f1"
                                                            strokeWidth={3}
                                                            fillOpacity={1}
                                                            fill="url(#colorEvents)"
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* --- Lists Section --- */}
                                <div className="space-y-6">
                                    {/* Top Pages */}
                                    <Card className="border-slate-100 shadow-sm">
                                        <CardHeader className="pb-4">
                                            <CardTitle className="text-lg font-semibold text-slate-800">Top pages</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {(data.overview?.topPages || []).map((p: any) => (
                                                    <div key={p.path} className="flex items-center justify-between pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className="p-1.5 bg-slate-100 rounded-md text-slate-500">
                                                                <ArrowUpRight size={14} />
                                                            </div>
                                                            <span className="text-sm font-medium text-slate-700 truncate">{p.path}</span>
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full">
                                                            {p.pageviews}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Top Referrers */}
                                    <Card className="border-slate-100 shadow-sm">
                                        <CardHeader className="pb-4">
                                            <CardTitle className="text-lg font-semibold text-slate-800">Top referrers</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {(data.overview?.topReferrers || []).length === 0 ? (
                                                    <div className="flex flex-col items-center justify-center py-4 text-center">
                                                        <Globe className="h-6 w-6 text-slate-200 mb-2" />
                                                        <p className="text-xs text-slate-400">No referrer data</p>
                                                    </div>
                                                ) : (
                                                    (data.overview?.topReferrers || []).map((r: any) => (
                                                        <div key={r.referrer} className="flex items-center justify-between pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                                                            <span className="text-sm font-medium text-slate-600 truncate">{r.referrer}</span>
                                                            <span className="text-sm font-bold text-slate-800">{r.cnt}</span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    )}
                </TabsContent>

                {/* ------------------ Engagement ------------------ */}
                <TabsContent value="engagement" className="space-y-6">
                    {loading.engagement ? (
                        <div className="flex h-64 items-center justify-center text-slate-400">
                            <Loader className="animate-spin" />
                        </div>
                    ) : error.engagement ? (
                        <div className="p-4 rounded-lg bg-red-50 text-red-500 border border-red-100">
                            {error.engagement}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* --- Engagement Metrics --- */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                                {/* Metric: Avg Session Duration */}
                                <Card className="border-slate-100 shadow-sm">
                                    <CardContent className="p-6 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-500 mb-1">Avg session duration</p>
                                            <h2 className="text-3xl font-bold text-amber-500">
                                                {data.engagement?.avgSessionSeconds ? `${Number(data.engagement.avgSessionSeconds).toFixed(1)}s` : "—"}
                                            </h2>
                                        </div>
                                        <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center">
                                            <Clock className="h-5 w-5 text-amber-500" />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Metric: Bounce Rate */}
                                <Card className="border-slate-100 shadow-sm">
                                    <CardContent className="p-6 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-500 mb-1">Bounce rate</p>
                                            <h2 className="text-3xl font-bold text-violet-600">
                                                {data.engagement?.bounceRatePercent !== undefined ? `${data.engagement.bounceRatePercent}%` : "—"}
                                            </h2>
                                        </div>
                                        <div className="h-10 w-10 rounded-full bg-violet-50 flex items-center justify-center">
                                            <TrendingDown className="h-5 w-5 text-violet-600" />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Metric: Events per Session */}
                                <Card className="border-slate-100 shadow-sm">
                                    <CardContent className="p-6 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-500 mb-1">Events / session</p>
                                            <h2 className="text-3xl font-bold text-cyan-500">
                                                {data.engagement?.eventsPerSession ?? "—"}
                                            </h2>
                                        </div>
                                        <div className="h-10 w-10 rounded-full bg-cyan-50 flex items-center justify-center">
                                            <Zap className="h-5 w-5 text-cyan-500" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                {/* --- Chart: Session Depth (Distribution) --- */}
                                <div className="lg:col-span-2">
                                    <Card className="h-full border-slate-100 shadow-sm">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-lg font-semibold text-slate-800">Session Depth</CardTitle>
                                            <p className="text-sm text-slate-400">Distribution of events per session</p>
                                        </CardHeader>
                                        <CardContent className="pl-0">
                                            <div className="h-[300px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={data.engagement?.eventsPerSessionDistribution || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                        <XAxis
                                                            dataKey="events_in_session"
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                                                            label={{ value: 'Events in Session', position: 'insideBottom', offset: -5, fill: '#94a3b8', fontSize: 12 }}
                                                            dy={10}
                                                        />
                                                        <YAxis
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                                                        />
                                                        <Tooltip
                                                            cursor={{ fill: '#f8fafc' }}
                                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                        />
                                                        <Bar
                                                            dataKey="sessions"
                                                            fill="#06b6d4" // Cyan-500 to match the metric card
                                                            radius={[4, 4, 0, 0]}
                                                            barSize={40}
                                                        />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* --- List: Top Entry Pages --- */}
                                <div>
                                    <Card className="h-full border-slate-100 shadow-sm">
                                        <CardHeader className="pb-4">
                                            <CardTitle className="text-lg font-semibold text-slate-800">Top entry pages</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {(data.engagement?.topEntryPages || []).length === 0 ? (
                                                    <div className="text-center py-8 text-slate-400 text-sm">No entry data available</div>
                                                ) : (
                                                    data.engagement.topEntryPages.map((p: any) => (
                                                        <div key={p.path} className="flex items-center justify-between pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <div className="p-1.5 bg-slate-100 rounded-md text-slate-500">
                                                                    <LogIn size={14} />
                                                                </div>
                                                                <span className="text-sm font-medium text-slate-700 truncate">{p.path}</span>
                                                            </div>
                                                            <span className="text-sm font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full">
                                                                {p.sessions}
                                                            </span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                            </div>
                        </div>
                    )}
                </TabsContent>

                {/* ------------------ Behavior ------------------ */}
                <TabsContent value="behavior" className="space-y-6">
                    {loading.behavior ? (
                        <div className="flex h-64 items-center justify-center text-slate-400">
                            <Loader className="animate-spin" />
                        </div>
                    ) : error.behavior ? (
                        <div className="p-4 rounded-lg bg-red-50 text-red-500 border border-red-100">
                            {error.behavior}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                            {/* --- Funnel Section (Spans full width on mobile, half on large) --- */}
                            <div className="lg:col-span-2">
                                <Card className="border-slate-100 shadow-sm">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-lg font-semibold text-slate-800">Conversion Funnel</CardTitle>
                                                <p className="text-sm text-slate-400">Session progression from view to signup</p>
                                            </div>
                                            <div className="p-2 bg-indigo-50 rounded-full">
                                                <Filter className="h-5 w-5 text-indigo-500" />
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[250px] w-full mt-4">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart
                                                    layout="vertical"
                                                    data={[
                                                        { name: 'Pageviews', value: data.behavior?.funnels?.step_pageview_sessions || 0, fill: '#6366f1' }, // Indigo
                                                        { name: 'Clicks', value: data.behavior?.funnels?.step_click_sessions || 0, fill: '#8b5cf6' },    // Violet
                                                        { name: 'Signups', value: data.behavior?.funnels?.step_signup_sessions || 0, fill: '#ec4899' },  // Pink
                                                    ]}
                                                    margin={{ top: 0, right: 30, left: 20, bottom: 0 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                                    <XAxis type="number" hide />
                                                    <YAxis
                                                        dataKey="name"
                                                        type="category"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        width={100}
                                                        tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }}
                                                    />
                                                    <Tooltip
                                                        cursor={{ fill: '#f8fafc' }}
                                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                    />
                                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                                                        {/* Optional: Render distinct colors for each bar using Cell if preferred, currently mapped via data.fill */}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* --- User Flows --- */}
                            <Card className="border-slate-100 shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                        User flows
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {(data.behavior?.topNextPages || []).length === 0 ? (
                                            <div className="text-center py-6 text-slate-400 text-sm">No flow data available</div>
                                        ) : (
                                            data.behavior.topNextPages.map((flow: any, i: number) => (
                                                <div key={i} className="flex items-center justify-between pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                                                    <div className="flex items-center gap-2 overflow-hidden w-full">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs text-slate-400 truncate text-right">{flow.prev}</p>
                                                        </div>
                                                        <ArrowRight className="h-4 w-4 text-slate-300 shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-slate-700 truncate">{flow.next}</p>
                                                        </div>
                                                    </div>
                                                    <span className="ml-4 text-sm font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                                                        {flow.cnt}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* --- Click Targets --- */}
                            <Card className="border-slate-100 shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                        Click targets
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {(data.behavior?.clickTargets || []).length === 0 ? (
                                            <div className="text-center py-6 text-slate-400 text-sm">No click data available</div>
                                        ) : (
                                            data.behavior.clickTargets.map((target: any, i: number) => (
                                                <div key={i} className="flex items-center justify-between pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="p-1.5 bg-rose-50 rounded-md text-rose-500">
                                                            <MousePointerClick size={14} />
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-700 truncate">
                                                            {target.element_id || target.event || "Unknown Element"}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm font-bold text-rose-500">
                                                        {target.cnt}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </TabsContent>

                {/* ------------------ Acquisition ------------------ */}
                <TabsContent value="acquisition" className="space-y-6">
                    {loading.acquisition ? (
                        <div className="flex h-64 items-center justify-center text-slate-400">
                            <Loader className="animate-spin" />
                        </div>
                    ) : error.acquisition ? (
                        <div className="p-4 rounded-lg bg-red-50 text-red-500 border border-red-100">
                            {error.acquisition}
                        </div>
                    ) : (
                        <div className="space-y-6">

                            {/* --- Row 1: High Level User Mix (New vs Returning) --- */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Metric Cards */}
                                <Card className="border-slate-100 shadow-sm">
                                    <CardContent className="p-6 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-500 mb-1">New Users</p>
                                            <h2 className="text-3xl font-bold text-blue-600">
                                                {data.acquisition?.newVsReturning?.new_users ?? "—"}
                                            </h2>
                                        </div>
                                        <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                                            <UserPlus className="h-5 w-5 text-blue-600" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-slate-100 shadow-sm">
                                    <CardContent className="p-6 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-500 mb-1">Returning Users</p>
                                            <h2 className="text-3xl font-bold text-indigo-600">
                                                {data.acquisition?.newVsReturning?.returning_users ?? "—"}
                                            </h2>
                                        </div>
                                        <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center">
                                            <Repeat className="h-5 w-5 text-indigo-600" />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Donut Chart Visualization */}
                                <Card className="border-slate-100 shadow-sm">
                                    <CardContent className="p-2 h-[120px] relative flex items-center justify-center">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'New', value: data.acquisition?.newVsReturning?.new_users || 0 },
                                                        { name: 'Returning', value: data.acquisition?.newVsReturning?.returning_users || 0 },
                                                    ]}
                                                    innerRadius={28}
                                                    outerRadius={42}
                                                    paddingAngle={3}
                                                    dataKey="value"
                                                    labelLine={false}
                                                    label={({ name, percent = 0 }) =>
                                                        (typeof percent === 'number' && percent > 0) ? `${name} ${Math.round(percent * 100)}%` : ""
                                                    }
                                                >
                                                    <Cell fill="#2563eb" />   {/* Blue-600 */}
                                                    <Cell fill="#4f46e5" />   {/* Indigo-600 */}
                                                </Pie>

                                                <Tooltip
                                                    formatter={(value, name) => [`${value}`, name]}
                                                    contentStyle={{
                                                        borderRadius: '6px',
                                                        border: '1px solid #e5e7eb',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                                        fontSize: '12px',
                                                    }}
                                                />

                                                <Legend
                                                    verticalAlign="bottom"
                                                    align="center"
                                                    iconSize={8}
                                                    wrapperStyle={{
                                                        fontSize: '10px',
                                                        paddingTop: '4px',
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>

                                        {/* Title kept inside card slight below chart */}
                                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-slate-400 text-center">
                                            User Ratio
                                        </div>
                                    </CardContent>
                                </Card>

                            </div>

                            {/* --- Row 2: Sources & Conversions --- */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                                {/* 1. Top UTM Sources List */}
                                <Card className="border-slate-100 shadow-sm">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                            Top Sources
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {(data.acquisition?.utmSources || []).map((source: any) => (
                                                <div key={source.utm_source} className="flex items-center justify-between pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-50 border border-slate-100 overflow-hidden">
                                                            <SourceIcon source={source.utm_source} />
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-700 capitalize">
                                                            {source.utm_source === '(none)' ? 'Direct / None' : source.utm_source}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                                                            <div
                                                                className="h-full bg-blue-500 rounded-full"
                                                                style={{ width: `${Math.min((source.cnt / (data.acquisition?.utmSources[0]?.cnt || 1)) * 100, 100)}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-800 w-12 text-right">
                                                            {source.cnt}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* 2. Conversions by Source (Bar Chart) */}
                                <Card className="border-slate-100 shadow-sm">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg font-semibold text-slate-800">Conversions</CardTitle>
                                        <p className="text-sm text-slate-400">Which sources are driving value?</p>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[300px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart
                                                    data={data.acquisition?.conversionsByUtm || []}
                                                    layout="vertical"
                                                    margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                                    <XAxis type="number" hide />
                                                    <YAxis
                                                        dataKey="utm_source"
                                                        type="category"
                                                        width={80}
                                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                    />
                                                    {/* <RechartsTooltip
                                                        cursor={{ fill: '#f8fafc' }}
                                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                                    /> */}
                                                    <Bar
                                                        dataKey="conversions"
                                                        fill="#10b981" // Emerald-500
                                                        radius={[0, 4, 4, 0]}
                                                        barSize={24}
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* --- Row 3: Mediums & Campaigns --- */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Mediums */}
                                <Card className="border-slate-100 shadow-sm">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-lg font-semibold text-slate-800">Traffic Mediums</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2">
                                            {(data.acquisition?.utmMediums || []).map((m: any) => (
                                                <div key={m.utm_medium} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
                                                    <Hash size={14} className="text-slate-400" />
                                                    <span className="text-sm font-medium text-slate-600">{m.utm_medium}</span>
                                                    <span className="text-xs font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded shadow-sm">
                                                        {m.cnt}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Campaigns */}
                                <Card className="border-slate-100 shadow-sm">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-lg font-semibold text-slate-800">Top Campaigns</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {(data.acquisition?.utmCampaigns || []).map((c: any) => (
                                                <div key={c.utm_campaign} className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Megaphone size={14} className="text-violet-500" />
                                                        <span className="text-slate-700 font-medium">{c.utm_campaign}</span>
                                                    </div>
                                                    <span className="text-slate-500">{c.cnt}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                </TabsContent>

                {/* ------------------ Audience ------------------ */}
                <TabsContent value="audience" className="space-y-6">
                    {loading.audience ? (
                        <div className="flex h-64 items-center justify-center text-slate-400">
                            <Loader className="animate-spin" />
                        </div>
                    ) : error.audience ? (
                        <div className="p-4 rounded-lg bg-red-50 text-red-500 border border-red-100">
                            {error.audience}
                        </div>
                    ) : (
                        <div className="space-y-6">

                            {/* --- Row 1: Core KPIs --- */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* DAU */}
                                <Card className="border-slate-100 shadow-sm">
                                    <CardContent className="p-6 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-500 mb-1">Daily Active (DAU)</p>
                                            <h2 className="text-3xl font-bold text-blue-600">
                                                {data.audience?.dau ?? "—"}
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
                                                {data.audience?.wau ?? "—"}
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
                                                {data.audience?.mau ?? "—"}
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
                                                {data.audience?.stickiness ? `${(data.audience.stickiness * 100).toFixed(1)}%` : "—"}
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
                                                    <AreaChart data={data.audience?.dauTimeseries || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                                                {(data.audience?.topUsers || []).map((user: any, i: number) => (
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
                                            {(data.audience?.retention || []).map((cohort: any) => (
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
                    )}
                </TabsContent>

                {/* ------------------ Tech / Geo / Ops ------------------ */}
                <TabsContent value="tech_geo_ops" className="space-y-6">
                    {loading.tech_geo_ops ? (
                        <div className="flex h-64 items-center justify-center text-slate-400">
                            <Loader className="animate-spin" />
                        </div>
                    ) : error.tech_geo_ops ? (
                        <div className="p-4 rounded-lg bg-red-50 text-red-500 border border-red-100">
                            {error.tech_geo_ops}
                        </div>
                    ) : (
                        <div className="space-y-6">

                            {/* --- Section 1: Technology Breakdown (3 Columns) --- */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                                {/* 1. Device Distribution (Donut Chart) */}
                                <Card className="border-slate-100 shadow-sm">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg font-semibold text-slate-800">Devices</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {(data?.data?.device || []).length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-[250px] text-slate-400">
                                                <Monitor className="h-8 w-8 mb-2 opacity-20" />
                                                <p className="text-sm">No device data</p>
                                            </div>
                                        ) : (
                                            <div className="h-[250px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={data?.data?.device || []}
                                                            dataKey="cnt"
                                                            nameKey="device_type"
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={60}
                                                            outerRadius={80}
                                                            // Only add padding if multiple segments exist to avoid gaps in full circles
                                                            paddingAngle={(data.data?.device || []).length > 1 ? 5 : 0}
                                                        >
                                                            {(data.data?.device || []).map((entry: any, index: number) => {
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
                                        {(data.data?.os || []).length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-[250px] text-slate-400">
                                                <Cpu className="h-8 w-8 mb-2 opacity-20" />
                                                <p className="text-sm">No OS data</p>
                                            </div>
                                        ) : (
                                            <div className="h-[250px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        data={data.data?.os || []}
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
                                        {(data.data?.browsers || []).length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-[200px] text-slate-400">
                                                <Layout className="h-8 w-8 mb-2 opacity-20" />
                                                <p className="text-sm">No browser data</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                                {(data.data?.browsers || []).map((b: any) => (
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
                                        {(data.data?.countries || []).length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-[250px] text-slate-400">
                                                <Ban className="h-8 w-8 mb-2 opacity-20" />
                                                <p className="text-sm">No location data</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="space-y-4">
                                                    {(data.data?.countries || []).slice(0, 5).map((c: any) => (
                                                        <div key={c.country} className="flex items-center justify-between pb-2">
                                                            <div className="flex items-center gap-3">
                                                                {/* Flag CDN */}
                                                                <img
                                                                    src={`https://flagcdn.com/24x18/${c.country.toLowerCase()}.png`}
                                                                    alt={c.country}
                                                                    className="h-3.5 w-5 rounded-sm object-cover shadow-sm"
                                                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                                                />
                                                                <span className="text-sm font-medium text-slate-700">{c.country}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-emerald-500 rounded-full"
                                                                        style={{ width: `${Math.min((c.cnt / (data.data?.countries[0]?.cnt || 1)) * 100, 100)}%` }}
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
                                                        {(data.data?.cities || []).slice(0, 3).map((city: any) => (
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
                                                    {data.data?.latency?.avg_ms ? Math.round(data.data.latency.avg_ms) : '—'}ms
                                                </p>
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-slate-50 border-slate-100 shadow-none">
                                            <CardContent className="p-4 text-center">
                                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">P50</p>
                                                <p className="text-xl sm:text-2xl font-bold text-emerald-600">{data.data?.latency?.p50_ms ?? '—'}ms</p>
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-slate-50 border-slate-100 shadow-none">
                                            <CardContent className="p-4 text-center">
                                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">P95</p>
                                                <p className="text-xl sm:text-2xl font-bold text-amber-500">{data.data?.latency?.p95_ms ?? '—'}ms</p>
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
                                            {(data.data?.eps || []).length === 0 ? (
                                                <div className="flex flex-col items-center justify-center h-[220px] text-slate-400">
                                                    <Activity className="h-8 w-8 mb-2 opacity-20" />
                                                    <p className="text-sm">No traffic data</p>
                                                </div>
                                            ) : (
                                                <div className="h-[220px] w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <LineChart data={data.data?.eps || []} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
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
                                                                dot={(data.data?.eps || []).length < 5}
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
                    )}
                </TabsContent>
            </Tabs>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={(e) => e.preventDefault()}>
                        <DialogHeader>
                            <DialogTitle className="text-red-600">
                                Delete Visly Project
                            </DialogTitle>
                            <DialogDescription className="space-y-2">
                                <p className="text-slate-600">
                                    This action <span className="font-semibold text-red-600">cannot be undone</span>.
                                    Deleting this project will permanently remove:
                                </p>
                                <ul className="list-disc list-inside text-slate-600 text-sm">
                                    <li>All project data</li>
                                    <li>Associated analytics & events</li>
                                    <li>All related configuration</li>
                                </ul>

                                <p className="mt-3 text-sm text-slate-600">
                                    To confirm, type <span className="font-semibold">DELETE</span> below.
                                </p>
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 mt-4">
                            <Input
                                id="confirm"
                                name="confirm"
                                placeholder="Type DELETE to confirm"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                            />
                        </div>

                        <DialogFooter className="mt-6">
                            <DialogClose asChild>
                                <Button variant="outline" type="button">
                                    Cancel
                                </Button>
                            </DialogClose>

                            <Button
                                variant="destructive"
                                disabled={value !== "DELETE"}
                                onClick={handleDelete}
                            >
                                Delete Project
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

const SourceIcon = ({ source }: { source: string }) => {
    // 1. Handle special internal cases/concepts with Icons
    const s = source.toLowerCase();
    if (s.includes('direct') || s.includes('none')) return <ArrowRightCircle className="h-4 w-4 text-slate-400" />;
    if (s.includes('newsletter') || s.includes('email')) return <Mail className="h-4 w-4 text-orange-500" />;

    // 2. Map common short-names to domains for the CDN
    let domain = s;
    const domainMap: Record<string, string> = {
        'google': 'google.com',
        'twitter': 'twitter.com',
        'facebook': 'facebook.com',
        'linkedin': 'linkedin.com',
        'github': 'github.com',
        'youtube': 'youtube.com',
        'instagram': 'instagram.com',
        'tiktok': 'tiktok.com',
        'bing': 'bing.com'
    };

    if (domainMap[s]) domain = domainMap[s];

    // 3. Render CDN Image (Google's S2 service is very fast/cacheable)
    // We add a fallback to a generic globe if it fails (using error handling on img is complex in inline, 
    // so we assume valid domains usually work or just show the broken img placeholder which is small)
    return (
        <img
            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
            alt={source}
            className="h-4 w-4 rounded-sm"
            onError={(e) => {
                // specific fallback logic could go here, but for clean UI we keep it simple
                (e.target as HTMLImageElement).style.display = 'none';
            }}
        />
    );
};