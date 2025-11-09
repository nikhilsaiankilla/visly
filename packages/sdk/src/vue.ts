import type { App, Plugin, InjectionKey } from "vue";
import { VislyClient, type VislyOptions } from "./browser";

export type VislyVueOptions = VislyOptions;
export const VislyKey: InjectionKey<VislyClient> = Symbol("Visly");

export const VislyPlugin: Plugin = {
    install(app: App, opts?: VislyVueOptions) {
        if (!opts || !opts.projectId) throw new Error("Visly: projectId is required");
        const client = new VislyClient(opts);
        app.provide(VislyKey, client);
        (app.config.globalProperties as any).$visly = client;
    },
};

export function useVisly(): VislyClient {
    const inst = (globalThis as any).__VUE_APP__?.appContext?.provides?.[VislyKey as any];
    if (inst) return inst as VislyClient;
    // @ts-ignore - inject available at runtime in Vue SFCs
    const inj = (typeof inject !== "undefined") ? (inject as any)(VislyKey) : null;
    if (!inj) throw new Error("useVisly must be used after app.use(VislyPlugin, ...)");
    return inj;
}
