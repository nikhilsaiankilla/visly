/**
 * Visly Angular integration
 *
 * - Safe for SSR (guards against missing window/localStorage/router).
 * - Non-throwing in production: if projectId is absent, the service becomes a no-op.
 * - Optional debug flag (pass { debug: true } to init for console warnings).
 * - Directive supports simple declarative click tracking: <button visly="cta">.
 *
 * Usage:
 *  - Import VislyModule in your AppModule.
 *  - Call vislyService.init({ projectId: '...', debug: true }) early in app bootstrap.
 *  - Use <button visly="signup"> to track clicks.
 *  - Pageviews are tracked automatically on NavigationEnd (if Router present).
 */

import { Injectable, Directive, Input, HostListener, NgModule, Optional, Inject, Injector } from "@angular/core";
import { VislyClient, type VislyOptions } from "./browser";
import { Router, NavigationEnd } from "@angular/router";
import { filter } from "rxjs/operators";
import { Subscription } from "rxjs";

@Injectable({ providedIn: "root" })
export class VislyService {
    private client?: VislyClient | null = null;
    private enabled = false;
    private routeSub?: Subscription;

    /**
     * Initialize the Visly client.
     * - opts.projectId is recommended; if missing the client will be disabled (no-op).
     * - returns the internal client when created, otherwise undefined.
     */
    init(opts: VislyOptions): VislyClient | undefined {
        try {
            // Defensive: if already initialized return existing client (even if null)
            if (this.client !== undefined && this.client !== null) return this.client || undefined;

            // If projectId is missing, do not throw — make service a no-op.
            if (!opts || !opts.projectId) {
                if ((opts as any)?.debug) {
                    // eslint-disable-next-line no-console
                    console.warn("[visly] init called without projectId — client disabled");
                }
                this.client = null;
                this.enabled = false;
                return undefined;
            }

            // Safe construct — VislyClient itself is defensive but we still guard.
            try {
                this.client = new VislyClient(opts);
                this.enabled = true;
                return this.client;
            } catch (err) {
                // Initialization failed — disable analytics and surface debug warning if asked.
                if ((opts as any)?.debug) {
                    // eslint-disable-next-line no-console
                    console.error("[visly] failed to initialize VislyClient", err);
                }
                this.client = null;
                this.enabled = false;
                return undefined;
            }
        } catch (err) {
            // Extremely defensive fallback — never throw to host app
            // eslint-disable-next-line no-console
            console.warn("[visly] unexpected init error", err);
            this.client = null;
            this.enabled = false;
            return undefined;
        }
    }

    /** Track a named event with optional properties. Safe no-op if not initialized. */
    track(name: string, props?: Record<string, unknown>) {
        try {
            if (!this.enabled || !this.client) return;
            this.client.track(name, props || {});
        } catch (err) {
            // Swallow internal errors to avoid breaking host app; surface in debug if needed.
            // eslint-disable-next-line no-console
            (this.client && (this.client as any).cfg?.debug) ? console.error("[visly] track error", err) : void 0;
        }
    }

    identify(id: string) {
        try {
            if (!this.enabled || !this.client) return;
            this.client.identify(id);
        } catch (_) { /* swallow */ }
    }

    session(id: string) {
        try {
            if (!this.enabled || !this.client) return;
            this.client.setSession(id);
        } catch (_) { /* swallow */ }
    }

    /**
     * Optional helper: attach automatic pageview tracking to an Angular Router.
     * The method subscribes and keeps the Subscription so it can be torn down if needed.
     * It will be a no-op if Router isn't present or the service isn't enabled.
     */
    attachRouter(router?: Router) {
        try {
            if (!router || !router.events || !this.enabled) return;
            // avoid double subscription
            if (this.routeSub && !this.routeSub.closed) return;

            this.routeSub = router.events
                .pipe(filter((e) => e instanceof NavigationEnd))
                .subscribe(() => {
                    try { this.track("pageview"); } catch (_) { /* swallow */ }
                });
        } catch (err) {
            // eslint-disable-next-line no-console
            if ((this.client as any)?.cfg?.debug) console.warn("[visly] attachRouter failed", err);
        }
    }

    /** Optional: detach router subscription (if you want to cleanup manually). */
    detachRouter() {
        try {
            if (this.routeSub) {
                this.routeSub.unsubscribe();
                this.routeSub = undefined;
            }
        } catch (_) { /* swallow */ }
    }
}

/**
 * Simple directive to track clicks declaratively:
 * <button visly="signup">Sign up</button>
 *
 * If no value provided to `visly`, it still tracks a click (event name 'click').
 * The directive is defensive (no-op) if VislyService wasn't initialized.
 */
@Directive({ selector: "[visly]" })
export class VislyDirective {
    @Input("visly") name?: string;

    constructor(private visly: VislyService) { }

    @HostListener("click", ["$event"])
    onClick(event: Event) {
        try {
            // Prefer the provided name; fall back to element id/class to give context.
            const payload: Record<string, unknown> = {};
            if (this.name) payload.el_name = this.name;
            else {
                const target = event.target as HTMLElement | null;
                if (target) {
                    payload.el_id = target.id || undefined;
                    // Avoid sending raw innerText (PII). We only send id/class for context.
                    payload.el_class = (target.className && typeof target.className === "string") ? target.className : undefined;
                }
            }
            this.visly.track("click", payload);
        } catch (err) {
            // swallow to avoid breaking host app
            // eslint-disable-next-line no-console
            (this.visly as any)?.client && (this.visly as any).client.cfg?.debug ? console.error("[visly] directive click error", err) : void 0;
        }
    }
}

/**
 * Module that exports the directive and wires up automatic pageview tracking
 * if Router is available and the VislyService has been initialized.
 *
 * Note: to make router-based pageview tracking work reliably, call vislyService.init(...)
 * early in your app bootstrap (e.g. in AppComponent constructor or an APP_INITIALIZER).
 */
@NgModule({ declarations: [VislyDirective], exports: [VislyDirective] })
export class VislyModule {
    constructor(injector: Injector, visly: VislyService | null) {
        // Resolve router optionally via injector.get(token, defaultValue)
        // Injector.get accepts a default value to return when token isn't provided.
        const router = injector.get(Router, null);

        try {
            if (router && visly) {
                router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => visly.track("pageview"));
            }
        } catch (err) {
            // swallow errors in production (or log if you have debug enabled)
            // eslint-disable-next-line no-console
            console.warn("[visly] failed to attach router subscription", err);
        }
    }
}
