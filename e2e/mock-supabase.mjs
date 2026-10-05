// Local, in-memory mock of the Supabase HTTP API (Auth + PostgREST subset) for e2e tests and QA.
// Never touches the network. Start: `node e2e/mock-supabase.mjs` (MOCK_PORT, default 54399).
// Control: POST /__reset  {"seed": true|false}   GET /__state
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { seedTables } from './seed.mjs';

const PORT = Number(process.env.MOCK_PORT || 54399);
const USER_ID = '00000000-0000-0000-0000-000000000001';
const USER_EMAIL = process.env.MOCK_USER_EMAIL || 'qa-owner@example.com';
let tables = new Map();

function reset(seed) {
  tables = new Map();
  if (seed) for (const [name, rows] of Object.entries(seedTables(USER_ID))) tables.set(name, rows.map(r => ({ ...r })));
}
reset(process.env.MOCK_SEED === '1');
const tbl = (n) => { if (!tables.has(n)) tables.set(n, []); return tables.get(n); };

const cors = {
  'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*',
  'Access-Control-Expose-Headers': '*', 'Content-Type': 'application/json',
};
const send = (res, code, body, extra = {}) => { res.writeHead(code, { ...cors, ...extra }); res.end(body === undefined ? '' : JSON.stringify(body)); };

function likeToRe(p) {
  const esc = String(p).replace(/\\(.)/g, '\u0000$1').replace(/[.+^${}()|[\]]/g, '\\$&').replace(/\*|%/g, '.*').replace(/_/g, '.');
  return new RegExp('^' + esc.replace(/\u0000(.)/g, (_, c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) + '$', 'i');
}
function cmp(a, b) { if (a === b) return 0; if (a === null || a === undefined) return 1; if (b === null || b === undefined) return -1; return a < b ? -1 : 1; }

function matchOne(row, col, spec) {
  const dot = spec.indexOf('.');
  let op = spec.slice(0, dot), val = spec.slice(dot + 1), neg = false;
  if (op === 'not') { neg = true; const d2 = val.indexOf('.'); op = val.slice(0, d2); val = val.slice(d2 + 1); }
  const v = row[col];
  let ok;
  switch (op) {
    case 'eq': ok = String(v) === val; break;
    case 'neq': ok = String(v) !== val; break;
    case 'gt': ok = v > val; break; case 'gte': ok = v >= val; break;
    case 'lt': ok = v < val; break; case 'lte': ok = v <= val; break;
    case 'like': case 'ilike': ok = likeToRe(val).test(String(v ?? '')); break;
    case 'is': ok = val === 'null' ? v === null || v === undefined : val === 'true' ? v === true : v === false; break;
    case 'in': { const list = val.replace(/^\(|\)$/g, '').split(',').map(s => s.replace(/^"|"$/g, '')); ok = list.includes(String(v)); break; }
    case 'cs': ok = Array.isArray(v) && val.replace(/^\{|\}$/g, '').split(',').every(x => v.includes(x)); break;
    case 'fts': case 'plfts': case 'wfts': case 'phfts': {
      const q = val.replace(/^\([a-z]+\)\./, '').toLowerCase();
      const hay = `${row.title ?? ''} ${row.body ?? ''} ${(row.tags || []).join(' ')}`.toLowerCase();
      ok = q.split(/\s+/).filter(Boolean).every(w => hay.includes(w)); break;
    }
    default: ok = true;
  }
  return neg ? !ok : ok;
}
function splitTop(s) { const out = []; let d = 0, cur = ''; for (const ch of s) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && d === 0) { out.push(cur); cur = ''; } else cur += ch; } if (cur) out.push(cur); return out; }
function filterRows(rows, params) {
  return rows.filter(row => {
    for (const [k, v] of params) {
      if (['select', 'order', 'limit', 'offset', 'on_conflict', 'columns'].includes(k)) continue;
      if (k === 'or') { const parts = splitTop(v.replace(/^\(|\)$/g, '')); if (!parts.some(p => { const i = p.indexOf('.'); return matchOne(row, p.slice(0, i), p.slice(i + 1)); })) return false; continue; }
      if (!matchOne(row, k, v)) return false;
    }
    return true;
  });
}

