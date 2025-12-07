export function CodeBlock({
    filename,
    code,
}: {
    filename?: string;
    code: string;
}) {
    return (
        <div className="bg-[#0f172a] rounded-lg overflow-hidden border border-slate-800 shadow-sm text-sm font-mono">
            {filename && (
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
                    <span className="text-xs text-slate-400">{filename}</span>
                </div>
            )}
            <div className="p-4 overflow-x-auto">
                <pre className="text-slate-200 whitespace-pre leading-relaxed">
                    {code}
                </pre>
            </div>
        </div>
    );
}
