import type { Entry } from './types';
import { parseImported, toJson } from './store';

/**
 * Client for the DUET file database (public/duet-ledger.json served by
 * the dev-server middleware). On a static deploy the endpoint does not
 * exist — fetchDbLedger() then returns null and the UI falls back to the
 * bundled file + browser storage.
 */
export async function fetchDbLedger(): Promise<Entry[] | null> {
  try {
    const res = await fetch('/api/ledger', { cache: 'no-store' });
    if (!res.ok) return null;
    // SPA fallback would serve index.html — demand real JSON
    if (!(res.headers.get('content-type') ?? '').includes('json')) return null;
    const raw = await res.text();
    if (!raw.trim()) return null;
    return parseImported(raw);
  } catch {
    return null;
  }
}

export async function pushDbLedger(entries: Entry[]): Promise<boolean> {
  try {
    const res = await fetch('/api/ledger', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: toJson(entries),
    });
    return res.ok;
  } catch {
    return false;
  }
}
