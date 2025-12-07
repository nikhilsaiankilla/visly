"use client";

import { Zap, LineChart as LineChartIcon, Globe, MousePointerClick } from "lucide-react";

const FeaturesGrid = () => (
    <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl font-bold text-green-600 mb-4">
                    Everything you need, nothing you don't.
                </h2>
                <p className="text-gray-600 text-lg">
                    We built Visly to replace the 5 different tools you currently use to track your application health.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {/* Card 1: Large – reuse OVERVIEW timeseries style */}
                <div className="md:col-span-2 rounded-2xl bg-slate-50 border border-slate-100 p-8 flex flex-col justify-between hover:border-green-200 transition-colors duration-300">
                    <div>
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                            <LineChartIcon className="w-5 h-5 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Real-time Dashboard</h3>
                        <p className="text-gray-600">
                            Watch users interact with your site as it happens. Our WebSocket connection ensures data is live, not 24 hours old.
                        </p>
                    </div>
                </div>

                {/* Card 2: Small */}
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-8 hover:border-green-200 transition-colors duration-300">
                    <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                        <Zap className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Zero Latency</h3>
                    <p className="text-gray-600 text-sm">
                        Our script loads asynchronously and weighs less than 1kb. It will never block your main thread.
                    </p>
                </div>

                {/* Card 3: Small */}
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-8 hover:border-green-200 transition-colors duration-300">
                    <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                        <MousePointerClick className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Custom Events</h3>
                    <p className="text-gray-600 text-sm">
                        Go beyond page views. Track button clicks, form submissions, and custom user interactions with one line of code.
                    </p>
                </div>
                {/* Card 4: Large – reuse ENGAGEMENT Session Depth chart style */}
                <div className="md:col-span-2 rounded-2xl bg-slate-50 border border-slate-100 p-8 flex flex-col justify-between hover:border-green-200 transition-colors duration-300">
                    <div>
                        <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center mb-4">
                            <Globe className="w-5 h-5 text-orange-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Global Edge Network</h3>
                        <p className="text-gray-600 mb-4">
                            Data is ingested through edge nodes closest to your user, ensuring fast delivery regardless of where they are located.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

export default FeaturesGrid;
