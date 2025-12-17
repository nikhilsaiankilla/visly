"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2, Rocket } from "lucide-react";
import Link from "next/link";

// Custom Components
import { CopyInput } from "@/app/components/copy-input";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { formatError } from "@/utils/utils";
import { CodeBlock } from "@/components/ui/code-block";

// --- NEW LOCAL CONFIGURATION ---
// We define these here to ensure they match your new Script Tag architecture immediately.

const SCRIPT_URL = "https://oyoxrtpspyfxsndrdzvm.supabase.co/storage/v1/object/public/visly%20script/visly-v1.js";

type FrameworkId = 'nextjs' | 'react' | 'html';

const FRAMEWORKS: { id: FrameworkId; label: string }[] = [
    { id: 'nextjs', label: 'Next.js' },
    { id: 'react', label: 'React' },
    { id: 'html', label: 'HTML / Vanilla' },
];

const ONBOARDING_STEPS = {
    nextjs: [
        {
            id: 'install',
            title: 'Add Script to Root Layout',
            description: 'Add the script component to your app/layout.tsx file.',
            language: 'tsx',
            code: (projectId: string) => `import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script 
          src="${SCRIPT_URL}"
          data-project-id="${projectId}"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}`
        }
    ],
    react: [
        {
            id: 'install',
            title: 'Add to index.html',
            description: 'Place the script tag inside the <head> of your public/index.html file.',
            language: 'html',
            code: (projectId: string) => `<head>
  <script 
    defer 
    src="${SCRIPT_URL}"
    data-project-id="${projectId}">
  </script>
</head>`
        }
    ],
    html: [
        {
            id: 'install',
            title: 'Add to Head',
            description: 'Paste this snippet into the <head> section of your website.',
            language: 'html',
            code: (projectId: string) => `<script 
  defer 
  src="${SCRIPT_URL}"
  data-project-id="${projectId}"
></script>`
        }
    ]
};

// -------------------------------

