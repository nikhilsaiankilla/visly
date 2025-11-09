import { defineConfig } from "tsup";

export default defineConfig([
    {
        entry: { index: "src/index.ts" },
        dts: true,
        format: ["esm", "cjs"],
        sourcemap: true,
        clean: true,
        target: "es2022",
        minify: true
    },
    {
        entry: { react: "src/react.tsx" },
        dts: true,
        format: ["esm", "cjs"],
        sourcemap: true,
        clean: false,
        target: "es2022",
        minify: true,
        external: ["react"]
    },
    {
        entry: { vue: "src/vue.ts" },
        dts: true,
        format: ["esm", "cjs"],
        sourcemap: true,
        clean: false,
        target: "es2022",
        minify: true,
        external: ["vue"]
    },
    {
        entry: { angular: "src/angular.ts" },
        dts: true,
        format: ["esm", "cjs"],
        sourcemap: true,
        clean: false,
        target: "es2022",
        minify: true,
        external: ["@angular/core", "@angular/router", "rxjs", "rxjs/operators"]
    }
]);
