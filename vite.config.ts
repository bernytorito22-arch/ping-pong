import path from "node:path";
import { fileURLToPath } from "node:url";
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";

const projectRoot = path.resolve(fileURLToPath(new URL(".", import.meta.url)));

export default defineConfig({
  root: path.join(projectRoot, "src/client"),
  plugins: [
    cloudflare({
      configPath: path.join(projectRoot, "wrangler.jsonc"),
    }),
  ],
});
