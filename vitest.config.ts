import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
    resolve: {
        alias: {
            "@": resolve(__dirname, "."),
        },
    },
    esbuild: {
        // Enable React JSX automatic runtime for .tsx test files
        jsx: "automatic",
        jsxImportSource: "react",
    },
    test: {
        environment: "node",
        environmentMatchGlobs: [
            // Use jsdom for React component tests
            ["**/*.test.tsx", "jsdom"],
        ],
    },
});
