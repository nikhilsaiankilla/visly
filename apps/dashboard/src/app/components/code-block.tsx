"use client";

import { Check, Copy, Terminal } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function CodeBlock({ code, language = "bash" }: { code: string; language?: string }) {
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState("npm");

    // Check if this is an install command to enable the Package Manager tabs
    const isInstallCommand = code.startsWith("npm install") || code.startsWith("npm i");

    // Extract the package name (e.g., "visly") from "npm install visly"
    const packageName = isInstallCommand ? code.replace(/npm (install|i) /, "") : "";

    const commands = {
        npm: code,
        pnpm: `pnpm add ${packageName}`,
        yarn: `yarn add ${packageName}`,
        bun: `bun add ${packageName}`,
    };

    // Determine what text to copy based on context
    const textToCopy = isInstallCommand ? commands[activeTab as keyof typeof commands] : code;

    const handleCopy = () => {
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Syntax Highlighting
    const highlightCode = (text: string) => {
        if (language === 'bash') {
            const parts = text.split(/(npm|pnpm|yarn|bun|install|add|visly)/g);
            return parts.map((part, i) => {
                if (['npm', 'pnpm', 'yarn', 'bun'].includes(part)) return <span key={i} className="text-purple-400">{part}</span>;
                if (['install', 'add'].includes(part)) return <span key={i} className="text-yellow-300">{part}</span>;
                // Highlight your package name specifically
                if (part.includes('visly')) return <span key={i} className="text-[#6A8E58] font-bold">{part}</span>;
                return part;
            });
        }
        return text;
    };

    // --- RENDER: Standard Block (Env vars, code snippets) ---
    if (!isInstallCommand) {
        return (
            <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden my-4 shadow-sm">
                <div className="flex justify-between items-center px-4 py-2 bg-slate-900 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                        <Terminal size={14} className="text-slate-400" />
                        <span className="text-xs text-slate-400 font-mono lowercase">{language}</span>
                    </div>
                    <CopyButton copied={copied} onCopy={handleCopy} />
                </div>
                <div className="p-4 overflow-x-auto">
                    <pre className="font-mono text-sm text-slate-300 leading-relaxed">
                        <code>{highlightCode(code)}</code>
                    </pre>
                </div>
            </div>
        );
    }

    // --- RENDER: Package Manager Tabs ---
    return (
        <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden my-4 shadow-sm group">
            <Tabs defaultValue="npm" onValueChange={setActiveTab} className="w-full">

                {/* Header: Tabs + Copy Button */}
                <div className="flex justify-between items-center bg-slate-900 border-b border-slate-800 pr-4 pl-2">
                    <TabsList className="bg-transparent h-10 p-0">
                        {['npm', 'pnpm', 'yarn', 'bun'].map((pm) => (
                            <TabsTrigger
                                key={pm}
                                value={pm}
                                className="data-[state=active]:bg-slate-800 data-[state=active]:text-[#6A8E58] text-slate-400 rounded-none h-full px-4 border-b-2 border-transparent data-[state=active]:border-[#6A8E58] transition-none"
                            >
                                {pm}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <CopyButton copied={copied} onCopy={handleCopy} />
                </div>

                {/* Content Areas */}
                {Object.entries(commands).map(([pm, cmd]) => (
                    <TabsContent key={pm} value={pm} className="mt-0">
                        <div className="p-4 overflow-x-auto">
                            <pre className="font-mono text-sm text-slate-300 leading-relaxed">
                                <code>{highlightCode(cmd)}</code>
                            </pre>
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}

// Helper Sub-component for the button
function CopyButton({ copied, onCopy }: { copied: boolean; onCopy: () => void }) {
    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={onCopy}
        >
            {copied ? (
                <Check size={14} className="text-[#6A8E58]" />
            ) : (
                <Copy size={14} />
            )}
            <span className="sr-only">Copy code</span>
        </Button>
    );
}