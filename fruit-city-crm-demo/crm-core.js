// Generated from crm/src/index.js by crm/demo/build.mjs. Do not edit.
// Fruit City Worldwide CRM — Cloudflare Worker + D1
// Auth: Cloudflare Access (email one-time code) in front of the whole site.
// The Worker verifies the Access JWT and maps the email to a row in `users` (role: admin/member).
// Members see only the records they created themselves; admins see everything.
const HTML = ''; // the demo serves ui.html itself
const WORSHIP_TYPES = ['church', 'mosque', 'synagogue', 'hindu temple', 'buddhist temple', 'gurdwara'];
const ORG_TYPES = [...WORSHIP_TYPES, 'nonprofit', 'community center', 'school', 'business', 'government', 'foundation', 'other'];
const ORG_STATUS = ['prospect', 'contacted', 'engaged', 'partner', 'inactive'];
// Denomination / tradition choices depend on the organization type ("other" lets people type their own)
const DENOMINATIONS = {
  church: ['non-denominational', 'Baptist', 'Catholic', 'Methodist', 'Pentecostal', 'Assemblies of God', 'Church of Christ', 'Lutheran', 'Presbyterian', 'Episcopal / Anglican', 'AME / AME Zion', 'Orthodox', 'Seventh-day Adventist', 'Latter-day Saints', 'other'],
  mosque: ['Sunni', 'Shia', 'Ahmadiyya', 'Sufi', 'non-denominational', 'other'],
  synagogue: ['Orthodox', 'Conservative', 'Reform', 'Reconstructionist', 'non-denominational', 'other'],
  'hindu temple': ['Vaishnava', 'Shaiva', 'Shakta', 'Smarta', 'ISKCON', 'BAPS / Swaminarayan', 'non-denominational', 'other'],
  'buddhist temple': ['Theravada', 'Mahayana', 'Zen', 'Vajrayana / Tibetan', 'Pure Land', 'non-denominational', 'other'],
  gurdwara: ['non-denominational', 'other'],
};
const CONTACT_TYPES = ['pastor', 'imam', 'rabbi', 'priest', 'monk / nun', 'faith leader', 'community leader', 'partner', 'volunteer', 'donor', 'board', 'advisor', 'staff', 'other'];

