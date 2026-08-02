// Shared Vite config for TanStack Start (React, Tailwind, path aliases, Nitro).
// Do not re-add those plugins manually or the app will break with duplicates.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    server: { entry: "server" },
  },
});
