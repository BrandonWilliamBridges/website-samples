// Copied from crm/src/agreement.js by crm/demo/build.mjs. Do not edit.
// Confidentiality agreement gate.
// - Each person named in AGREEMENT_USERS (wrangler.toml, comma separated, for example "ahmed") gets one agreement row.
// - Nothing changes for them until an admin records when the agreement was sent (Users page > Confidentiality agreement).
// - Three days (AGREEMENT_HOURS, default 72) after that sent time, if they haven't accepted, the CRM limits them on its own:
//   they can read and sign the agreement, see and send messages with the admins (Messages page), and see the admins'
//   own contact records. Every other page and record answers "blocked" until they accept.
// - They accept by signing on the agreement page (#terms: tick the box and type their full legal name), or by replying
//   "Yes, I agree" to a CRM message email (or writing that on the Messages page). Accepting lifts the limit at once.
// - The signed copy (the exact text, typed name, date and time, network address and browser) shows on their contact
//   record and is logged there as an interaction. Admins are never limited.
import { sendMail } from './tasks.js';

export const AGREEMENT_V1 = {
  version: '1',
  version_date: 'Nov 16, 2026',
  title: 'Fruit City Confidentiality Agreement',
  body: `This agreement is between Fruit City, a Texas nonprofit corporation ("Fruit City"), represented by its Director, Brandon Bridges, and {member} ("Member").

1. Purpose. The Member has access to the Fruit City customer relationship management system at crm.fruitcityworldwide.org (the "CRM") to do Fruit City's work. This agreement sets out how the Member must handle the information in it.

2. Confidential information. Confidential information means everything in the CRM, and everything the Member learns through it, including: contact details for anyone, including Brandon Bridges' address, phone number and email address; notes, interactions, tasks, documents and uploads; information about donors, partners, volunteers, the people Fruit City serves, and Fruit City's finances, plans and legal papers.

3. What the Member agrees to. Use confidential information only for Fruit City's work. Not share, copy, export, forward, post or show any confidential information to anyone, inside or outside Fruit City, unless the Member and Brandon Bridges have talked about it first and Brandon Bridges agreed. Keep the Member's CRM login private and never let anyone else use it. Tell Brandon Bridges right away if confidential information is shared by mistake or the Member's account may be in someone else's hands.

4. Access. Fruit City may suspend or end the Member's CRM access at any time, including if the Member has not signed this agreement or does not follow it.

5. After access ends. The Member's duties under this agreement continue after the Member's CRM access or role with Fruit City ends. On request, the Member will delete or return any Fruit City information the Member holds.

6. General. This agreement is governed by the laws of the State of Texas. Any change to it must be in writing and signed by both parties.

Signed electronically by Fruit City, by Brandon Bridges, Director, and by the Member.`,
};

export const AGREEMENT_SQL = `
CREATE TABLE IF NOT EXISTS agreements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  version TEXT NOT NULL,
  version_date TEXT,
  body TEXT NOT NULL,
  contact_id INTEGER,
  sent_at TEXT,
  sent_recorded_by TEXT,
  seen_at TEXT,
  org_signed_name TEXT,
  org_signed_at TEXT,
  org_signed_by TEXT,
  accepted_at TEXT,
  accepted_via TEXT,
  signed_name TEXT,
  signer_ip TEXT,
  signer_agent TEXT,
  signed_text TEXT,
  accepted_interaction_id INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
)`;

const iso = (d = new Date()) => d.toISOString().replace(/\.\d{3}Z$/, 'Z');
const hoursOf = (env) => Number(env.AGREEMENT_HOURS) > 0 ? Number(env.AGREEMENT_HOURS) : 72;
export const agreementUsers = (env) => String(env.AGREEMENT_USERS || '').split(',').map((u) => u.trim().toLowerCase()).filter(Boolean);
const memberName = (u) => u.charAt(0).toUpperCase() + u.slice(1);
const textFor = (row) => row.body.replace(/\{member\}/g, memberName(row.username));

let ready = false;
export async function ensureAgreements(env) {
  const db = env.DB;
  if (!ready) {
    await db.prepare(AGREEMENT_SQL).run();
    const cols = (await db.prepare(`PRAGMA table_info(agreements)`).all()).results.map((c) => c.name);
    if (!cols.includes('seen_at')) {
      try { await db.prepare(`ALTER TABLE agreements ADD COLUMN seen_at TEXT`).run(); }
      catch (e) { if (!/duplicate column/i.test(String(e?.message || e))) throw e; }
    }
    ready = true;
  }
  // One row per named person, with no sent time: nothing happens until an admin records the send.
  for (const u of agreementUsers(env)) {
    await db.prepare(`INSERT OR IGNORE INTO agreements (username, title, version, version_date, body) VALUES (?,?,?,?,?)`)
      .bind(u, AGREEMENT_V1.title, AGREEMENT_V1.version, AGREEMENT_V1.version_date, AGREEMENT_V1.body).run();
  }
}

