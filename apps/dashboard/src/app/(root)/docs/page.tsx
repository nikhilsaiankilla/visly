// app/docs/page.tsx
"use client";

import { CodeBlock } from "@/components/ui/code-block";
import React, { JSX } from "react";

const SectionTitle: React.FC<{ id: string; children: React.ReactNode }> = ({
  id,
  children,
}) => (
  <h2
    id={id}
    className="text-2xl md:text-3xl font-bold text-slate-900 scroll-mt-24"
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
    className="text-xl font-semibold text-slate-900 mt-6 scroll-mt-24"
  >
    {children}
  </h3>
);

const Table: React.FC<{
  head: string[];
  rows: (string | number | boolean | JSX.Element)[][];
}> = ({ head, rows }) => (
  <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
    <table className="min-w-full text-left text-sm">
      <thead className="bg-slate-50 border-b border-slate-200">
        <tr>
          {head.map((h, index) => (
            <th
              key={index}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
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
            className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}
          >
            {r.map((c, j) => (
              <td key={j} className="px-4 py-2 align-top text-slate-700">
                {typeof c === "boolean" ? String(c) : c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function DocsPage() {
  return (
    <div className="space-y-12">
      {/* Top header + short description */}
      <header className="space-y-4">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-green-600">
          Visly SDK Documentation
        </p>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
          Visly SDK
        </h1>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl">
          Lightweight, privacy-safe web analytics SDK for modern web apps.
          Track pageviews, clicks, and custom events across React, Angular, Vue,
          and vanilla JavaScript — without blocking or slowing down your app.
        </p>

        {/* One-page Table of Contents */}
        <nav className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { id: "installation", label: "Installation" },
            { id: "framework-integrations", label: "Framework Integrations" },
            { id: "api-reference", label: "API Reference" },
            { id: "data-collected", label: "Data Collected" },
            { id: "features", label: "Features" },
            { id: "advanced-usage", label: "Advanced Usage" },
            { id: "debugging", label: "Debugging" },
            { id: "architecture", label: "Architecture" },
          ].map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="inline-flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 hover:bg-white hover:border-slate-300 transition-colors"
            >
              <span>{s.label}</span>
              <span className="text-[10px] text-slate-400">#</span>
            </a>
          ))}
        </nav>
      </header>

      {/* Installation */}
      <section className="space-y-4" id="installation">
        <SectionTitle id="installation">Installation</SectionTitle>
        <p className="text-slate-600">
          Install the Visly SDK using your preferred package manager.
        </p>
        <CodeBlock
          language="bash"
          filename="bash"
          highlightLines={[9, 13, 14, 18]}
          code={`npm install visly-sdk
# or
yarn add visly-sdk
# or
pnpm add visly-sdk`}
        />

        <SubTitle>Quick Start (Vanilla JS)</SubTitle>
        <CodeBlock
          filename="main.js"
          language="jsx"
          code={`import { VislyClient } from "visly-sdk";

const visly = new VislyClient({ projectId: "YOUR_PROJECT_ID" });

// Track a pageview
visly.track("pageview");

// Track a custom event
visly.track("signup_click", { plan: "pro", source: "landing" });`}
        />
      </section>

      {/* Framework Integrations */}
      <section className="space-y-6" id="framework-integrations">
        <SectionTitle id="framework-integrations">
          Framework Integrations
        </SectionTitle>

        {/* Vanilla JS */}
        <SubTitle id="vanilla-js">Vanilla JS</SubTitle>
        <p className="text-slate-600">
          Use the core Visly client in any JavaScript app without a framework.
        </p>
        <CodeBlock
          language="js"
          filename="vanilla.js"
          code={`import { VislyClient } from "visly-sdk";

const visly = new VislyClient({ projectId: "YOUR_PROJECT_ID" });

// Track a pageview
visly.track("pageview");

// Track a custom event
visly.track("signup_click", { plan: "pro", source: "landing" });`}
        />

        {/* React */}
        <SubTitle id="react">React</SubTitle>
        <p className="text-slate-600">
          Use the React bindings to automatically track route changes and send
          custom events from components.
        </p>
        <CodeBlock
          filename="app.jsx"
          language="react"
          code={`import { VislyProvider, useVisly, VislyRouteTracker } from "visly-sdk/react";

export default function App() {
  return (
    <VislyProvider projectId="YOUR_PROJECT_ID">
      <VislyRouteTracker pathname={window.location.pathname} />
      <Home />
    </VislyProvider>
  );
}

function Home() {
  const visly = useVisly();

  return (
    <button onClick={() => visly.track("cta_click", { label: "Sign Up" })}>
      Sign Up
    </button>
  );
}`}
        />

        {/* Angular */}
        <SubTitle id="angular">Angular</SubTitle>
        <p className="text-slate-600">
          Initialize Visly in your root module and use directives in templates
          to tag elements.
        </p>
        <CodeBlock
          filename="app.module.ts"
          language="angular"
          code={`import { VislyModule, VislyService } from "visly-sdk/angular";

@NgModule({
  imports: [BrowserModule, AppRoutingModule, VislyModule],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor(visly: VislyService) {
    visly.init({ projectId: "YOUR_PROJECT_ID" });
  }
}`}
        />
        <CodeBlock
          filename="app.module.ts"
          language="angular"
          code={`<button visly="signup_button">Sign Up</button>`}
        />

        {/* Vue 3 */}
        <SubTitle id="vue-3">Vue 3</SubTitle>
        <p className="text-slate-600">
          Register the Visly plugin in your app entrypoint, then use the
          composable in components.
        </p>
        <CodeBlock
          filename="main.ts"
          language="vue"
          code={`import { createApp } from "vue";
import App from "./App.vue";
import { VislyPlugin } from "visly-sdk/vue";

const app = createApp(App);
app.use(VislyPlugin, { projectId: "YOUR_PROJECT_ID" });
app.mount("#app");`}
        />
        <CodeBlock
          filename="VueComponent.ts"
          language="vue"
          code={`<script setup lang="ts">
import { useVisly } from "visly-sdk/vue";

const visly = useVisly();

function signup() {
  visly.track("signup_click");
}
</script>

<template>
  <button @click="signup">Sign Up</button>
</template>`}
        />
      </section>

      {/* API Reference */}
      <section className="space-y-6" id="api-reference">
        <SectionTitle id="api-reference">API Reference</SectionTitle>

        <SubTitle id="constructor">Constructor</SubTitle>
        <p className="text-slate-600">
          Create a new client instance with configuration options.
        </p>

        <CodeBlock
          filename="TypeScript"
          language="js"
          code={`const visly = new VislyClient(options);`}
        />

        <SubTitle id="client-options">Client Options</SubTitle>
        <Table
          head={["Option", "Type", "Default", "Description"]}
          rows={[
            [
              <code key="projectId">projectId</code>,
              "string",
              "—",
              "Required. Your project identifier.",
            ],
            [
              <code key="endpoint">endpoint</code>,
              "string",
              <code key="default">/api/e</code>,
              "API endpoint for event ingestion.",
            ],
            [
              <code key="flushInterval">flushInterval</code>,
              "number",
              "8000",
              "Flush interval in milliseconds.",
            ],
            [
              <code key="maxBatch">maxBatch</code>,
              "number",
              "40",
              "Maximum events per batch.",
            ],
            [
              <code key="sampleRate">sampleRate</code>,
              "number",
              "1",
              "Sampling rate between 0 and 1.",
            ],
            [
              <code key="errorSampleRate">errorSampleRate</code>,
              "number",
              "1",
              "Sampling rate for error events.",
            ],
            [
              <code key="captureText">captureText</code>,
              "boolean",
              "false",
              "Capture visible element text (hashed by default).",
            ],
            [
              <code key="debug">debug</code>,
              "boolean",
              "false",
              "Enable verbose console logging for development.",
            ],
          ]}
        />

        <SubTitle id="instance-methods">Instance Methods</SubTitle>
        <Table
          head={["Method", "Description"]}
          rows={[
            [
              <code key="track">
                track(name: string, props?: Record&lt;string, unknown&gt;)
              </code>,
              "Send an event with optional properties.",
            ],
            [
              <code key="identify">identify(id: string)</code>,
              "Set a persistent user ID.",
            ],
            [
              <code key="setSession">setSession(id: string)</code>,
              "Set or override session ID.",
            ],
            [
              <code key="flush">flush(beacon?: boolean)</code>,
              "Manually flush buffered events.",
            ],
          ]}
        />
      </section>

      {/* Data Collected */}
      <section className="space-y-6" id="data-collected">
        <SectionTitle id="data-collected">
          Data Collected per Event
        </SectionTitle>
        <Table
          head={["Field", "Description"]}
          rows={[
            ["event", "Event name (e.g. pageview, click)."],
            ["event_time", "Unix timestamp in milliseconds."],
            ["project_id", "Project identifier."],
            ["path", "Current pathname."],
            ["url", "Full page URL."],
            ["referrer", "Referrer URL."],
            ["viewport_w / viewport_h", "Viewport dimensions."],
            ["session_id / user_id", "Persistent UUID identifiers."],
            ["ua", "User-Agent string."],
            ["utm", "UTM params (source, medium, campaign, etc.)."],
            [
              "el_name, el_type, el_id, el_class",
              "Click target metadata.",
            ],
            ["el_text_hash", "SHA-256 hash of visible text of element."],
          ]}
        />

        <SubTitle id="example-payload">Example payload</SubTitle>
        <CodeBlock
          filename="JSON"
          language="json"
          code={`{
  "event": "click",
  "event_time": 1730567890123,
  "project_id": "demo",
  "path": "/pricing",
  "url": "https://example.com/pricing",
  "referrer": "https://google.com",
  "viewport_w": 1440,
  "viewport_h": 900,
  "session_id": "sess_123",
  "user_id": "user_abc",
  "ua": "Mozilla/5.0 ...",
  "utm": { "source": "google", "campaign": "ads" },
  "el_name": "signup_button",
  "el_text_hash": "ab12cdef..."
}`}
        />
      </section>

      {/* Features */}
      <section className="space-y-4" id="features">
        <SectionTitle id="features">Features</SectionTitle>
        <ul className="list-disc list-inside space-y-1 text-slate-700">
          <li>Automatic pageview & click tracking.</li>
          <li>Framework-agnostic (React, Angular, Vue, Vanilla JS).</li>
          <li>Event batching & background flushing.</li>
          <li>Fail-safe by design — never throws in production code paths.</li>
          <li>SSR-friendly usage patterns.</li>
          <li>Debug mode for development.</li>
          <li>NDJSON event output ready for ClickHouse / BigQuery pipelines.</li>
        </ul>
      </section>

      {/* Advanced Usage */}
      <section className="space-y-4" id="advanced-usage">
        <SectionTitle id="advanced-usage">Advanced Usage</SectionTitle>
        <CodeBlock
          filename="Advanced events"
          language="js"
          code={`// Track purchase event
visly.track("purchase", {
  order_id: "ORD123",
  amount: 2500,
  currency: "INR",
  coupon: "WELCOME50",
});

// Manual flush (e.g., before page unload)
window.addEventListener("beforeunload", () => visly.flush(true));`}
        />
      </section>

      {/* Debugging */}
      <section className="space-y-4" id="debugging">
        <SectionTitle id="debugging">Debugging</SectionTitle>
        <p className="text-slate-600">
          Enable debug mode during development to see detailed logs in the
          console.
        </p>
        <CodeBlock
          filename="Debug mode"
          language="js"
          code={`const visly = new VislyClient({ projectId: "demo", debug: true });`}
        />
        <CodeBlock
          filename="Example logs"
          language="js"
          code={`[visly] projectId not provided — client disabled
[visly] sendBeacon failed, falling back to fetch`}
        />
      </section>

      {/* Architecture */}
      <section className="space-y-4" id="architecture">
        <SectionTitle id="architecture">Architecture</SectionTitle>
        <p className="text-slate-600">
          Visly uses a buffer-first model to avoid blocking user interactions
          and to minimize network overhead.
        </p>
        <ul className="list-disc list-inside space-y-1 text-slate-700">
          <li>Events are queued in memory.</li>
          <li>
            At each <code className="font-mono">flushInterval</code> (default
            8000ms), a batch is sent as NDJSON to <code>/api/e</code>.
          </li>
          <li>
            If a request fails, events are requeued (up to a max queue size of
            ~1000 events).
          </li>
          <li>
            <code className="font-mono">navigator.sendBeacon</code> is used
            when the page unloads, with a fetch fallback.
          </li>
        </ul>
      </section>

      {/* Footer author block */}
      <section className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-600">
        <p className="font-semibold text-slate-800 mb-1">
          About the author – Nikhil Sai Ankilla
        </p>
        <p className="mb-2">
          Full Stack Developer • Open for SDE roles (Frontend / Backend / Full
          Stack / Platform).
        </p>
        <div className="flex flex-wrap gap-3 text-xs">
          <a
            href="mailto:nikhilsaiankilla@gmail.com"
            className="underline underline-offset-2"
          >
            nikhilsaiankilla@gmail.com
          </a>
          <a
            href="https://x.com/nikhilbuildss"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            @nikhilbuildss
          </a>
          <a
            href="https://nikhilsaiankilla.blog"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            Portfolio
          </a>
          <a
            href="https://www.linkedin.com/in/nikhilsaiankilla/"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            LinkedIn
          </a>
        </div>
      </section>
    </div>
  );
}
