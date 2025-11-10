# Visly SDK

**Lightweight, privacy-safe web analytics SDK** — built for modern frameworks.  

Track pageviews, clicks, and custom events across **React**, **Angular**, and **Vue** apps with a single drop-in client.  
Visly is framework-agnostic, lightweight, and designed to never block or break your app — even if analytics fails.

---

## Installation

```bash
npm install visly-sdk
# or
yarn add visly-sdk
# or
pnpm add visly-sdk
```

#### Quick Start (Vanilla JS)

```bash
import { VislyClient } from "visly-sdk";

const visly = new VislyClient({ projectId: "YOUR_PROJECT_ID" });

// Track a pageview
visly.track("pageview");

// Track a custom event
visly.track("signup_click", { plan: "pro", source: "landing" });
```

## Framework Integrations
#### React 

```bash
import { VislyProvider, useVisly, VislyRouteTracker } from "visly-sdk/react";

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
}
```

#### Angular

```bash
// app.module.ts
import { VislyModule, VislyService } from "visly-sdk/angular";

@NgModule({
  imports: [BrowserModule, AppRoutingModule, VislyModule],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor(visly: VislyService) {
    visly.init({ projectId: "YOUR_PROJECT_ID" });
  }
}
```
In your template:

```bash
    <button visly="signup_button">Sign Up</button>
```

#### Vue 3

```bash
// main.ts
import { createApp } from "vue";
import App from "./App.vue";
import { VislyPlugin } from "visly-sdk/vue";

const app = createApp(App);
app.use(VislyPlugin, { projectId: "YOUR_PROJECT_ID" });
app.mount("#app");
```

In your component:

```bash
<script setup lang="ts">
import { useVisly } from "visly-sdk/vue";

const visly = useVisly();

function signup() {
  visly.track("signup_click");
}
</script>

<template>
  <button @click="signup">Sign Up</button>
</template>
```

## API Reference
new VislyClient(options)

| Option            | Type      | Default  | Description                               |
| ----------------- | --------- | -------- | ----------------------------------------- |
| `projectId`       | `string`  | —        | **Required.** Your project identifier.    |
| `endpoint`        | `string`  | `/api/e` | API endpoint for event ingestion.         |
| `flushInterval`   | `number`  | `8000`   | Flush interval (ms).                      |
| `maxBatch`        | `number`  | `40`     | Max events per batch.                     |
| `sampleRate`      | `number`  | `1`      | Sampling rate (0–1).                      |
| `errorSampleRate` | `number`  | `1`      | Sampling for error events.                |
| `captureText`     | `boolean` | `false`  | Capture visible text (hashed by default). |
| `debug`           | `boolean` | `false`  | Enable verbose console logging.           |

## Instance Methods

| Method                                                 | Description                     |
| ------------------------------------------------------ | ------------------------------- |
| `track(name: string, props?: Record<string, unknown>)` | Send an event.                  |
| `identify(id: string)`                                 | Set a persistent user ID.       |
| `setSession(id: string)`                               | Set or override session ID.     |
| `flush(beacon?: boolean)`                              | Manually flush buffered events. |

## Data Collected per Event

| Field                                     | Description                                |
| ----------------------------------------- | ------------------------------------------ |
| `event`                                   | Event name (`pageview`, `click`, etc.).    |
| `event_time`                              | Unix timestamp (ms).                       |
| `project_id`                              | Project identifier.                        |
| `path`                                    | Current pathname.                          |
| `url`                                     | Full page URL.                             |
| `referrer`                                | Referrer URL.                              |
| `viewport_w` / `viewport_h`               | Viewport dimensions.                       |
| `session_id` / `user_id`                  | Persistent UUIDs.                          |
| `ua`                                      | User-Agent string.                         |
| `utm`                                     | UTM parameters (source, medium, campaign). |
| `el_name`, `el_type`, `el_id`, `el_class` | Click target metadata.                     |
| `el_text_hash`                            | SHA-256 of inner text.                     |

## Example payload:

```bash
{
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
}
```

## Features
- Automatic pageview + click tracking
- Framework-agnostic (React, Angular, Vue, Vanilla)
- Event batching & background flushing
- 100% safe — never throws
- SSR-friendly
- Debug mode for development
- NDJSON event output for ClickHouse / BigQuery ingestion

## Advanced Usage

```bash
// Track purchase event
visly.track("purchase", {
  order_id: "ORD123",
  amount: 2500,
  currency: "INR",
  coupon: "WELCOME50",
});

// Manual flush (e.g., before page unload)
window.addEventListener("beforeunload", () => visly.flush(true));
```

## Debugging
```bash
const visly = new VislyClient({ projectId: "demo", debug: true });
```

# Console logs:
```bash 
[visly] projectId not provided — client disabled
[visly] sendBeacon failed, falling back to fetch
```

## Architecture

Visly uses a buffer-first model:

- Events are queued in memory.
- Every flushInterval (default 8s) → batch is sent as NDJSON to /api/e.
- If request fails → events are requeued (up to 1000 max).
- sendBeacon() is used when page unloads.

---

### Hi, I'm **Nikhil Sai Ankilla**
Full Stack Developer • Open for **SDE roles (Frontend / Backend / Full Stack / Platform)**  

**Email:** [nikhilsaiankilla@gmail.com](mailto:nikhilsaiankilla@gmail.com)  
**X (Twitter):** [@nikhilbuildss](https://x.com/nikhilbuildss)  
**Portfolio:** [https://nikhilsaiankilla.blog](https://nikhilsaiankilla.blog)  
**Linkedin:** [@nikhilsaiankilla](https://www.linkedin.com/in/nikhilsaiankilla/)  

Passionate about building scalable web apps, devtools, and developer platforms.

---