// Where things stand for one row. Works out the deadline every time, so the limit starts on its own.
export function statusOf(env, row, now = Date.now()) {
  if (!row) return { status: 'none' };
  const deadline = row.sent_at ? new Date(new Date(row.sent_at).getTime() + hoursOf(env) * 3600e3) : null;
  let status = 'not sent';
  if (row.accepted_at) status = 'accepted';
  else if (deadline) status = now >= deadline.getTime() ? 'blocked' : 'waiting';
  return { status, deadline: deadline ? iso(deadline) : null };
}

export async function agreementRow(env, username) {
  if (!username) return null;
  return env.DB.prepare(`SELECT * FROM agreements WHERE username=?`).bind(String(username).toLowerCase()).first();
}

// The contact record that stands for a CRM user: the one picked on their agreement, or else one whose email is
// their sign-in email or their Fruit City address (username@ the domain the CRM sends from).
export async function contactFor(env, username, userEmail, row) {
  const db = env.DB;
  if (row?.contact_id) {
    const c = await db.prepare(`SELECT * FROM contacts WHERE id=?`).bind(row.contact_id).first();
    if (c) return c;
  }
  const domain = String(env.TASKS_FROM || 'tasks@fruitcityworldwide.org').split('@')[1];
  const emails = [userEmail, `${username}@${domain}`].filter(Boolean).map((e) => String(e).toLowerCase());
  return db.prepare(`SELECT * FROM contacts WHERE lower(email) IN (${emails.map(() => '?').join(',')}) ORDER BY id LIMIT 1`).bind(...emails).first();
}

// Admins' own contact records (matched on their sign-in email). Every member may read these.
export const ADMIN_CONTACTS_SQL = `c.email_norm IN (SELECT lower(email) FROM users WHERE role='admin' AND email IS NOT NULL)`;

// What the signed-in person's own agreement looks like (for /api/me and the agreement page).
export async function myAgreement(env, me) {
  if (me.role === 'admin') return { status: 'none' };
  const row = await agreementRow(env, me.username);
  const s = statusOf(env, row);
  if (s.status === 'none' || s.status === 'not sent') return { status: 'none' };
  // The first time they open the CRM after it was sent counts as them seeing it (shown to admins).
  if (!row.seen_at && !row.accepted_at) await env.DB.prepare(`UPDATE agreements SET seen_at=? WHERE id=? AND seen_at IS NULL`).bind(iso(), row.id).run();
  return {
    ...s, title: row.title, version: row.version, version_date: row.version_date, text: row.signed_text || textFor(row),
    sent_at: row.sent_at, accepted_at: row.accepted_at, accepted_via: row.accepted_via, signed_name: row.signed_name,
    org_signed_name: row.org_signed_name, org_signed_at: row.org_signed_at,
  };
}

