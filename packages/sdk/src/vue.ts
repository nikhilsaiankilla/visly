// visly-vue-plugin.ts
import type { App, Plugin, InjectionKey } from "vue";
import { inject, getCurrentInstance } from "vue";
import { VislyClient, type VislyOptions } from "./browser";

/**
 * Visly plugin types
 */
export type VislyVueOptions = VislyOptions & { debug?: boolean };
export const VislyKey: InjectionKey<VislyClient | null> = Symbol("Visly");

/**
 * Tell TypeScript that globalThis has a __VISLY_CLIENT__ property.
 * Keep this declaration inside a module file (has at least one import/export).
 */
declare global {
    /** Global Visly analytics client reference (set by the plugin at runtime) */
    var __VISLY_CLIENT__: VislyClient | null | undefined;

    interface ComponentCustomProperties {
        /** Vue Options API access (this.$visly) */
        $visly?: VislyClient | null;
    }
}

/**
 * VislyPlugin
 *
 * - Safe for SSR (won't construct client on server).
 * - If opts.projectId missing, provides `null` (explicit no-op) instead of throwing.
 * - Exposes client via provide/inject, Options API ($visly), and typed global fallback.
 */
export const VislyPlugin: Plugin = {
    install(app: App, opts?: VislyVueOptions) {
        const debug = !!opts?.debug;

        // No projectId -> explicit no-op (helps integrators)
        if (!opts || !opts.projectId) {
            if (debug) console.warn("[visly] projectId not provided — client disabled");
            app.provide(VislyKey, null);
            app.config.globalProperties.$visly = null;
            if (typeof globalThis !== "undefined") globalThis.__VISLY_CLIENT__ = null;
            return;
        }

        // Create client only on client-side
        let client: VislyClient | null = null;
        try {
            if (typeof window !== "undefined") {
                client = new VislyClient(opts);
            } else {
                client = null;
            }
        } catch (err) {
            if (debug) console.error("[visly] failed to initialize VislyClient", err);
            client = null;
        }

        app.provide(VislyKey, client);
        app.config.globalProperties.$visly = client;
        if (typeof globalThis !== "undefined") globalThis.__VISLY_CLIENT__ = client;
    },
};

/**
 * useVisly()
 *
 * Composition API helper. Works inside setup() (inject), and outside setup() falls
 * back to currentInstance.appContext.provides or globalThis.__VISLY_CLIENT__.
 *
 * Throws when no client found to help integrators detect misconfiguration.
 */
export function useVisly(): VislyClient {
    // 1) Try inject() inside setup()
    try {
        const injected = inject(VislyKey, undefined);
        if (injected !== undefined) {
            if (injected === null) throw new Error("Visly is disabled (no projectId or running on server).");
            return injected;
        }
    } catch {
        // silent fallback to other strategies
    }

    // 2) Try currentInstance.appContext.provides (sometimes useful outside setup())
    try {
        const inst = getCurrentInstance();
        if (inst?.appContext?.provides) {
            const prov = inst.appContext.provides as Record<string | symbol, unknown>;
            const maybe = prov[VislyKey as any] as VislyClient | null | undefined;
            if (maybe !== undefined) {
                if (maybe === null) throw new Error("Visly is disabled (null client).");
                return maybe;
            }
        }
    } catch {
        // ignore and continue to global fallback
    }

    // 3) Typed global fallback (no any cast required because of declare global)
    if (typeof globalThis !== "undefined" && globalThis.__VISLY_CLIENT__) {
        return globalThis.__VISLY_CLIENT__ as VislyClient;
    }

    // Nothing found — give helpful guidance
    throw new Error(
        "useVisly(): Visly client not found. Ensure you called app.use(VislyPlugin, { projectId: '...' }) and that useVisly() runs on the client (not during SSR)."
    );
}
