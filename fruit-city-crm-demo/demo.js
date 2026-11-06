// Fruit City CRM demo runtime: a stand-in for Cloudflare (Worker + D1 + R2 + Access) that runs in the browser.
// Every call the UI makes to /api/... is answered by the real API code (crm-core.js) against an
// in-memory SQLite database. Nothing leaves the browser except the map tiles and OpenStreetMap lookups
// the real CRM also uses. Reloading the page resets everything.
(() => {
  const SQL_JS = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/';
  const ME = { username: 'demo', role: 'admin' }; // the demo visitor is an admin so every screen is visible
  const realFetch = window.fetch.bind(window);
  const files = new Map(); // attachment key -> Blob (stands in for the R2 bucket)
  const blobUrls = new Map();
  let core, env;

  const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });

  // Just enough of the D1 API for the Worker: prepare().bind().first()/all()/run(), and batch().
  function d1(db) {
    const rows = (sql, binds) => {
      const s = db.prepare(sql);
      try {
        s.bind(binds.map((v) => (v === undefined ? null : typeof v === 'boolean' ? Number(v) : v)));
        const out = [];
        while (s.step()) out.push(s.getAsObject());
        return out;
      } finally { s.free(); }
    };
    const stmt = (sql, binds = []) => ({
      bind: (...b) => stmt(sql, b),
      all: async () => ({ results: rows(sql, binds), success: true }),
      first: async (col) => { const r = rows(sql, binds)[0]; return r == null ? null : col ? r[col] : r; },
      run: async () => { rows(sql, binds); return { success: true, meta: { changes: db.getRowsModified() } }; },
    });
    return {
      prepare: (sql) => stmt(sql),
      batch: async (list) => { const r = []; for (const s of list) r.push(await s.run()); return r; },
      exec: async (sql) => db.exec(sql),
    };
  }

  // Stands in for the R2 bucket: files stay in this tab's memory.
  const media = {
    async put(key, body) { files.set(key, body instanceof Blob ? body : await new Response(body).blob()); },
    async get(key) {
      const b = files.get(key);
      return b ? { body: b, size: b.size, httpEtag: '"demo"', range: null, writeHttpMetadata: (h) => h.set('content-type', b.type) } : null;
    },
    async delete(keys) {
      for (const k of [].concat(keys)) {
        files.delete(k);
        if (blobUrls.has(k)) { URL.revokeObjectURL(blobUrls.get(k)); blobUrls.delete(k); }
      }
    },
  };

  const ready = (async () => {
    const [SQL, mod, schema, seed] = await Promise.all([
      window.initSqlJs({ locateFile: (f) => SQL_JS + f }),
      import('./crm-core.js'),
      import('./schema.js'),
      import('./seed.js'),
    ]);
    const db = new SQL.Database();
    db.exec('PRAGMA foreign_keys = ON;');
    db.exec(schema.default);
    db.exec(seed.default);
    env = { DB: d1(db), MEDIA: media };
    core = mod;
    // Let the real code work out the automatic tags for the sample records
    for (const t of ['organizations', 'contacts']) {
      for (const { id } of db.exec(`SELECT id FROM ${t}`)[0]?.values.map(([id]) => ({ id })) || []) {
        await handle(`/api/${t}/${id}`, { method: 'PUT', body: '{}' });
      }
    }
  })().catch((e) => {
    console.error(e);
    document.addEventListener('DOMContentLoaded', () => document.body.insertAdjacentHTML('afterbegin',
      '<div class="demo-banner">The demo could not start in this browser. Try a current version of Chrome, Edge, Firefox or Safari.</div>'));
    throw e;
  });

  async function handle(path, init = {}) {
    const url = new URL(path, 'https://crm-demo.invalid');
    const method = (init.method || 'GET').toUpperCase();
    const body = init.body ?? null;
    const headers = new Headers(init.headers || {});
    let size = 0;
    if (body instanceof Blob) { size = body.size; if (!headers.has('content-type')) headers.set('content-type', body.type); }
    else if (typeof body === 'string') size = new TextEncoder().encode(body).length;
    const request = {
      method, url: url.href, body,
      headers: { get: (n) => (n.toLowerCase() === 'content-length' ? (size ? String(size) : null) : headers.get(n)) },
      json: async () => JSON.parse(typeof body === 'string' ? body : await new Response(body).text()),
    };
    let res;
    try { res = await core.api(request, env, url, ME); } catch (e) { res = json({ error: e.message }, 500); }

    // Attachment links point at /api/attachments/<id>/file, which only a real server could answer.
    // Swap them for in-memory blob: links so photos and videos show up.
    if (url.pathname.startsWith('/api/attachments') && (res.headers.get('content-type') || '').includes('json')) {
      const data = await res.json();
      const fix = async (r) => {
        if (!r || !r.id || !r.url) return r;
        const row = await env.DB.prepare('SELECT r2_key FROM attachments WHERE id=?').bind(r.id).first();
        const blob = row && files.get(row.r2_key);
        if (blob) { if (!blobUrls.has(row.r2_key)) blobUrls.set(row.r2_key, URL.createObjectURL(blob)); r.url = blobUrls.get(row.r2_key); }
        return r;
      };
      const fixed = Array.isArray(data) ? await Promise.all(data.map(fix)) : await fix(data);
      res = json(fixed, res.status);
    }
    return res;
  }

  window.fetch = async (input, init) => {
    const u = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (!u.startsWith('/api/')) return realFetch(input, init);
    await ready;
    return handle(u, init);
  };

  // The real UI uploads with XMLHttpRequest to show progress; build.mjs points it here instead.
  window.__crmDemoUpload = async (table, id, file, onProgress) => {
    const r = await window.fetch(`/api/attachments?${new URLSearchParams({ table, id, name: file.name || 'pasted image' })}`,
      { method: 'POST', headers: { 'content-type': file.type }, body: file });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || `Upload failed (${r.status})`);
    if (onProgress) onProgress(1);
    return d;
  };
})();
