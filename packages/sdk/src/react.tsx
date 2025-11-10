/**
 * Visly React bindings
 *
 * - Safe for SSR: the VislyClient is only created on the client.
 * - The client is created once per provider instance (useRef).
 * - useVisly() throws if used outside <VislyProvider> or before client creation.
 *
 * Usage (Next.js/SSR):
 *  - Wrap your _app.tsx / root with <VislyProvider projectId="...">.
 *  - Use VislyRouteTracker on client navigations (pass pathname).
 */

import React, { createContext, useContext, useRef, useEffect } from "react";
import { VislyClient, type VislyOptions } from "./browser";

const Ctx = createContext<VislyClient | null>(null);

/**
 * VislyProvider
 *
 * Creates the VislyClient once (client-side only) and provides it via context.
 * We intentionally do not recreate the client when props change, because re-creating
 * the client frequently can cause duplicate event listeners and duplicate pageviews.
 *
 * If you really need to recreate on options change, mount a new provider (unmount/mount).
 */
export function VislyProvider({ children, ...opts }: React.PropsWithChildren<VislyOptions>) {
    // store client in ref so it's stable across renders
    const ref = useRef<VislyClient | null>(null);

    // Create the client only on the client (avoid window/location access during SSR)
    if (typeof window !== "undefined" && ref.current === null) {
        try {
            // safe construction — VislyClient is defensive, but still guard
            ref.current = new VislyClient(opts as VislyOptions);
        } catch (err) {
            // swallow errors to avoid breaking host app — client will be null
            // In dev you may want to surface this by passing debug flag to VislyOptions
            // eslint-disable-next-line no-console
            console.warn("[visly] failed to initialize client", err);
            ref.current = null;
        }
    }

    return <Ctx.Provider value={ref.current}>{children}</Ctx.Provider>;
}

/**
 * useVisly
 *
 * Returns the VislyClient instance. Throws if the client is not available.
 * This encourages caller code to only call useVisly in client-only code (or
 * guard it using a `useEffect` / `typeof window !== 'undefined'`).
 */
export function useVisly(): VislyClient {
    const c = useContext(Ctx);
    if (!c) {
        // helpful error message to help integrators debug SSR/hydration issues
        throw new Error(
            "useVisly must be used inside <VislyProvider> and only on the client. " +
            "Wrap your app in <VislyProvider projectId='...'> and ensure calls to useVisly() run client-side."
        );
    }
    return c;
}

/** Fire a pageview whenever `pathname` changes (SPA/Next Router/etc.) */
export function VislyRouteTracker({ pathname }: { pathname: string }) {
    const visly = useVisly();
    // We intentionally only depend on pathname here. visly is stable from provider.
    useEffect(() => {
        try {
            visly.track("pageview");
        } catch (err) {
            // swallow to avoid breaking the host app; VislyClient itself is defensive too
            // eslint-disable-next-line no-console
            console.warn("[visly] track failed", err);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    return null;
}
