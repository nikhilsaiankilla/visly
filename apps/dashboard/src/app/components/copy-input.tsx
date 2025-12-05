"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CopyInput({ value, label }: { value: string; label?: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-2">
            {label && (
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {label}
                </Label>
            )}
            <div className="flex items-center gap-2">
                <Input
                    value={value}
                    readOnly
                    className="font-mono text-sm bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-[#6A8E58]"
                />
                <Button
                    size="icon"
                    variant="outline"
                    onClick={handleCopy}
                    className="shrink-0 border-slate-200 hover:bg-slate-50"
                >
                    {copied ? (
                        <Check size={16} className="text-[#6A8E58]" />
                    ) : (
                        <Copy size={16} className="text-slate-500" />
                    )}
                    <span className="sr-only">Copy</span>
                </Button>
            </div>
        </div>
    );
}