http.createServer((req, res) => {
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', () => {
    try { handle(req, res, Buffer.concat(chunks).toString('utf8')); }
    catch (e) { send(res, 500, { message: 'mock error: ' + e.message }); }
  });
}).listen(PORT, '127.0.0.1', () => console.log(`mock supabase on ${PORT}`));

function handle(req, res, raw) {
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  if (p === '/__reset') { let b = {}; try { b = JSON.parse(raw || '{}'); } catch {} reset(!!b.seed); return send(res, 200, { ok: true }); }
  if (p === '/__state') return send(res, 200, Object.fromEntries([...tables].map(([k, v]) => [k, v.length])));
  if (p.startsWith('/auth/v1/')) {
    const user = { id: USER_ID, aud: 'authenticated', role: 'authenticated', email: USER_EMAIL, app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' };
    if (p.endsWith('/user')) return (req.headers.authorization || '').startsWith('Bearer ') ? send(res, 200, user) : send(res, 401, { code: 401, msg: 'no token' });
    if (p.endsWith('/token')) return send(res, 200, { access_token: 'mock.token.x', token_type: 'bearer', expires_in: 3600, refresh_token: 'mock', user });
    return send(res, 200, {});
  }
  if (p.startsWith('/rest/v1/rpc/')) return send(res, 200, []);
  if (!p.startsWith('/rest/v1/')) return send(res, 404, {});
  const name = p.slice('/rest/v1/'.length);
  const rows = tbl(name);
  const single = (req.headers.accept || '').includes('vnd.pgrst.object');
  const wantsRep = /return=representation/.test(req.headers.prefer || '');
  const m = req.method;
  const body = raw ? JSON.parse(raw) : null;
  const out = (list, code = 200) => {
    if (single) return list.length === 1 ? send(res, code, list[0]) : send(res, 406, { code: 'PGRST116', message: 'The result contains ' + list.length + ' rows', details: null, hint: null });
    return send(res, code, list, { 'Content-Range': `0-${Math.max(list.length - 1, 0)}/${list.length}` });
  };
  if (m === 'GET' || m === 'HEAD') {
    let list = filterRows(rows, url.searchParams);
    const order = url.searchParams.get('order');
    if (order) for (const part of order.split(',').reverse()) { const [c, dir] = part.split('.'); list = [...list].sort((a, b) => (dir === 'desc' ? -1 : 1) * cmp(a[c], b[c])); }
    const off = Number(url.searchParams.get('offset') || 0), lim = url.searchParams.get('limit');
    list = list.slice(off, lim ? off + Number(lim) : undefined);
    return out(list);
  }
  if (m === 'POST') {
    const items = Array.isArray(body) ? body : [body];
    const upsert = /resolution=(merge|ignore)-duplicates/.test(req.headers.prefer || '');
    const made = [];
    for (const it of items) {
      const now = new Date().toISOString();
      if (upsert) {
        const keys = (url.searchParams.get('on_conflict') || 'id').split(',');
        const ex = rows.find(r => keys.every(k => it[k] !== undefined && r[k] === it[k]));
        if (ex) { Object.assign(ex, it, { updated_at: now }); made.push(ex); continue; }
      }
      const row = { id: randomUUID(), created_at: now, updated_at: now, ...it };
      rows.push(row); made.push(row);
    }
    return wantsRep ? out(made, 201) : send(res, 201, undefined);
  }
  if (m === 'PATCH') {
    const hit = filterRows(rows, url.searchParams);
    for (const r of hit) Object.assign(r, body, { updated_at: new Date().toISOString() });
    return wantsRep ? out(hit) : send(res, 204, undefined);
  }
  if (m === 'DELETE') {
    const hit = new Set(filterRows(rows, url.searchParams));
    tables.set(name, rows.filter(r => !hit.has(r)));
    return wantsRep ? out([...hit]) : send(res, 204, undefined);
  }
  send(res, 405, {});
}
