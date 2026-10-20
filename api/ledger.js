/**
 * DUET production file database — /api/ledger proxied to jsonbin.io.
 * The .json ledger document itself is unchanged; jsonbin just hosts it
 * so writes survive across devices. Same contract as the dev middleware:
 * GET  → { v, app, updatedAt, entries }
 * POST → validates { entries: [...] } and overwrites the bin
 */
const BASE = 'https://api.jsonbin.io/v3/b';

export default async function handler(req, res) {
  const key = process.env.JSONBIN_ACCESS_KEY;
  const bin = process.env.JSONBIN_BIN_ID;
  if (!key || !bin) {
    res.status(500).json({ ok: false, error: 'JSONBIN_ACCESS_KEY / JSONBIN_BIN_ID not set' });
    return;
  }
  const headers = { 'X-Access-Key': key };

  if (req.method === 'GET') {
    const r = await fetch(`${BASE}/${bin}/latest?c=false`, { headers });
    if (!r.ok) {
      res.status(502).json({ ok: false, error: `jsonbin GET failed (${r.status})` });
      return;
    }
    const body = await r.json();
    res.setHeader('Cache-Control', 'no-store');
    res.json(body?.record ?? { v: 1, app: 'duet-ledger', updatedAt: '', entries: [] });
    return;
  }

  if (req.method === 'POST') {
    if (!Array.isArray(req.body?.entries)) {
      res.status(400).json({ ok: false, error: 'body must be { entries: [...] }' });
      return;
    }
    const r = await fetch(`${BASE}/${bin}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    res
      .status(r.ok ? 200 : 502)
      .json(r.ok ? { ok: true } : { ok: false, error: `jsonbin PUT failed (${r.status})` });
    return;
  }

  res.status(405).end();
}
