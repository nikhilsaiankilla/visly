"use client";

import { motion } from "framer-motion";
import {
    ArrowRight,
    Code2,
    LayoutDashboard,
    Terminal,
} from 'lucide-react';
import Link from 'next/link';
import LandingImages from "@/components/landing-images";
import { IntegrationSection } from "@/components/integration-section";
import FeaturesGrid from "@/components/featured-grid";
import CtaSection from "@/components/cta-section";
import { Button } from "@/components/ui/button";

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
        <div className="bg-white font-sans w-full overflow-x-hidden">
            <section className="w-full pt-12 lg:pt-20 bg-white px-4 md:px-10 lg:px-28">
                <div className="container mx-auto px-4 md:px-6 flex flex-col items-center text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col gap-6 items-center max-w-3xl"
                    >
                        <div className="inline-flex items-center rounded-full border border-green-600/30 bg-green-600/10 px-3 py-1 text-xs font-medium text-green-600 w-fit">
                            <span className="flex h-2 w-2 rounded-full bg-green-600 mr-2"></span>
                            v1.0 is live
                        </div>

                        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
                            The One-Line Analytics Solution for <span className="text-green-600">the Modern Web</span>
                        </h1>

                        <p className="text-lg text-gray-600 max-w-[600px]">
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
            <LandingImages />
            <section className="w-full min-h-[60vh] md:mt-0 py-10 border-t border-slate-100 pt-10 pb-10 flex items-center justify-center flex-col">
                <p className="text-xs text-center font-semibold text-gray-600 uppercase tracking-wider mb-6">Works seamlessly with</p>
                <FrameworkLogos />
            </section>
            <IntegrationSection />
            <FeaturesGrid />
            <CtaSection />
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