export default function NewProjectPage() {
    const router = useRouter();

    const [status, setStatus] = useState<'form' | "failed" | 'creating' | 'success'>('form');
    const [formData, setFormData] = useState({ name: "", domain: "" });
    const [generatedProjectId, setGeneratedProjectId] = useState("");

    // State for selected framework
    const [selectedFramework, setSelectedFramework] = useState<FrameworkId>('nextjs');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('creating');

        try {
            const response = await fetch('/api/project/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })

            if (!response.ok) {
                throw new Error('Failed to create project');
            }

            const json = await response.json();

            if (!json.ok) {
                return toast.error(json.error || 'Something went wrong. Please try again.')
            }

            setGeneratedProjectId(json?.data?.id);
            toast.success('Congrats Project Successfully Created.');
            setStatus('success');
        } catch (error: unknown) {
            const err = formatError(error);
            toast.error(err);
            setStatus('failed')
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <div className="border-b border-slate-200 px-6 py-4">
                <div className="max-w-2xl mx-auto flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="text-slate-400 hover:text-slate-900">
                        <Link href="/dashboard">
                            <ArrowLeft size={20} />
                        </Link>
                    </Button>
                    <span className="font-semibold text-slate-900">Create New Project</span>
                </div>
            </div>

            <main className="flex-1 p-6">
                <div className="max-w-2xl mx-auto">
                    <AnimatePresence mode="wait">

                        {/* --- PHASE 1: THE FORM --- */}
                        {status !== 'success' && (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <Card className="shadow-sm border-slate-200">
                                    <CardHeader className="mb-4">
                                        <div className="h-12 w-12 bg-green-600/10 rounded-xl flex items-center justify-center text-green-600 mb-4">
                                            <Rocket size={24} />
                                        </div>
                                        <CardTitle className="text-2xl font-bold text-slate-900">
                                            Let's set up your project
                                        </CardTitle>
                                        <CardDescription className="text-slate-500">
                                            We'll generate a unique ID for you to start tracking.
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent>
                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="projectName">Project Name</Label>
                                                <Input
                                                    id="projectName"
                                                    required
                                                    placeholder="e.g. My Portfolio"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    disabled={status === 'creating'}
                                                    className="focus-visible:ring-[#6A8E58]"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="domain">Domain / URL</Label>
                                                <div className="flex rounded-md shadow-sm">
                                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-200 bg-slate-50 text-slate-500 text-sm">
                                                        https://
                                                    </span>
                                                    <Input
                                                        id="domain"
                                                        required
                                                        placeholder="example.com"
                                                        className="rounded-l-none focus-visible:ring-[#6A8E58]"
                                                        value={formData.domain}
                                                        onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                                                        disabled={status === 'creating'}
                                                    />
                                                </div>
                                            </div>

                                            <Button
                                                type="submit"
                                                disabled={status === 'creating'}
                                                className="w-full bg-green-600 hover:bg-green-600/80 text-white"
                                                size="lg"
                                            >
                                                {status === 'creating' ? (
                                                    <>
                                                        <Loader2 size={20} className="mr-2 animate-spin" /> Creating...
                                                    </>
                                                ) : (
                                                    <>Create Project <ArrowRight size={18} className="ml-2" /></>
                                                )}
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {/* --- PHASE 2: ONBOARDING INSTRUCTIONS --- */}
                        {status === 'success' && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-6"
                            >
                                {/* Success Banner */}
                                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                                    <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                                        <Check size={24} className="text-green-600" />
                                    </div>
                                    <h2 className="text-xl font-bold text-green-900">Project Created Successfully!</h2>
                                    <p className="text-green-700">Follow the steps below to integrate Visly into <strong>{formData.name}</strong>.</p>
                                </div>

                                {/* Project ID Card */}
                                <Card className="border-slate-200 shadow-sm">
                                    <CardContent className="p-6">
                                        <CopyInput value={generatedProjectId} label="Your Project ID" />
                                    </CardContent>
                                </Card>

                                {/* Integration Steps */}
                                <Card className="border-slate-200 shadow-sm">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                            <h3 className="font-bold text-slate-900 text-lg">Integration Guide</h3>

                                            {/* Framework Selector */}
                                            <Tabs
                                                defaultValue="nextjs"
                                                value={selectedFramework}
                                                onValueChange={(val) => setSelectedFramework(val as FrameworkId)}
                                            >
                                                <TabsList className="bg-slate-100">
                                                    {FRAMEWORKS.map(fw => (
                                                        <TabsTrigger
                                                            key={fw.id}
                                                            value={fw.id}
                                                            className="data-[state=active]:bg-white data-[state=active]:text-[#6A8E58] text-xs px-3"
                                                        >
                                                            {fw.label}
                                                        </TabsTrigger>
                                                    ))}
                                                </TabsList>
                                            </Tabs>
                                        </div>

                                        <div className="space-y-8">
                                            {/* Dynamically render steps based on selected framework */}
                                            {ONBOARDING_STEPS[selectedFramework].map((step, index) => (
                                                <div key={step.id} className="relative pl-8">
                                                    {/* Vertical Line */}
                                                    {index !== ONBOARDING_STEPS[selectedFramework].length - 1 && (
                                                        <div className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-slate-100" />
                                                    )}
                                                    {/* Number Bubble */}
                                                    <div className="absolute left-0 top-0 h-6 w-6 rounded-full bg-[#6A8E58] text-white text-xs font-bold flex items-center justify-center ring-4 ring-white">
                                                        {index + 1}
                                                    </div>
                                                    {/* Content */}
                                                    <div>
                                                        <h4 className="font-semibold text-slate-900">{step.title}</h4>
                                                        <p className="text-sm text-slate-500 mb-3">{step.description}</p>
                                                        <CodeBlock
                                                            filename={selectedFramework === 'nextjs' ? 'layout.tsx' : 'index.html'}
                                                            code={step.code(generatedProjectId)}
                                                            language={step.language}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Final Action */}
                                <div className="flex justify-end gap-4">
                                    <Button variant="ghost" asChild className="text-slate-600 hover:text-slate-900">
                                        <Link href="/docs">Read Full Documentation</Link>
                                    </Button>
                                    <Button
                                        onClick={() => router.push('/dashboard')}
                                        className="bg-slate-900 hover:bg-slate-800 text-white"
                                    >
                                        Go to Dashboard
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}