// The words that count as accepting by email or message: "Yes, I agree" (or "I agree") on the first line, with no "not".
export function saysYesIAgree(text) {
  const first = (String(text || '').split('\n').find((l) => l.trim()) || '').trim();
  if (/\b(not|don'?t|do not|never|disagree)\b/i.test(first)) return false;
  return /^(yes[\s,.!;:-]*)?i\s+(do\s+)?agree\b/i.test(first) || /^yes[\s,.!;:-]+(i\s+)?agreed?\b/i.test(first);
}

const crmUrl = (env) => env.CRM_URL || 'https://crm.fruitcityworldwide.org';

async function recordAcceptance(env, row, { via, name, ip, agent, interactionId }) {
  const db = env.DB;
  const at = iso();
  const text = textFor(row);
  const c = await contactFor(env, row.username, (await db.prepare(`SELECT email FROM users WHERE username=?`).bind(row.username).first())?.email, row);
  const how = via === 'signature'
    ? `by signing in the CRM. Typed name: "${name}". Network address: ${ip || 'not recorded'}. Browser: ${(agent || 'not recorded').slice(0, 200)}.`
    : via === 'email' ? `by email reply "Yes, I agree" (saved as interaction #${interactionId}).`
      : `by writing "Yes, I agree" on the CRM Messages page (saved as interaction #${interactionId}).`;
  const summary = `${memberName(row.username)} accepted the ${row.title} (version ${row.version}, ${row.version_date}) on ${at} ${how}`;
  let logId = null;
  if (c) {
    const r = await db.prepare(`INSERT INTO interactions (date, kind, contact_id, org_id, summary, direction, created_by) VALUES (?,?,?,?,?,?,?) RETURNING id`)
      .bind(at.slice(0, 10), 'other', c.id, c.org_id ?? null, summary, 'they contacted us', row.username).first();
    logId = r.id;
  }
  await db.prepare(`UPDATE agreements SET accepted_at=?, accepted_via=?, signed_name=?, signer_ip=?, signer_agent=?, signed_text=?, accepted_interaction_id=?, contact_id=COALESCE(contact_id, ?) WHERE id=? AND accepted_at IS NULL`)
    .bind(at, via, name || null, ip || null, agent ? agent.slice(0, 400) : null, text, interactionId || logId, c?.id ?? null, row.id).run();
  const admins = (await db.prepare(`SELECT email FROM users WHERE role='admin' AND email IS NOT NULL`).all()).results;
  for (const a of admins) {
    try {
      await sendMail(env, { to: a.email, fromName: 'Fruit City CRM', subject: `${memberName(row.username)} accepted the confidentiality agreement`,
        text: `${summary}\n\nThe signed copy is on ${c ? `their contact record (${crmUrl(env)}/#contacts)` : 'the Users page'}. Their CRM access is back to normal.` });
    } catch (e) { /* the acceptance is saved either way */ }
  }
  return { at, summary };
}

// Called after an interaction is saved from an email reply or the Messages page: accepts when it says "Yes, I agree".
export async function acceptFromInteraction(env, interactionId, via) {
  const db = env.DB;
  const i = await db.prepare(`SELECT * FROM interactions WHERE id=?`).bind(interactionId).first();
  if (!i || i.direction !== 'they contacted us' || !saysYesIAgree(i.summary)) return null;
  // Whose agreement: the CRM user who wrote it, or the person whose contact record it is on.
  let row = await agreementRow(env, i.created_by);
  if (!row && i.contact_id) {
    for (const r of (await db.prepare(`SELECT * FROM agreements WHERE sent_at IS NOT NULL AND accepted_at IS NULL`).all()).results) {
      const u = await db.prepare(`SELECT email FROM users WHERE username=?`).bind(r.username).first();
      const c = await contactFor(env, r.username, u?.email, r);
      if (c && c.id === i.contact_id) { row = r; break; }
    }
  }
  if (!row || !row.sent_at || row.accepted_at) return null;
  return recordAcceptance(env, row, { via, interactionId });
}

// ---- API ----
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });

// /api/agreement: the signed-in person's own agreement. POST signs it.
export async function myAgreementApi(request, env, me) {
  if (request.method === 'GET') return json(await myAgreement(env, me));
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const row = await agreementRow(env, me.username);
  const s = statusOf(env, row);
  if (s.status === 'accepted') return json({ error: 'You have already signed this agreement.' }, 400);
  if (s.status !== 'waiting' && s.status !== 'blocked') return json({ error: 'There is no agreement for you to sign.' }, 400);
  const body = await request.json().catch(() => ({}));
  const name = String(body.name || '').replace(/\s+/g, ' ').trim();
  if (!body.agree) return json({ error: 'Tick "I have read and agree to this agreement" first.' }, 400);
  if (name.length < 3 || !/\s/.test(name) || name.length > 120) return json({ error: 'Type your full legal name, first and last.' }, 400);
  const r = await recordAcceptance(env, row, {
    via: 'signature', name,
    ip: request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || null,
    agent: request.headers.get('user-agent') || null,
  });
  return json({ ok: true, accepted_at: r.at });
}

// /api/agreements (admins): everyone's agreement, or the one tied to ?contact_id=. PUT /api/agreements/<username>
// records the sent time ({sent_at: "now" or a time}) or signs for Fruit City ({org_signed_name}).
export async function agreementsAdminApi(request, env, url, username, me) {
  const db = env.DB;
  const shape = async (r) => {
    const u = await db.prepare(`SELECT email FROM users WHERE username=?`).bind(r.username).first();
    const c = await contactFor(env, r.username, u?.email, r);
    return { ...r, text: r.signed_text || textFor(r), ...statusOf(env, r), contact_id: c?.id ?? null,
      contact_name: c ? [c.first_name, c.last_name].filter(Boolean).join(' ') : null };
  };
  if (request.method === 'GET') {
    const rows = await Promise.all((await db.prepare(`SELECT * FROM agreements ORDER BY username`).all()).results.map(shape));
    const cid = Number(url.searchParams.get('contact_id'));
    return json(cid ? rows.filter((r) => r.contact_id === cid) : rows);
  }
  if (request.method !== 'PUT' || !username) return json({ error: 'Method not allowed' }, 405);
  const row = await agreementRow(env, username);
  if (!row) return json({ error: 'No agreement for that person. Add them to AGREEMENT_USERS in wrangler.toml.' }, 404);
  const body = await request.json().catch(() => ({}));
  if ('sent_at' in body) {
    if (row.accepted_at) return json({ error: 'Already accepted, so the sent time stays as it is.' }, 400);
    let at = null;
    if (body.sent_at === 'now') at = iso();
    else if (body.sent_at) {
      const d = new Date(body.sent_at);
      if (isNaN(d)) return json({ error: 'That time could not be read.' }, 400);
      if (d.getTime() > Date.now() + 60e3) return json({ error: 'The sent time can\'t be in the future.' }, 400);
      at = iso(d);
    }
    await db.prepare(`UPDATE agreements SET sent_at=?, sent_recorded_by=?, seen_at=NULL WHERE id=?`).bind(at, at ? me.username : null, row.id).run();
  }
  if ('org_signed_name' in body) {
    const n = String(body.org_signed_name || '').replace(/\s+/g, ' ').trim();
    if (n.length < 3 || !/\s/.test(n)) return json({ error: 'Type your full name, first and last.' }, 400);
    await db.prepare(`UPDATE agreements SET org_signed_name=?, org_signed_at=?, org_signed_by=? WHERE id=?`).bind(n, iso(), me.username, row.id).run();
  }
  if ('contact_id' in body) await db.prepare(`UPDATE agreements SET contact_id=? WHERE id=?`).bind(body.contact_id ? Number(body.contact_id) : null, row.id).run();
  return json(await shape(await agreementRow(env, username)));
}

// /api/messages: a member's conversation with the admins, kept on the member's own contact record.
// Shows only what was actually sent between them (messages they wrote, emails the CRM sent them), never admins' own notes.
export async function messagesApi(request, env, me, userEmail) {
  const db = env.DB;
  if (me.role === 'admin') return json({ error: 'Admins send messages from Interactions.' }, 400);
  const row = await agreementRow(env, me.username);
  const c = await contactFor(env, me.username, userEmail, row);
  const admins = (await db.prepare(`SELECT username, email FROM users WHERE role='admin' AND email IS NOT NULL ORDER BY id`).all()).results;
  if (request.method === 'GET') {
    const people = (await db.prepare(`SELECT c.id, c.first_name, c.last_name, c.email, c.phone, c.role, c.notes FROM contacts c WHERE ${ADMIN_CONTACTS_SQL} ORDER BY c.id`).all()).results;
    const items = c ? (await db.prepare(`SELECT id, date, kind, direction, summary, created_by, created_at FROM interactions
        WHERE contact_id=? AND (created_by IN (?, ?) OR email_result LIKE 'emailed to %') ORDER BY created_at DESC, id DESC LIMIT 200`)
      .bind(c.id, me.username, String(c.email || '').toLowerCase()).all()).results : [];
    return json({ contact: c ? { id: c.id, name: [c.first_name, c.last_name].filter(Boolean).join(' ') } : null, admins: people,
      adminUsers: people.length ? [] : admins, items });
  }
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!c) return json({ error: 'Your contact record isn\'t set up yet, so messages can\'t be saved. Ask an admin.' }, 400);
  const body = await request.json().catch(() => ({}));
  let text = String(body.text || '').trim();
  if (!text) return json({ error: 'Write a message first.' }, 400);
  if (text.length > 5000) text = text.slice(0, 5000) + '…';
  const r = await db.prepare(`INSERT INTO interactions (date, kind, contact_id, org_id, summary, direction, created_by, emailed_to) VALUES (?,?,?,?,?,?,?,?) RETURNING id`)
    .bind(iso().slice(0, 10), 'other', c.id, c.org_id ?? null, text, 'they contacted us', me.username, 'admins').first();
  const who = memberName(me.username);
  let result = 'emailed to the admins';
  try {
    for (const a of admins) {
      await sendMail(env, { to: a.email, fromName: 'Fruit City CRM', subject: `[Fruit City message #${r.id}] Message from ${who}`,
        text: `${who} wrote in the CRM:\n\n${text}\n\nSaved in the CRM under Interactions: ${crmUrl(env)}/#interactions\n\n---\nTo answer ${who}, just reply to this email. Your reply is saved in the Fruit City CRM and ${who} gets it by email.` });
    }
  } catch (e) { result = 'not emailed: ' + String(e?.message || e).slice(0, 150); }
  await db.prepare(`UPDATE interactions SET email_result=? WHERE id=?`).bind(result, r.id).run();
  const accepted = await acceptFromInteraction(env, r.id, 'message');
  return json({ id: r.id, accepted: !!accepted }, 201);
}

// Paths a limited person may still use. Everything else answers 403 {blocked: true}.
export const OPEN_WHEN_BLOCKED = ['me', 'agreement', 'messages', 'schema'];
