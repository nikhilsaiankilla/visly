import { Injectable, Directive, Input, HostListener, NgModule } from "@angular/core";
import { VislyClient, type VislyOptions } from "./browser";
import { Router, NavigationEnd } from "@angular/router";
import { filter } from "rxjs/operators";

@Injectable({ providedIn: "root" })
export class VislyService {
    private client?: VislyClient;

    init(opts: VislyOptions) {
        if (this.client) return this.client;
        if (!opts.projectId) throw new Error("Visly: projectId is required");
        this.client = new VislyClient(opts);
        return this.client;
    }
    track(name: string, props?: Record<string, unknown>) { this.client?.track(name, props || {}); }
    identify(id: string) { this.client?.identify(id); }
    session(id: string) { this.client?.setSession(id); }
}

@Directive({ selector: "[visly]" })
export class VislyDirective {
    @Input("visly") name?: string;
    constructor(private visly: VislyService) { }
    @HostListener("click") onClick() { if (this.name) this.visly.track("click", { el_name: this.name }); }
}

@NgModule({ declarations: [VislyDirective], exports: [VislyDirective] })
export class VislyModule {
    constructor(router: Router, visly: VislyService) {
        router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => visly.track("pageview"));
    }
}
