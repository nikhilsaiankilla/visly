"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { CodeBlock } from "./ui/code-block";

const codeSnippets = {
    install: {
        npm: "npm install visly",
        yarn: "yarn add visly",
        pnpm: "pnpm add visly",
        bun: "bun add visly",
    },
    usage: `// app/layout.js
import { VislyProvider } from 'visly';

export default function RootLayout({ children }) {
  return (
    <VislyProvider apiKey="proj_123456" projectId="my-app">
      {children}
    </VislyProvider>
  );
}`,
};

export const IntegrationSection = () => {
    const [activeTab, setActiveTab] = useState<"install" | "usage">("install");
    const [pkgManager, setPkgManager] = useState<"npm" | "yarn" | "pnpm" | "bun">(
        "npm"
    );
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const text =
            activeTab === "install"
                ? codeSnippets.install[pkgManager]
                : codeSnippets.usage;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <section className="w-full px-4 md:px-10 lg:px-28 max-w-7xl mx-auto">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                    {/* Left Side: Context */}
                    <div className="flex-1 space-y-6">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                            Ready in less than{" "}
                            <span className="text-green-600">60 seconds</span>
                        </h2>
                        <p className="text-lg text-gray-600">
                            We stripped away the bloat. No complex configuration files, no
                            massive script downloads. Just install, wrap your app, and deploy.
                        </p>

                        <ul className="space-y-4 pt-4">
                            {[
                                "Type-safe SDK for React, Vue, and Angular",
                                "< 1kb bundle size (gzipped)",
                                "Automatic route change tracking",
                                "GDPR compliant out of the box",
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                                        <Check className="w-3.5 h-3.5 text-green-600" />
                                    </div>
                                    <span className="text-gray-600 font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Right Side: Code Window */}
                    <div className="flex-1 w-full max-w-xl">
                        <div className="rounded-xl bg-[#1e293b] shadow-2xl overflow-hidden border border-slate-700">
                            {/* Window Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-[#0f172a]">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-red-500/80" />
                                    <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                                    <div className="h-3 w-3 rounded-full bg-green-500/80" />
                                </div>
                                {/* Tabs */}
                                <div className="flex gap-4 text-xs font-mono">
                                    <button
                                        onClick={() => setActiveTab("install")}
                                        className={`${activeTab === "install"
                                                ? "text-green-400"
                                                : "text-slate-500 hover:text-slate-300"
                                            } transition-colors cursor-pointer`}
                                    >
                                        1. Install
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("usage")}
                                        className={`${activeTab === "usage"
                                                ? "text-green-400"
                                                : "text-slate-500 hover:text-slate-300"
                                            } transition-colors cursor-pointer`}
                                    >
                                        2. Setup
                                    </button>
                                </div>
                            </div>

                            {/* Toolbar (Only for Install tab) */}
                            {activeTab === "install" && (
                                <div className="flex gap-2 px-4 py-2 bg-[#1e293b] border-b border-slate-700/50">
                                    {(["npm", "yarn", "pnpm", "bun"] as const).map((pm) => (
                                        <button
                                            key={pm}
                                            onClick={() => setPkgManager(pm)}
                                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${pkgManager === pm
                                                    ? "bg-slate-700 text-white"
                                                    : "text-slate-400 hover:text-slate-200"
                                                } cursor-pointer`}
                                        >
                                            {pm}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Code Area */}
                            <div className="p-6 relative group">
                                <button
                                    onClick={handleCopy}
                                    className="absolute top-4 right-4 p-2 rounded-md bg-slate-800 text-slate-400 opacity-0 group-hover:opacity-100 transition-all hover:text-white cursor-pointer"
                                >
                                    {copied ? (
                                        <Check className="w-4 h-4" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                </button>

                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeTab + pkgManager}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <pre className="font-mono text-sm leading-relaxed text-slate-300 overflow-x-auto">
                                            {activeTab === "install" ? (
                                                <code>
                                                    <span className="text-purple-400">$</span>{" "}
                                                    {codeSnippets.install[pkgManager]}
                                                </code>
                                            ) : (
                                                <code className="whitespace-pre">
                                                    {codeSnippets.usage
                                                        .split("import")
                                                        .map((part, i) =>
                                                            i === 0 ? (
                                                                part
                                                            ) : (
                                                                <>
                                                                    <span className="text-purple-400">
                                                                        import
                                                                    </span>
                                                                    {part}
                                                                </>
                                                            )
                                                        )}
                                                </code>
                                            )}
                                        </pre>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Debug mode snippet using CodeBlock */}
                        <div className="mt-6">
                            <CodeBlock
                                filename="Debug mode"
                                language="js"
                                code={`const visly = new VislyClient({ projectId: "demo", debug: true });`}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
