import { CodeBlock } from "@/components/ui/code-block";
import React, { JSX } from "react";

const SectionTitle: React.FC<{ id: string; children: React.ReactNode }> = ({
  id,
  children,
}) => (
  <h2
    id={id}
    className="text-2xl md:text-3xl font-bold text-slate-900 scroll-mt-24 mt-16 mb-6 border-b border-slate-100 pb-2"
  >
    {children}
  </h2>
);

const SubTitle: React.FC<{ id?: string; children: React.ReactNode }> = ({
  id,
  children,
}) => (
  <h3
    id={id}
    className="text-xl font-semibold text-slate-800 mt-10 mb-4 scroll-mt-24"
  >
    {children}
  </h3>
);

const Table: React.FC<{
  head: string[];
  rows: (string | number | boolean | JSX.Element)[][];
}> = ({ head, rows }) => (
  <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white my-6 shadow-sm">
    <table className="min-w-full text-left text-sm">
      <thead className="bg-slate-50/80 border-b border-slate-200">
        <tr>
          {head.map((h, index) => (
            <th
              key={index}
              className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr
            key={i}
            className={`transition-colors hover:bg-slate-50 ${
              i % 2 === 0 ? "bg-white" : "bg-slate-50/30"
            }`}
          >
            {r.map((c, j) => (
              <td
                key={j}
                className="px-4 py-3 align-top text-slate-700 font-mono text-xs md:text-sm"
              >
                {typeof c === "boolean" ? String(c) : c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// --- Main Page ---

export default function DocsPage() {
  return (
    <div className="space-y-12 pb-32 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="space-y-6 pt-10" id="introduction">
        <div className="space-y-2">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-blue-600 font-semibold">
            Documentation
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            Visly SDK
          </h1>
        </div>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl leading-relaxed">
          Zero-dependency, privacy-friendly analytics. Drop a single script tag
          into your website to start tracking pageviews, clicks, and custom
          events instantly. No npm install required.
        </p>

        {/* Quick Links / TOC */}
        <nav className="mt-8 grid gap-3 text-sm font-medium text-slate-600 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { id: "getting-started", label: "Getting Started" },
            { id: "configuration", label: "Configuration" },
            { id: "auto-tracking", label: "Auto Tracking" },
            { id: "manual-tracking", label: "Manual Tracking" },
            { id: "nextjs", label: "Next.js Guide" },
            { id: "api-reference", label: "API Reference" },
          ].map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="group flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <span className="group-hover:text-blue-600">{s.label}</span>
              <span className="text-slate-300 group-hover:text-blue-400">→</span>
            </a>
          ))}
        </nav>
      </header>

      <hr className="border-slate-100" />

      {/* 1. Getting Started */}
      <section id="getting-started">
        <SectionTitle id="getting-started">Getting Started</SectionTitle>
        <p className="text-slate-600 mb-6 leading-relaxed">
          Add the Visly script to the{" "}
          <code className="bg-slate-100 px-1.5 py-0.5 rounded text-pink-600 font-mono text-sm">
            &lt;head&gt;
          </code>{" "}
          of your website. That's it. It will automatically initialize and start
          tracking pageviews.
        </p>

        <CodeBlock
          language="html"
          filename="index.html"
          code={`<script 
  defer 
  src="https://oyoxrtpspyfxsndrdzvm.supabase.co/storage/v1/object/public/visly%20script/visly-v1.js"
  data-project-id="YOUR_PROJECT_ID"
></script>`}
        />

        <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 mt-6 flex gap-3 text-sm text-blue-800">
          <span className="text-xl">💡</span>
          <div>
            <strong>Performance Tip:</strong> The script is loaded
            asynchronously with <code>defer</code>, so it won't block your page
            load or affect your Core Web Vitals.
          </div>
        </div>
      </section>

      {/* 2. Configuration */}
      <section id="configuration">
        <SectionTitle id="configuration">Configuration</SectionTitle>
        <p className="text-slate-600 mb-6">
          Configure Visly by adding <code>data-</code> attributes directly to
          the script tag.
        </p>

        <Table
          head={["Attribute", "Type", "Default", "Description"]}
          rows={[
            [
              <span className="font-bold text-slate-900" key="1">
                data-project-id
              </span>,
              "string",
              "—",
              "Required. Your unique project identifier.",
            ],
            [
              "data-endpoint",
              "string",
              "(default)",
              "Custom ingestion endpoint (if self-hosting).",
            ],
            [
              "data-debug",
              "boolean",
              "false",
              "Enable verbose console logging for development.",
            ],
            [
              "data-capture-text",
              "boolean",
              "false",
              "If true, captures the inner text of clicked elements.",
            ],
          ]}
        />
      </section>

      {/* 3. Auto Tracking */}
      <section id="auto-tracking">
        <SectionTitle id="auto-tracking">Auto-Tracking (No-Code)</SectionTitle>
        <p className="text-slate-600 mb-6">
          Visly can automatically track clicks on specific elements without
          writing any JavaScript. Just add the{" "}
          <code className="bg-slate-100 px-1.5 py-0.5 rounded text-purple-600 font-mono text-sm">
            data-va
          </code>{" "}
          attribute to any HTML element.
        </p>

        <SubTitle>Example</SubTitle>
        <CodeBlock
          language="html"
          filename="HTML"
          code={`<button data-va="signup_btn">
  Get Started
</button>

<a href="/pricing" data-va="nav_pricing">Pricing</a>`}
        />
      </section>

      {/* 4. Manual Tracking */}
      <section id="manual-tracking">
        <SectionTitle id="manual-tracking">Manual Tracking</SectionTitle>
        <p className="text-slate-600 mb-6">
          Once the script loads, it exposes a global{" "}
          <code className="bg-slate-100 px-1.5 py-0.5 rounded text-purple-600 font-mono text-sm">
            window.visly
          </code>{" "}
          object. Use this to track custom events or identify users.
        </p>

        <SubTitle>Track Custom Events</SubTitle>
        <CodeBlock
          language="javascript"
          filename="app.js"
          code={`// Track a simple event
window.visly.track("purchase_completed");

// Track with custom properties
window.visly.track("add_to_cart", {
  item_id: "sku_123",
  price: 49.99,
  currency: "USD"
});`}
        />

        <SubTitle id="identifying-users">Identify Users</SubTitle>
        <p className="text-slate-600 mb-4">
          Link anonymous sessions to a specific user ID when they log in.
        </p>
        <CodeBlock
          language="javascript"
          filename="app.js"
          code={`// Call this after successful login
window.visly.identify("user_555");`}
        />
      </section>

      {/* 5. Framework Guides */}
      <section id="frameworks">
        <SectionTitle id="frameworks">Framework Guides</SectionTitle>

        <SubTitle id="nextjs">Next.js (App Router)</SubTitle>
        <p className="text-slate-600 mb-4">
          Add the script in your root layout. Using the native{" "}
          <code>&lt;script&gt;</code> tag inside <code>&lt;head&gt;</code> is
          often simplest for external scripts.
        </p>
        <CodeBlock
          language="tsx"
          filename="app/layout.tsx"
          code={`export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script 
          defer 
          src="https://oyoxrtpspyfxsndrdzvm.supabase.co/storage/v1/object/public/visly%20script/visly-v1.js" 
          data-project-id="YOUR_PROJECT_ID"
        ></script>
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}`}
        />

        <SubTitle id="react">React (SPA)</SubTitle>
        <p className="text-slate-600 mb-4">
          Simply add the script tag to your{" "}
          <code className="text-sm font-mono">public/index.html</code> file.
        </p>
        <CodeBlock
          language="html"
          filename="public/index.html"
          code={`<head>
  <script 
    defer 
    src="https://oyoxrtpspyfxsndrdzvm.supabase.co/storage/v1/object/public/visly%20script/visly-v1.js"
    data-project-id="YOUR_PROJECT_ID">
  </script>
</head>`}
        />

        <SubTitle id="typescript">TypeScript Support</SubTitle>
        <p className="text-slate-600 mb-4">
          If you are using TypeScript, add this type definition to your{" "}
          <code>global.d.ts</code> or <code>types.d.ts</code> to avoid window
          errors.
        </p>
        <CodeBlock
          language="typescript"
          filename="global.d.ts"
          code={`export {};

declare global {
  interface Window {
    visly: {
      track: (name: string, props?: Record<string, any>) => void;
      identify: (id: string) => void;
    };
  }
}`}
        />
      </section>

      {/* 6. API Reference */}
      <section id="api-reference">
        <SectionTitle id="api-reference">API Reference</SectionTitle>

        <SubTitle id="api-track">window.visly.track(name, props?)</SubTitle>
        <Table
          head={["Parameter", "Type", "Required", "Description"]}
          rows={[
            [
              <code>name</code>,
              "string",
              "Yes",
              "The name of the event (e.g., 'click', 'signup').",
            ],
            [
              <code>props</code>,
              "object",
              "No",
              "A flat JSON object with additional metadata.",
            ],
          ]}
        />

        <SubTitle id="api-identify">window.visly.identify(userId)</SubTitle>
        <Table
          head={["Parameter", "Type", "Required", "Description"]}
          rows={[
            [
              <code>userId</code>,
              "string",
              "Yes",
              "The unique ID of the user from your database.",
            ],
          ]}
        />
      </section>

      {/* Footer author block */}
      <section className="mt-20 border-t border-slate-200 pt-8 text-sm text-slate-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <p className="font-semibold text-slate-900">
              Built by Nikhil Sai Ankilla
            </p>
            <p className="mt-1">
              Full Stack Developer • Open for SDE roles.
            </p>
          </div>
          <div className="flex gap-6 text-xs font-medium uppercase tracking-wider">
            <a
              href="https://x.com/nikhilbuildss"
              target="_blank"
              rel="noreferrer"
              className="hover:text-blue-600 transition-colors"
            >
              Twitter
            </a>
            <a
              href="https://www.linkedin.com/in/nikhilsaiankilla/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-blue-700 transition-colors"
            >
              LinkedIn
            </a>
            <a
              href="https://nikhilsai.in"
              target="_blank"
              rel="noreferrer"
              className="hover:text-green-600 transition-colors"
            >
              Portfolio
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}