// Single source of truth for tables + form fields (UI reads this via /api/schema)
const SCHEMA = {
  organizations: {
    label: 'Organizations', singular: 'Organization', title: 'name', tagged: true,
    search: ['name', 'type', 'city', 'denomination', 'tags', 'auto_tags', 'notes'],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true, list: true },
      { name: 'type', label: 'Type', type: 'select', options: ORG_TYPES, list: true },
      { name: 'denomination', label: 'Denomination / tradition', type: 'select', dependsOn: 'type', optionsMap: DENOMINATIONS },
      { name: 'status', label: 'Status', type: 'select', options: ORG_STATUS, list: true },
      { name: 'address', label: 'Street address', type: 'text', geo: true },
      { name: 'city', label: 'City', type: 'text', list: true, geo: true },
      { name: 'state', label: 'State', type: 'text', geo: true },
      { name: 'zip', label: 'ZIP', type: 'text', geo: true },
      { name: 'lat', label: 'Latitude', type: 'number', step: 'any' },
      { name: 'lng', label: 'Longitude', type: 'number', step: 'any' },
      { name: 'website', label: 'Website', type: 'url' },
      { name: 'phone', label: 'Phone', type: 'tel', list: true },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'tags', label: 'Extra tags (optional, comma separated)', type: 'text' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  contacts: {
    label: 'Contacts', singular: 'Contact', title: 'first_name', tagged: true,
    search: ['c.first_name', 'c.last_name', 'c.email', 'c.phone', 'c.role', 'c.tags', 'c.auto_tags', 'o.name'],
    fields: [
      { name: 'first_name', label: 'First name', type: 'text', required: true, list: true },
      { name: 'last_name', label: 'Last name', type: 'text', list: true },
      { name: 'org_id', label: 'Organization', type: 'ref', ref: 'organizations', list: true, allowNew: true },
      { name: 'role', label: 'Role / title', type: 'text', list: true },
      { name: 'type', label: 'Type', type: 'select', options: CONTACT_TYPES },
      { name: 'email', label: 'Email', type: 'email', list: true },
      { name: 'phone', label: 'Phone', type: 'tel', list: true },
      { name: 'tags', label: 'Extra tags (optional, comma separated)', type: 'text' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  interactions: {
    label: 'Interactions', singular: 'Interaction', title: 'summary',
    search: ['i.summary', 'c.first_name', 'c.last_name', 'o.name'],
    fields: [
      { name: 'date', label: 'Date', type: 'date', list: true, default: 'today' },
      { name: 'kind', label: 'Kind', type: 'select', options: ['call', 'meeting', 'email', 'text', 'visit', 'event', 'other'], list: true },
      { name: 'contact_id', label: 'Contact', type: 'ref', ref: 'contacts', list: true },
      { name: 'org_id', label: 'Organization', type: 'ref', ref: 'organizations', list: true, allowNew: true },
      { name: 'summary', label: 'Summary', type: 'textarea', list: true },
      { name: 'follow_up_date', label: 'Follow-up date', type: 'date', list: true },
      { name: 'follow_up_done', label: 'Follow-up done', type: 'checkbox' },
    ],
  },
  donations: {
    label: 'Donations', singular: 'Donation', title: 'amount', stub: true,
    search: ['d.method', 'd.notes', 'c.first_name', 'c.last_name', 'o.name'],
    fields: [
      { name: 'date', label: 'Date', type: 'date', list: true, default: 'today' },
      { name: 'amount', label: 'Amount ($)', type: 'number', step: '0.01', list: true },
      { name: 'method', label: 'Method', type: 'select', options: ['Zelle', 'PayPal', 'check', 'cash', 'in-kind', 'other'], list: true },
      { name: 'contact_id', label: 'Contact', type: 'ref', ref: 'contacts', list: true },
      { name: 'org_id', label: 'Organization', type: 'ref', ref: 'organizations', list: true, allowNew: true },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  grants: {
    label: 'Grants', singular: 'Grant', title: 'name', stub: true,
    search: ['g.name', 'g.stage', 'g.notes', 'o.name'],
    fields: [
      { name: 'name', label: 'Grant / opportunity', type: 'text', required: true, list: true },
      { name: 'funder_org_id', label: 'Funder', type: 'ref', ref: 'organizations', list: true, allowNew: true },
      { name: 'amount', label: 'Amount ($)', type: 'number', step: '0.01', list: true },
      { name: 'stage', label: 'Stage', type: 'select', options: ['researching', 'drafting', 'submitted', 'awarded', 'declined'], list: true },
      { name: 'deadline', label: 'Deadline', type: 'date', list: true },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
};

// List/read SQL with joins so the UI can show names instead of ids
const SELECT = {
  organizations: `SELECT o.*, (SELECT COUNT(*) FROM contacts c WHERE c.org_id=o.id) AS contact_count FROM organizations o`,
  contacts: `SELECT c.*, o.name AS org_id__label FROM contacts c LEFT JOIN organizations o ON o.id=c.org_id`,
  interactions: `SELECT i.*, TRIM(COALESCE(c.first_name,'')||' '||COALESCE(c.last_name,'')) AS contact_id__label, o.name AS org_id__label
                 FROM interactions i LEFT JOIN contacts c ON c.id=i.contact_id LEFT JOIN organizations o ON o.id=i.org_id`,
  donations: `SELECT d.*, TRIM(COALESCE(c.first_name,'')||' '||COALESCE(c.last_name,'')) AS contact_id__label, o.name AS org_id__label
              FROM donations d LEFT JOIN contacts c ON c.id=d.contact_id LEFT JOIN organizations o ON o.id=d.org_id`,
  grants: `SELECT g.*, o.name AS funder_org_id__label FROM grants g LEFT JOIN organizations o ON o.id=g.funder_org_id`,
};
const ALIAS = { organizations: 'o', contacts: 'c', interactions: 'i', donations: 'd', grants: 'g' };
const ORDER = {
  organizations: 'o.name COLLATE NOCASE', contacts: 'c.first_name COLLATE NOCASE, c.last_name COLLATE NOCASE',
  interactions: 'i.date DESC, i.id DESC', donations: 'd.date DESC, d.id DESC', grants: 'g.deadline IS NULL, g.deadline',
};
// Members only see rows they created, in every table
const PRIVATE = ALIAS;
const scopeSql = (table, me) => (me.role !== 'admin' && PRIVATE[table] ? { sql: `${PRIVATE[table]}.created_by=?`, binds: [me.username] } : null);
const selectFor = (table, me) =>
  table === 'organizations' && me.role !== 'admin'
    ? SELECT.organizations.replace('WHERE c.org_id=o.id', 'WHERE c.org_id=o.id AND c.created_by=' + "'" + me.username.replace(/'/g, "''") + "'")
    : SELECT[table];
// The same OpenStreetMap place can be imported separately by each member (their own copy)
const osmKey = (id, me) => (me.role === 'admin' ? id : `${id}@${me.username}`);

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });

const normEmail = (e) => (e ? String(e).trim().toLowerCase() || null : null);
const normPhone = (p) => {
  const d = String(p || '').replace(/\D/g, '');
  return d.length >= 7 ? d.slice(-10) : null;
};
const tagList = (...vals) => [...new Set(vals.filter(Boolean).map((v) => String(v).trim().toLowerCase()).filter(Boolean))].join(', ');

async function autoTags(table, row, db) {
  if (table === 'organizations') return tagList(row.type, row.denomination, row.city, row.status);
  if (table === 'contacts') {
    const org = row.org_id ? await db.prepare(`SELECT name, type, city FROM organizations WHERE id=?`).bind(row.org_id).first() : null;
    return tagList(row.type, org?.name, org?.type, org?.city);
  }
  return null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let user;
    try {
      user = await authenticate(request, env);
    } catch (e) {
      if (url.pathname.startsWith('/api/')) return json({ error: e.message }, 401);
      return msgPage(e.message);
    }

    if (!url.pathname.startsWith('/api/')) {
      return new Response(HTML, { headers: { 'content-type': 'text/html; charset=utf-8' } });
    }

    try {
      return await api(request, env, url, user);
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  },
};

async function api(request, env, url, me) {
  const email = me.username;
  const isAdmin = me.role === 'admin';
  const db = env.DB;
  const parts = url.pathname.split('/').filter(Boolean); // ['api', table, id]
  const method = request.method;

  if (parts[1] === 'me') return json({ username: email, role: me.role });
  if (parts[1] === 'users') {
    if (!isAdmin) return json({ error: 'Admins only' }, 403);
    return users(request, env, parts[2] ? Number(parts[2]) : null, email);
  }
  if (parts[1] === 'schema') return json(SCHEMA);
  if (parts[1] === 'dashboard') return dashboard(db, me);
  if (parts[1] === 'geocode' && method === 'POST') {
    const g = await geocodeAddress(await request.json());
    return g ? json(g) : json({ error: 'No match for that address' }, 404);
  }
  if (parts[1] === 'discover') return discover(url.searchParams, db, me);
  if (parts[1] === 'osm-query') { const q = osmQuery(url.searchParams); return q ? json(q) : json({ error: 'lat/lng required' }, 400); }
  if (parts[1] === 'osm-shape' && method === 'POST') { const b = await request.json(); return json(await shapeOsm(Array.isArray(b.elements) ? b.elements : [], b.kind, db, me)); }
  if (parts[1] === 'import-osm' && method === 'POST') return importOsm(await request.json(), db, me);
  if (parts[1] === 'related') return related(url.searchParams, db, me);
  if (parts[1] === 'linked') return linked(url.searchParams, db, me);
  if (parts[1] === 'attachments') return attachments(request, env, url, parts, me);

  const table = parts[1];
  const def = SCHEMA[table];
  if (!def) return json({ error: 'Not found' }, 404);
  const id = parts[2] ? Number(parts[2]) : null;
  const a = ALIAS[table];
  const cols = def.fields.map((f) => f.name);
  const scope = scopeSql(table, me);

  // Members may only open/edit their own private rows
  if (id && scope) {
    const own = await db.prepare(`SELECT 1 FROM ${table} ${a} WHERE ${a}.id=? AND ${scope.sql}`).bind(id, ...scope.binds).first();
    if (!own) return json({ error: 'Not found' }, 404);
  }

  if (method === 'GET' && id) {
    const row = await db.prepare(`${selectFor(table, me)} WHERE ${a}.id=?`).bind(id).first();
    return row ? json(row) : json({ error: 'Not found' }, 404);
  }
  if (method === 'GET') {
    const q = (url.searchParams.get('q') || '').trim();
    const where = [];
    const binds = [];
    if (scope) { where.push(scope.sql); binds.push(...scope.binds); }
    if (q) {
      const s = def.search.map((c) => (c.includes('.') ? c : `${a}.${c}`));
      where.push('(' + s.map((c) => `${c} LIKE ?`).join(' OR ') + ')');
      s.forEach(() => binds.push(`%${q}%`));
    }
    for (const [k, v] of url.searchParams) {
      if (k !== 'q' && k !== 'limit' && cols.includes(k) && v !== '') { where.push(`${a}.${k}=?`); binds.push(v); }
    }
    const limit = Math.min(Number(url.searchParams.get('limit')) || 500, 2000);
    const sql = `${selectFor(table, me)} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY ${ORDER[table]} LIMIT ${limit}`;
    const { results } = await db.prepare(sql).bind(...binds).all();
    return json(results);
  }
  if (method === 'POST' || method === 'PUT') {
    const body = await request.json();
    const data = {};
    for (const f of def.fields) {
      if (!(f.name in body)) continue;
      let v = body[f.name];
      if (typeof v === 'string') v = v.trim();
      if (v === '' || v === undefined) v = null;
      if (f.type === 'checkbox') v = v ? 1 : 0;
      if ((f.type === 'number' || f.type === 'ref') && v !== null) v = Number(v);
      data[f.name] = v;
    }
    for (const f of def.fields) if (f.required && method === 'POST' && !data[f.name]) return json({ error: `${f.label} is required` }, 400);

    // Merge with the saved row so derived fields see the full record
    const prev = id ? await db.prepare(`SELECT * FROM ${table} WHERE id=?`).bind(id).first() : {};
    const full = { ...prev, ...data };

    if (table === 'organizations' && method === 'POST' && !data.status) data.status = full.status = 'prospect';
    if (table === 'organizations') {
      // Auto-locate from the address when it's new or changed and no coordinates were typed
      const addrChanged = ['address', 'city', 'state', 'zip'].some((k) => k in data && data[k] !== prev?.[k]);
      const coordsTyped = 'lat' in data && data.lat !== null && data.lat !== prev?.lat;
      if ((full.address || full.city || full.zip) && !coordsTyped && (addrChanged || full.lat == null)) {
        const g = await geocodeAddress(full).catch(() => null);
        if (g) { data.lat = full.lat = g.lat; data.lng = full.lng = g.lng; }
      }
    }
    if (table === 'contacts') {
      data.email_norm = normEmail(full.email);
      data.phone_norm = normPhone(full.phone);
    }
    if (def.tagged) data.auto_tags = await autoTags(table, full, db);

    const keys = Object.keys(data);
    if (method === 'POST') {
      keys.push('created_by');
      const vals = keys.map((k) => (k === 'created_by' ? email : data[k]));
      const r = await db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')}) RETURNING id`).bind(...vals).first();
      if (table === 'organizations') await retagContacts(db, r.id);
      return json({ id: r.id }, 201);
    }
    if (!id) return json({ error: 'Missing id' }, 400);
    if (!keys.length) return json({ id });
    await db.prepare(`UPDATE ${table} SET ${keys.map((k) => `${k}=?`).join(',')}, updated_at=datetime('now') WHERE id=?`).bind(...keys.map((k) => data[k]), id).run();
    if (table === 'organizations') await retagContacts(db, id);
    return json({ id });
  }
  if (method === 'DELETE' && id) {
    if (!isAdmin) return json({ error: 'Only admins can delete' }, 403);
    await removeAttachments(env, table, id);
    await db.prepare(`DELETE FROM ${table} WHERE id=?`).bind(id).run();
    return json({ ok: true });
  }
  return json({ error: 'Method not allowed' }, 405);
}

// Contacts' auto tags include their organization's name/type/city, so refresh them when an org changes
async function retagContacts(db, orgId) {
  const { results } = await db.prepare(`SELECT id, type, org_id FROM contacts WHERE org_id=?`).bind(orgId).all();
  if (!results.length) return;
  const stmts = [];
  for (const c of results) stmts.push(db.prepare(`UPDATE contacts SET auto_tags=? WHERE id=?`).bind(await autoTags('contacts', c, db), c.id));
  await db.batch(stmts);
}

async function dashboard(db, me) {
  const counts = {};
  for (const t of Object.keys(SCHEMA)) {
    const s = scopeSql(t, me);
    counts[t] = (await db.prepare(`SELECT COUNT(*) n FROM ${t} ${ALIAS[t]} ${s ? 'WHERE ' + s.sql : ''}`).bind(...(s ? s.binds : [])).first()).n;
  }
  const os = scopeSql('organizations', me);
  const byType = (await db.prepare(`SELECT type, COUNT(*) n FROM organizations o ${os ? 'WHERE ' + os.sql : ''} GROUP BY type ORDER BY n DESC`).bind(...(os ? os.binds : [])).all()).results;
  const s = scopeSql('interactions', me);
  const w = s ? `AND ${s.sql}` : '';
  const b = s ? s.binds : [];
  const followUps = (await db.prepare(`${SELECT.interactions} WHERE i.follow_up_date IS NOT NULL AND i.follow_up_done=0 ${w} ORDER BY i.follow_up_date LIMIT 25`).bind(...b).all()).results;
  const recent = (await db.prepare(`${SELECT.interactions} WHERE 1=1 ${w} ORDER BY i.date DESC, i.id DESC LIMIT 10`).bind(...b).all()).results;
  return json({ counts, byType, followUps, recent });
}

async function related(params, db, me) {
  const org = params.get('org_id');
  const contact = params.get('contact_id');
  const cs = scopeSql('contacts', me);
  const is = scopeSql('interactions', me);
  if (org) {
    const contacts = (await db.prepare(`${SELECT.contacts} WHERE c.org_id=? ${cs ? 'AND ' + cs.sql : ''} ORDER BY c.first_name`).bind(org, ...(cs ? cs.binds : [])).all()).results;
    const interactions = (await db.prepare(`${SELECT.interactions} WHERE (i.org_id=? OR i.contact_id IN (SELECT id FROM contacts WHERE org_id=?)) ${is ? 'AND ' + is.sql : ''} ORDER BY i.date DESC`).bind(org, org, ...(is ? is.binds : [])).all()).results;
    return json({ contacts, interactions });
  }
  if (contact) {
    const interactions = (await db.prepare(`${SELECT.interactions} WHERE i.contact_id=? ${is ? 'AND ' + is.sql : ''} ORDER BY i.date DESC`).bind(contact, ...(is ? is.binds : [])).all()).results;
    return json({ contacts: [], interactions });
  }
  return json({ contacts: [], interactions: [] });
}

// Contacts that share an email or phone number with this one (possible relatives / same person).
// Members only ever see links among their own contacts.
async function linked(params, db, me) {
  const id = Number(params.get('contact_id'));
  const c = await db.prepare(`SELECT * FROM contacts WHERE id=?`).bind(id).first();
  if (!c || (me.role !== 'admin' && c.created_by !== me.username)) return json([]);
  if (!c.email_norm && !c.phone_norm) return json([]);
  const cs = scopeSql('contacts', me);
  const { results } = await db.prepare(
    `${SELECT.contacts} WHERE c.id<>? AND ((c.email_norm IS NOT NULL AND c.email_norm=?) OR (c.phone_norm IS NOT NULL AND c.phone_norm=?)) ${cs ? 'AND ' + cs.sql : ''} ORDER BY c.first_name`
  ).bind(id, c.email_norm, c.phone_norm, ...(cs ? cs.binds : [])).all();
  return json(results.map((r) => ({
    ...r,
    shared: [r.email_norm && r.email_norm === c.email_norm ? 'email' : null, r.phone_norm && r.phone_norm === c.phone_norm ? 'phone' : null].filter(Boolean),
  })));
}

// ---- Photos & videos on any record (files live in the R2 bucket bound as MEDIA, one row each in `attachments`) ----
// Anyone who can see the record can see and add its media; the uploader or an admin can remove it.
const MAX_UPLOAD = 100 * 1024 * 1024; // Workers accept request bodies up to 100 MB
const mediaOut = (r) => ({ id: r.id, filename: r.filename, content_type: r.content_type, size: r.size, created_by: r.created_by, created_at: r.created_at, url: `/api/attachments/${r.id}/file` });

async function canSee(db, table, id, me) {
  const s = scopeSql(table, me);
  const a = ALIAS[table];
  return !!(await db.prepare(`SELECT 1 FROM ${table} ${a} WHERE ${a}.id=? ${s ? 'AND ' + s.sql : ''}`).bind(id, ...(s ? s.binds : [])).first());
}

async function attachments(request, env, url, parts, me) {
  const db = env.DB;
  const method = request.method;
  if (!env.MEDIA) return json({ error: 'File storage is not set up yet (R2 bucket "MEDIA")' }, 501);
  const aid = parts[2] ? Number(parts[2]) : null;

  if (!aid) { // /api/attachments?table=organizations&id=5
    const table = url.searchParams.get('table');
    const id = Number(url.searchParams.get('id'));
    if (!SCHEMA[table] || !id || !(await canSee(db, table, id, me))) return json({ error: 'Not found' }, 404);
    if (method === 'GET') {
      const { results } = await db.prepare(`SELECT * FROM attachments WHERE table_name=? AND record_id=? ORDER BY id`).bind(table, id).all();
      return json(results.map(mediaOut));
    }
    if (method === 'POST') { // raw file in the body, its type in content-type
      const type = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
      if (!/^(image|video)\/[\w.+-]+$/.test(type)) return json({ error: 'Only photos and videos can be attached' }, 400);
      const size = Number(request.headers.get('content-length'));
      if (!size) return json({ error: 'That file is empty' }, 400);
      if (size > MAX_UPLOAD) return json({ error: 'Files must be under 100 MB' }, 413);
      const filename = (url.searchParams.get('name') || 'file').replace(/[\\/\r\n"]/g, '_').slice(0, 200);
      const key = `${table}/${id}/${crypto.randomUUID()}`;
      await env.MEDIA.put(key, request.body, { httpMetadata: { contentType: type } });
      const r = await db.prepare(`INSERT INTO attachments (table_name,record_id,r2_key,filename,content_type,size,created_by) VALUES (?,?,?,?,?,?,?) RETURNING *`)
        .bind(table, id, key, filename, type, size, me.username).first();
      return json(mediaOut(r), 201);
    }
    return json({ error: 'Method not allowed' }, 405);
  }

  const row = await db.prepare(`SELECT * FROM attachments WHERE id=?`).bind(aid).first();
  if (!row || !SCHEMA[row.table_name] || !(await canSee(db, row.table_name, row.record_id, me))) return json({ error: 'Not found' }, 404);
  if (method === 'GET' && parts[3] === 'file') {
    // Honors Range requests so videos can seek (and play at all in Safari)
    const obj = await env.MEDIA.get(row.r2_key, { range: request.headers });
    if (!obj) return json({ error: 'File is missing' }, 404);
    const h = new Headers();
    obj.writeHttpMetadata(h);
    h.set('etag', obj.httpEtag);
    h.set('accept-ranges', 'bytes');
    h.set('cache-control', 'private, max-age=86400');
    h.set('x-content-type-options', 'nosniff');
    h.set('content-security-policy', "sandbox; default-src 'none'; img-src 'self'; media-src 'self'; style-src 'unsafe-inline'"); // an uploaded SVG can't run scripts
    h.set('content-disposition', `${url.searchParams.has('download') ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(row.filename || 'file')}`);
    const rg = request.headers.get('range') && obj.range;
    if (rg) {
      const offset = 'suffix' in rg ? obj.size - rg.suffix : rg.offset ?? 0;
      const length = 'suffix' in rg ? rg.suffix : rg.length ?? obj.size - offset;
      h.set('content-range', `bytes ${offset}-${offset + length - 1}/${obj.size}`);
      h.set('content-length', String(length));
      return new Response(obj.body, { status: 206, headers: h });
    }
    h.set('content-length', String(obj.size));
    return new Response(obj.body, { headers: h });
  }
  if (method === 'DELETE') {
    if (row.created_by !== me.username && me.role !== 'admin') return json({ error: 'Only the person who added it or an admin can remove it' }, 403);
    await env.MEDIA.delete(row.r2_key);
    await db.prepare(`DELETE FROM attachments WHERE id=?`).bind(aid).run();
    return json({ ok: true });
  }
  return json({ error: 'Method not allowed' }, 405);
}

async function removeAttachments(env, table, id) {
  const { results } = await env.DB.prepare(`SELECT r2_key FROM attachments WHERE table_name=? AND record_id=?`).bind(table, id).all();
  if (!results.length) return;
  if (env.MEDIA) await env.MEDIA.delete(results.map((r) => r.r2_key));
  await env.DB.prepare(`DELETE FROM attachments WHERE table_name=? AND record_id=?`).bind(table, id).run();
}

// ---- Geocoding (OpenStreetMap Nominatim, free; keep usage light) ----
async function geocodeAddress({ address, city, state, zip }) {
  const q = [address, city, state, zip].filter(Boolean).join(', ');
  if (!q) return null;
  const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=${encodeURIComponent(q)}`, {
    headers: { 'User-Agent': 'FruitCityWorldwideCRM/1.0 (fruitcityworldwide.org)' },
  });
  if (!r.ok) return null;
  const hits = await r.json();
  if (!hits.length) return null;
  return { lat: Number(hits[0].lat), lng: Number(hits[0].lon), display: hits[0].display_name };
}

const RELIGION_TYPE = { christian: 'church', muslim: 'mosque', jewish: 'synagogue', hindu: 'hindu temple', buddhist: 'buddhist temple', sikh: 'gurdwara' };

// ---- Discover places of worship / nonprofits near a point (OpenStreetMap Overpass) ----
// The browser runs the Overpass query itself (more reliable than from Cloudflare's servers);
// the Worker builds the query, shapes the results, and is a fallback with several mirrors.
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];
function osmQuery(params) {
  const lat = Number(params.get('lat')), lng = Number(params.get('lng'));
  const radius = Math.min(Number(params.get('radius')) || 5000, 25000);
  const kind = params.get('kind') || 'church';
  if (!isFinite(lat) || !isFinite(lng)) return null;
  const around = `(around:${radius},${lat},${lng})`;
  const filters = kind === 'church'
    ? [`nwr["amenity"="place_of_worship"]${around};`]
    : [`nwr["office"~"ngo|charity|association|foundation"]${around};`, `nwr["social_facility"]${around};`, `nwr["amenity"="community_centre"]${around};`];
  return { kind, query: `[out:json][timeout:25];(${filters.join('')});out center tags 300;`, mirrors: OVERPASS };
}

async function discover(params, db, me) {
  const q = osmQuery(params);
  if (!q) return json({ error: 'lat/lng required' }, 400);
  let data = null, last = '';
  for (const m of OVERPASS) {
    try {
      const r = await fetch(m, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded', 'User-Agent': 'FruitCityWorldwideCRM/1.0 (fruitcityworldwide.org)' },
        body: 'data=' + encodeURIComponent(q.query),
      });
      if (r.ok) { data = await r.json(); break; }
      last = r.status;
    } catch (e) { last = e.message; }
  }
  if (!data) return json({ error: `OpenStreetMap is busy right now (${last}). Try again in a minute.` }, 502);
  return json(await shapeOsm(data.elements || [], q.kind, db, me));
}

async function shapeOsm(elements, kind, db, me) {
  const existing = new Set((await db.prepare(`SELECT osm_id FROM organizations WHERE osm_id IS NOT NULL`).all()).results.map((x) => x.osm_id));
  const mine = (id) => osmKey(id, me);
  return elements
    .filter((e) => e && e.tags && e.tags.name)
    .slice(0, 400)
    .map((e) => {
      const t = e.tags;
      const osm_id = `${e.type}/${e.id}`;
      return {
        osm_id,
        name: t.name,
        type: kind === 'church' ? (RELIGION_TYPE[t.religion] || (t.religion ? `${t.religion} place of worship` : 'place of worship')) : 'nonprofit',
        denomination: kind === 'church' ? (RELIGION_TYPE[t.religion] ? t.denomination || null : [t.religion, t.denomination].filter(Boolean).join(' / ') || null) : null,
        address: [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' ') || null,
        city: t['addr:city'] || null, state: t['addr:state'] || null, zip: t['addr:postcode'] || null,
        lat: e.lat ?? e.center?.lat ?? null, lng: e.lon ?? e.center?.lon ?? null,
        website: t.website || t['contact:website'] || null,
        phone: t.phone || t['contact:phone'] || null,
        email: t.email || t['contact:email'] || null,
        already: existing.has(mine(osm_id)),
      };
    })
    .sort((x, y) => x.name.localeCompare(y.name));
}

async function importOsm({ items }, db, me) {
  const email = me.username;
  if (!Array.isArray(items) || !items.length) return json({ imported: 0 });
  const stmt = db.prepare(`INSERT OR IGNORE INTO organizations (name,type,denomination,address,city,state,zip,lat,lng,website,phone,email,osm_id,status,created_by,auto_tags)
                           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'prospect',?,?)`);
  const batch = items.slice(0, 300).map((o) =>
    stmt.bind(...[o.name, o.type, o.denomination, o.address, o.city, o.state, o.zip, o.lat, o.lng, o.website, o.phone, o.email, osmKey(o.osm_id, me), email, tagList(o.type, o.denomination, o.city, 'prospect')].map((v) => (v === undefined ? null : v))));
  const res = await db.batch(batch);
  return json({ imported: res.reduce((n, r) => n + (r.meta?.changes || 0), 0) });
}

// ---- Sign-in: Cloudflare Access email code -> users table ----
const enc = new TextEncoder();
let jwksCache = null;

async function authenticate(request, env) {
  if (env.DEV_AUTH_EMAIL) { // local dev only (set in .dev.vars); never set in production
    const as = request.headers.get('x-dev-user');
    const r = as && (await env.DB.prepare(`SELECT username, role FROM users WHERE username=?`).bind(as).first());
    return r ? { username: r.username, role: r.role || 'member' } : { username: env.DEV_AUTH_EMAIL, role: 'admin' };
  }
  const token = request.headers.get('cf-access-jwt-assertion');
  if (!token || !env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) throw new Error('Please sign in.');
  let email;
  try {
    email = await verifyAccessJwt(token, env);
  } catch (e) {
    throw new Error('Could not verify your sign-in. Reload the page to try again.');
  }
  const row = await env.DB.prepare(`SELECT username, role FROM users WHERE email=?`).bind(email).first();
  if (!row) throw new Error(`${email} isn't set up in the CRM yet. Ask an admin to add you.`);
  return { username: row.username, role: row.role || 'member', email };
}

async function verifyAccessJwt(token, env) {
  const [h, p, s] = token.split('.');
  const header = JSON.parse(b64urlDecodeStr(h));
  const payload = JSON.parse(b64urlDecodeStr(p));
  if (!jwksCache || Date.now() - jwksCache.at > 3600000) {
    const r = await fetch(`https://${env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`);
    jwksCache = { at: Date.now(), keys: (await r.json()).keys };
  }
  const jwk = jwksCache.keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('unknown signing key');
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlDecode(s), enc.encode(`${h}.${p}`));
  if (!ok) throw new Error('bad signature');
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!aud.includes(env.ACCESS_AUD)) throw new Error('wrong audience');
  if (payload.exp * 1000 < Date.now()) throw new Error('expired');
  return String(payload.email || '').toLowerCase();
}
function b64urlDecode(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}
function b64urlDecodeStr(s) { return new TextDecoder().decode(b64urlDecode(s)); }

const escHtml = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const msgPage = (msg) => new Response(`<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><title>Fruit City CRM</title>
<body style="font:16px system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;padding:16px;text-align:center"><div><h2 style="color:#2f7d32">🍊 Fruit City CRM</h2><p>${escHtml(msg)}</p><p><a href="/cdn-cgi/access/logout">Sign out / use a different email</a></p></div>`,
  { status: 403, headers: { 'content-type': 'text/html; charset=utf-8' } });

const cleanEmail = (e) => {
  const v = String(e || '').trim().toLowerCase();
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? v : null;
};

// ---- User management (admins only) ----
// Note: someone's email must also be on the Cloudflare Access policy to receive a code.
async function users(request, env, id, self) {
  const db = env.DB;
  const m = request.method;
  if (m === 'GET') return json((await db.prepare(`SELECT id, username, email, role, created_at FROM users ORDER BY username`).all()).results);
  const body = m === 'DELETE' ? {} : await request.json().catch(() => ({}));
  const role = body.role === 'admin' ? 'admin' : 'member';
  if (m === 'POST') {
    const u = String(body.username || '').trim().toLowerCase();
    if (!/^[a-z0-9._-]{2,32}$/.test(u)) return json({ error: 'Name: 2-32 letters, numbers, dots, dashes or underscores' }, 400);
    const email = cleanEmail(body.email);
    if (!email) return json({ error: 'Enter a valid email' }, 400);
    try {
      await db.prepare(`INSERT INTO users (username,salt,pw_hash,role,email) VALUES (?,'','',?,?)`).bind(u, role, email).run();
    } catch (e) {
      return json({ error: 'That name or email is already used' }, 400);
    }
    return json({ ok: true }, 201);
  }
  const target = id ? await db.prepare(`SELECT * FROM users WHERE id=?`).bind(id).first() : null;
  if (!target) return json({ error: 'User not found' }, 404);
  if (m === 'PUT') {
    if ('email' in body) {
      const email = cleanEmail(body.email);
      if (!email) return json({ error: 'Enter a valid email' }, 400);
      if (target.username === self) return json({ error: "You can't change your own sign-in email here" }, 400);
      try { await db.prepare(`UPDATE users SET email=? WHERE id=?`).bind(email, id).run(); }
      catch (e) { return json({ error: 'That email is already used' }, 400); }
    }
    if (body.role) {
      if (target.username === self && role !== 'admin') return json({ error: "You can't remove your own admin access" }, 400);
      await db.prepare(`UPDATE users SET role=? WHERE id=?`).bind(role, id).run();
    }
    return json({ ok: true });
  }
  if (m === 'DELETE') {
    if (target.username === self) return json({ error: "You can't remove yourself" }, 400);
    await db.prepare(`DELETE FROM users WHERE id=?`).bind(id).run();
    return json({ ok: true });
  }
  return json({ error: 'Method not allowed' }, 405);
}

export { api, SCHEMA };
