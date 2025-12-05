// src/lib/instruction-steps.ts

export type FrameworkId = 'nextjs' | 'react' | 'vue' | 'angular' | 'vanilla';

export interface Step {
  id: string;
  title: string;
  description: string;
  code: (projectId: string) => string;
  language: string;
}

export const FRAMEWORKS: { id: FrameworkId; label: string }[] = [
  { id: 'nextjs', label: 'Next.js' },
  { id: 'react', label: 'React' },
  { id: 'vue', label: 'Vue 3' },
  { id: 'angular', label: 'Angular' },
  { id: 'vanilla', label: 'Vanilla JS' },
];

export const ONBOARDING_STEPS: Record<FrameworkId, Step[]> = {
  nextjs: [
    {
      id: "install",
      title: "Install the SDK",
      description: "Install the Visly package using your preferred package manager.",
      code: () => `npm install visly-sdk`,
      language: "bash"
    },
    {
      id: "provider",
      title: "Add Provider to Root Layout",
      description: "Wrap your application in the VislyProvider in your root layout file.",
      code: (projectId) => `// app/layout.tsx
import { VislyProvider } from "visly-sdk/react";

export default function RootLayout({ children }) {
  return (
    <VislyProvider projectId="${projectId}">
      {children}
    </VislyProvider>
  );
}`,
      language: "tsx"
    },
    {
      id: "usage",
      title: "Track Custom Events (Optional)",
      description: "Use the hook to track events in your client components.",
      code: () => `// app/page.tsx
"use client";
import { useVisly } from "visly-sdk/react";

export default function Home() {
  const visly = useVisly();

  return (
    <button onClick={() => visly.track("cta_click", { label: "Sign Up" })}>
      Sign Up
    </button>
  );
}`,
      language: "tsx"
    }
  ],

  react: [
    {
      id: "install",
      title: "Install the SDK",
      description: "Install the Visly package.",
      code: () => `npm install visly-sdk`,
      language: "bash"
    },
    {
      id: "setup",
      title: "Setup Provider & Tracker",
      description: "Wrap your App and add the RouteTracker to handle pageviews automatically.",
      code: (projectId) => `import { VislyProvider, VislyRouteTracker } from "visly-sdk/react";

export default function App() {
  return (
    <VislyProvider projectId="${projectId}">
      {/* Automatically tracks route changes */}
      <VislyRouteTracker pathname={window.location.pathname} />
      <Home />
    </VislyProvider>
  );
}`,
      language: "tsx"
    }
  ],

  vue: [
    {
      id: "install",
      title: "Install the SDK",
      description: "Install the Visly package.",
      code: () => `npm install visly-sdk`,
      language: "bash"
    },
    {
      id: "plugin",
      title: "Register the Plugin",
      description: "Add the VislyPlugin to your main application entry point.",
      code: (projectId) => `// main.ts
import { createApp } from "vue";
import App from "./App.vue";
import { VislyPlugin } from "visly-sdk/vue";

const app = createApp(App);
app.use(VislyPlugin, { projectId: "${projectId}" });
app.mount("#app");`,
      language: "typescript"
    },
    {
      id: "usage",
      title: "Usage in Components",
      description: "Track events inside your Vue components.",
      code: () => `<script setup lang="ts">
import { useVisly } from "visly-sdk/vue";

const visly = useVisly();

function signup() {
  visly.track("signup_click");
}
</script>

<template>
  <button @click="signup">Sign Up</button>
</template>`,
      language: "html"
    }
  ],

  angular: [
    {
      id: "install",
      title: "Install the SDK",
      description: "Install the Visly package.",
      code: () => `npm install visly-sdk`,
      language: "bash"
    },
    {
      id: "module",
      title: "Import Module",
      description: "Import VislyModule and initialize the service in your AppModule.",
      code: (projectId) => `// app.module.ts
import { VislyModule, VislyService } from "visly-sdk/angular";

@NgModule({
  imports: [BrowserModule, AppRoutingModule, VislyModule],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor(visly: VislyService) {
    visly.init({ projectId: "${projectId}" });
  }
}`,
      language: "typescript"
    },
    {
      id: "usage",
      title: "Track in Template",
      description: "Use the visly directive to track clicks directly in your templates.",
      code: () => `<button visly="signup_button">Sign Up</button>`,
      language: "html"
    }
  ],

  vanilla: [
    {
      id: "install",
      title: "Install the SDK",
      description: "Install the Visly package.",
      code: () => `npm install visly-sdk`,
      language: "bash"
    },
    {
      id: "init",
      title: "Initialize Client",
      description: "Import the client and initialize it with your project ID.",
      code: (projectId) => `import { VislyClient } from "visly-sdk";

const visly = new VislyClient({ projectId: "${projectId}" });

// Track a pageview
visly.track("pageview");`,
      language: "javascript"
    }
  ]
};