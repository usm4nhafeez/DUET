import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type PluginOption } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * DUET file database — public/duet-ledger.json IS the storage.
 * GET  /api/ledger  → current file contents
 * POST /api/ledger  → writes the new ledger straight to disk
 */
function duetLedgerDb(): PluginOption {
  const file = path.resolve(__dirname, "public", "duet-ledger.json");
  return {
    name: "duet-ledger-db",
    configureServer(server) {
      server.middlewares.use("/api/ledger", (req, res) => {
        res.setHeader("Cache-Control", "no-store");
        if (req.method === "GET") {
          res.setHeader("Content-Type", "application/json");
          try {
            res.end(fs.readFileSync(file));
          } catch {
            res.end(JSON.stringify({ v: 1, app: "duet-ledger", entries: [] }));
          }
          return;
        }
        if (req.method === "POST") {
          let body = "";
          req.on("data", (c) => (body += c));
          req.on("end", () => {
            try {
              const parsed = JSON.parse(body) as { entries?: unknown };
              if (!Array.isArray(parsed?.entries)) {
                throw new Error("body must be { entries: [...] }");
              }
              fs.writeFileSync(file, JSON.stringify(parsed, null, 2));
              res.setHeader("Content-Type", "application/json");
              res.end('{"ok":true}');
            } catch (e) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ ok: false, error: (e as Error).message }));
            }
          });
          return;
        }
        res.statusCode = 405;
        res.end();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [duetLedgerDb(), react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
