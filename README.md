# DUET

A two-person meal ledger — Usman × Fasi. Track break-time and night meals, who paid what, who owes whom.

**The database is one JSON document.** Same shape everywhere:

```json
{ "v": 1, "app": "duet-ledger", "updatedAt": "ISO timestamp", "entries": [ ... ] }
```

An entry is either a `meal` (amounts paid by each side, `break`/`night` slot, `even`/`usman`/`fasi` split) or a `settle` (one hands the other cash). All totals and the balance are computed from the entries — nothing is stored twice.

## Storage modes

| Mode | Where data lives | Writes |
|------|-----------------|--------|
| `npm run dev` | `public/duet-ledger.json` on your disk | a Vite middleware serves `/api/ledger` (GET/POST straight to the file) |
| Deployed (Vercel) | a jsonbin.io bin holding the same JSON document | `api/ledger.js` serverless function proxies `/api/ledger` to jsonbin |
| Fallback (no endpoint reachable) | browser localStorage only | per-device, not shared |

When `/api/ledger` responds, the app shows **FILE DATABASE LIVE** and every change is pushed to the shared file (debounced 300 ms). On boot the file DB wins over localStorage; on the static fallback the bundled `public/duet-ledger.json` is adopted only if newer than what this browser last saved.

There is also an in-app **File Sync** panel (Chromium only): link a real `.json` on disk via the File System Access API and every edit writes to it, with the handle remembered across reloads.

## Run it

```bash
npm install
npm run dev        # http://localhost:5172 — writes to public/duet-ledger.json
npm run build      # single-file dist/index.html
node scripts/ledger-selfcheck.mjs   # tests for the Vercel function
```

## Deploy (Vercel + jsonbin)

1. Create a free account at [jsonbin.io](https://jsonbin.io) → API Keys → copy your **Access Key**.
2. Create a bin with: `{"v":1,"app":"duet-ledger","updatedAt":"","entries":[]}` → copy the **Bin ID**.
3. In the Vercel project → Settings → Environment Variables, set `JSONBIN_ACCESS_KEY` and `JSONBIN_BIN_ID` for Production (names documented in [.env.example](.env.example)).
4. Push to `main` — Vercel redeploys; open the site and confirm the FILE DATABASE LIVE banner.

Without those env vars `/api/ledger` returns 500 and the app falls back to per-device storage — it never crashes, it just doesn't sync. The access key lives only in Vercel; it is never bundled into the frontend.

## Layout

```
api/ledger.js          Vercel function — /api/ledger ⇄ jsonbin bin
vite.config.ts         dev middleware — /api/ledger ⇄ public/duet-ledger.json
public/duet-ledger.json  the ledger file itself (dev DB + static fallback)
src/lib/types.ts       entry shapes + computeStats (the only math)
src/lib/store.ts       localStorage mirror + tolerant JSON import
src/lib/filedb.ts      client for /api/ledger
src/lib/fileSync.ts    File System Access API plumbing
src/hooks/useFileSync.ts  auto-save / restore to a linked file
scripts/               self-checks
```
