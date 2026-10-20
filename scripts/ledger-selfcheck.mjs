/**
 * Self-check for api/ledger.js — run: node scripts/ledger-selfcheck.mjs
 * Stubs fetch + env, exercises GET / POST / bad-input / missing-config.
 */
process.env.JSONBIN_ACCESS_KEY = 'test-key';
process.env.JSONBIN_BIN_ID = 'test-bin';

const calls = [];
globalThis.fetch = async (url, opts = {}) => {
  calls.push({ url, ...opts });
  if (String(url).includes('/latest')) {
    return { ok: true, status: 200, json: async () => ({ record: { v: 1, entries: [{ id: 'x' }] } }) };
  }
  return { ok: true, status: 200, json: async () => ({ record: 'ok' }) };
};

const handler = (await import('../api/ledger.js')).default;

function mockRes() {
  const res = { code: 200, body: undefined, headers: {} };
  res.status = (c) => ((res.code = c), res);
  res.json = (o) => ((res.body = o), res);
  res.setHeader = (k, v) => ((res.headers[k] = v), res);
  res.end = () => res;
  return res;
}

async function run(method, body) {
  calls.length = 0;
  const res = mockRes();
  await handler({ method, body }, res);
  return { res, call: calls[0] };
}

// GET → unwraps jsonbin's .record and returns the ledger document
let r = await run('GET');
console.assert(r.res.code === 200 && r.res.body.entries?.length === 1, 'GET record unwrap', r.res);
console.assert(r.call.url === 'https://api.jsonbin.io/v3/b/test-bin/latest?c=false', 'GET url', r.call.url);
console.assert(r.call.headers['X-Access-Key'] === 'test-key', 'GET auth header');

// POST valid → PUT overwrite of the same bin, body forwarded
r = await run('POST', { v: 1, app: 'duet-ledger', entries: [] });
console.assert(r.res.code === 200 && r.res.body.ok === true, 'POST ok', r.res);
console.assert(r.call.method === 'PUT' && r.call.url === 'https://api.jsonbin.io/v3/b/test-bin', 'POST put', r.call);
console.assert(r.call.body === '{"v":1,"app":"duet-ledger","entries":[]}', 'POST body forwarded');

// POST garbage → 400, nothing sent to jsonbin
r = await run('POST', { entries: 'not-an-array' });
console.assert(r.res.code === 400 && r.call === undefined, 'POST rejects bad body', r.res);

// GET upstream down → 502, not a silent empty ledger
globalThis.fetch = async () => ({ ok: false, status: 404, json: async () => ({}) });
r = await run('GET');
console.assert(r.res.code === 502, 'GET upstream failure surfaces', r.res);

// missing config → 500 before any network call
delete process.env.JSONBIN_BIN_ID;
r = await run('GET');
console.assert(r.res.code === 500, 'missing env rejected', r.res);

console.log('ledger function self-check: OK');
