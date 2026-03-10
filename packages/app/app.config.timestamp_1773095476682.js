// app.config.ts
import { defineConfig as defineConfig2 } from "@tanstack/react-start/config";

// vite.config.ts
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
var vite_config_default = defineConfig({
  server: {
    port: 5173,
    watch: {
      ignored: ["**/.wrangler/**"]
    }
  },
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tanstackStart(),
    viteReact(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      "drizzle-orm": path.resolve(__dirname, "node_modules/drizzle-orm")
    }
  }
});

// app.config.ts
var app_config_default = defineConfig2({
  vite: vite_config_default
});
export {
  app_config_default as default
};
