import React, { createContext, useContext, useMemo } from "react";
import { VislyClient, type VislyOptions } from "./browser";

const Ctx = createContext<VislyClient | null>(null);

export function VislyProvider({ children, ...opts }: React.PropsWithChildren<VislyOptions>) {
    const client = useMemo(() => new VislyClient(opts), []);
    return <Ctx.Provider value={client}>{children}</Ctx.Provider>;
}

export function useVisly() {
    const c = useContext(Ctx);
    if (!c) throw new Error("useVisly must be used inside <VislyProvider>");
    return c;
}

/** Fire a pageview whenever `pathname` changes (SPA/Next Router/etc.) */
export function VislyRouteTracker({ pathname }: { pathname: string }) {
    const visly = useVisly();
    React.useEffect(() => { visly.track("pageview"); }, [pathname]); // eslint-disable-line
    return null;
}
