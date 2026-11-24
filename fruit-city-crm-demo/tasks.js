// Copied from crm/src/tasks.js by crm/demo/build.mjs. Do not edit.
// Tasks: give someone on the team a to-do, and the CRM emails it to them.
// They can answer by replying to that email: "done" marks it finished, anything else is saved as a message
// on the task, and the person who gave the task gets an email about it. Messages can also be sent from the CRM.
//
// Free on Cloudflare: email goes out through the Email Routing "send email" binding (env.EMAIL), which on the
// free plan can only send to addresses verified under Email Routing > Destination addresses.
// Replies come back through an Email Routing rule (TASKS_FROM address -> this Worker), handled by handleTaskEmail.

export const TASK_STATUS = ['open', 'in progress', 'waiting', 'done', 'cancelled'];
const CLOSED = ['done', 'cancelled'];

export const TASKS_SCHEMA = {
  label: 'Tasks', singular: 'Task', title: 'title',
  intro: 'Give someone a to-do and the CRM emails it to them. They can reply to that email: replying "done" marks it finished, and anything else shows up here as a message. You get an email when they answer. Use Send a message, inside a task, to write to them about it.',
  search: ['tk.title', 'tk.details', 'tk.assigned_to', 'tk.status', 'tk.created_by'],
  fields: [
    { name: 'title', label: 'What needs doing', type: 'text', required: true, list: true,
      help: 'A short line, like "Call John about the pickup paperwork". It becomes the email subject.' },
    { name: 'assigned_to', label: 'Who does it', type: 'select', options: [], required: true, list: true,
      help: 'Everyone on the Users page is listed. The email goes to the address saved for them there.' },
    { name: 'due_date', label: 'Due by', type: 'date', list: true, help: 'Optional. It is included in the email.' },
    { name: 'status', label: 'Status', type: 'select', options: TASK_STATUS, list: true,
      help: 'Open: not started. In progress: they are on it. Waiting: stuck on someone else. Done or Cancelled close it. When the person doing it marks it done (here or by replying "done"), the person who gave it gets an email.' },
    { name: 'details', label: 'Details', type: 'textarea',
      help: 'Everything they need: who to call, links, what "done" looks like. This is the body of the email.' },
    { name: 'email_now', label: 'Email this to them when I save', type: 'checkbox', default: true, virtual: true,
      help: 'Ticked: saving sends them the task by email. Untick it to save quietly, for example when you only fix a typo.' },
  ],
};
export const TASKS_SELECT = `SELECT tk.*, (SELECT COUNT(*) FROM task_updates u WHERE u.task_id=tk.id) AS message_count FROM tasks tk`;
export const TASKS_ORDER = `tk.status IN ('done','cancelled'), tk.due_date IS NULL, tk.due_date, tk.id DESC`;
// Members see the tasks they gave and the tasks given to them; admins see all.
export const tasksScope = (me) => (me.role === 'admin' ? null : { sql: '(tk.created_by=? OR tk.assigned_to=?)', binds: [me.username, me.username] });

export const TASKS_SQL = `
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  details TEXT,
  assigned_to TEXT,
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  completed_at TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to, status);
CREATE TABLE IF NOT EXISTS task_updates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  author TEXT,
  kind TEXT NOT NULL DEFAULT 'message',
  body TEXT,
  source TEXT NOT NULL DEFAULT 'crm',
  emailed_to TEXT,
  email_result TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_task_updates ON task_updates(task_id, id);`;

// Creates the two tables the first time the Worker runs after this deploy (only adds tables, never changes data).
let tablesReady = false;
export async function ensureTaskTables(db) {
  if (tablesReady) return;
  const stmts = TASKS_SQL.split(';').map((s) => s.trim()).filter(Boolean).map((s) => db.prepare(s));
  await db.batch(stmts);
  tablesReady = true;
}

export async function userOptions(db) {
  return (await db.prepare(`SELECT username FROM users ORDER BY username`).all()).results.map((r) => r.username);
}
const userByName = (db, u) => db.prepare(`SELECT username, email, role FROM users WHERE username=?`).bind(u).first();
const now = () => new Date().toISOString().slice(0, 19).replace('T', ' ');
const canSee = (me, t) => me.role === 'admin' || t.created_by === me.username || t.assigned_to === me.username;

// ---------- saving a task (called by the main save handler after the row is written) ----------
export async function afterTaskSave(env, me, id, prev, full, emailNow, isNew) {
  const db = env.DB;
  const notes = [];
  const statusChanged = !isNew && full.status !== prev.status;
  if (statusChanged) {
    await db.prepare(`UPDATE tasks SET completed_at=? WHERE id=?`).bind(CLOSED.includes(full.status) ? now() : null, id).run();
    await addUpdate(db, { task_id: id, author: me.username, kind: 'status', body: `Status changed to ${full.status}`, source: 'crm' });
  }
  if (!isNew && full.assigned_to !== prev.assigned_to) {
    await addUpdate(db, { task_id: id, author: me.username, kind: 'status', body: `Given to ${full.assigned_to}`, source: 'crm' });
  }
  const task = { ...full, id };
  if (emailNow) notes.push(await emailTask(env, task, isNew ? 'new' : 'updated', me.username));
  // Tell the person who gave the task when someone else finishes or cancels it
  if (statusChanged && CLOSED.includes(full.status) && full.created_by && full.created_by !== me.username) {
    notes.push(await emailPerson(env, task, full.created_by,
      `${me.username} marked this task ${full.status}.`, `${full.status === 'done' ? 'Done' : 'Cancelled'}: `, me.username));
  }
  return notes.filter(Boolean).join(' ');
}

// ---------- messages on a task: GET /api/tasks/:id/updates, POST {body} ----------
export async function taskUpdatesApi(request, env, id, me) {
  const db = env.DB;
  const t = await db.prepare(`SELECT * FROM tasks WHERE id=?`).bind(id).first();
  if (!t || !canSee(me, t)) return json({ error: 'Not found' }, 404);
  if (request.method === 'GET') {
    return json((await db.prepare(`SELECT * FROM task_updates WHERE task_id=? ORDER BY id`).bind(id).all()).results);
  }
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const body = String((await request.json().catch(() => ({}))).body || '').trim();
  if (!body) return json({ error: 'Write a message first' }, 400);
  if (body.length > 5000) return json({ error: 'That message is too long (5,000 characters at most)' }, 400);
  const to = otherParty(t, me.username);
  const upd = await addUpdate(db, { task_id: id, author: me.username, kind: 'message', body, source: 'crm' });
  if (!to) return json({ ok: true, note: 'Saved. Nobody else is on this task, so no email was sent.' });
  const note = await emailPerson(env, t, to, `${me.username} wrote:\n\n${body}`, 'Message: ', me.username, upd);
  return json({ ok: true, note });
}

const otherParty = (t, me) => (me === t.assigned_to ? t.created_by : t.assigned_to) || null;

async function addUpdate(db, u) {
  const r = await db.prepare(`INSERT INTO task_updates (task_id, author, kind, body, source) VALUES (?,?,?,?,?) RETURNING id`)
    .bind(u.task_id, u.author, u.kind || 'message', u.body, u.source || 'crm').first();
  return r.id;
}

// ---------- outgoing email ----------
const subjectTag = (id) => `[Fruit City task #${id}]`;

function taskText(env, t) {
  const lines = [`Task #${t.id}: ${t.title}`];
  if (t.due_date) lines.push(`Due by: ${t.due_date}`);
  lines.push(`Status: ${t.status || 'open'}`, `From: ${t.created_by || 'the Fruit City team'}`);
  if (t.details) lines.push('', t.details);
  return lines.join('\n');
}
function howToReply(env) {
  return [
    '',
    '---',
    'How to answer: just reply to this email.',
    '- Reply "done" (first word) when it is finished.',
    '- Anything else you write is saved on the task, and the team is told.',
    `- You can also open it in the CRM: ${env.CRM_URL || 'https://crm.fruitcityworldwide.org'}/#tasks`,
  ].join('\n');
}

async function emailTask(env, t, why, by) {
  const intro = why === 'new' ? `${by} gave you a task in the Fruit City CRM.` : `${by} updated a task you have in the Fruit City CRM.`;
  return emailPerson(env, t, t.assigned_to, `${intro}\n\n${taskText(env, t)}`, why === 'new' ? 'New: ' : 'Updated: ', by);
}

// Emails a CRM user about task t, and records the result on the task. Returns a short line for the person saving.
async function emailPerson(env, t, username, text, prefix, by, updateId) {
  const db = env.DB;
  const u = await userByName(db, username);
  let result;
  if (!u?.email) result = `not sent: ${username} has no email on the Users page`;
  else {
    try {
      await sendMail(env, { to: u.email, subject: `${subjectTag(t.id)} ${prefix}${t.title}`, text: `${text}\n${howToReply(env)}` });
      result = `emailed to ${username}`;
    } catch (e) {
      result = `not sent to ${username}: ${explainSendError(e)}`;
    }
  }
  const id = updateId || (await addUpdate(db, { task_id: t.id, author: by, kind: 'email', body: null, source: 'crm' }));
  await db.prepare(`UPDATE task_updates SET emailed_to=?, email_result=? WHERE id=?`).bind(username, result, id).run();
  return result.charAt(0).toUpperCase() + result.slice(1) + '.';
}

function explainSendError(e) {
  const m = String(e?.message || e);
  if (/destination|verif/i.test(m)) return 'their address is not verified in Cloudflare Email Routing yet (Email Routing > Destination addresses)';
  if (!m || m === 'undefined') return 'email is not set up for the CRM yet';
  return m.slice(0, 200);
}

// Builds a plain-text email and sends it through the free Email Routing binding.
export async function sendMail(env, { to, subject, text, fromName }) {
  if (!env.EMAIL) throw new Error('email is not set up for the CRM yet');
  const from = env.TASKS_FROM || 'tasks@fruitcityworldwide.org';
  const domain = from.split('@')[1];
  const raw = buildMime({ from: `${String(fromName || 'Fruit City CRM').replace(/[<>"]/g, '')} <${from}>`, to, replyTo: from, subject, text, domain });
  const { EmailMessage } = env.__EmailMessage ? { EmailMessage: env.__EmailMessage } : await import('cloudflare:email');
  await env.EMAIL.send(new EmailMessage(from, to, raw));
}

const b64 = (s) => {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};
const encodeHeader = (s) => (/^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${b64(s)}?=`);
const oneLine = (s) => String(s).replace(/[\r\n]+/g, ' ').slice(0, 300);

export function buildMime({ from, to, replyTo, subject, text, domain }) {
  const body = b64(String(text).replace(/\r?\n/g, '\r\n')).replace(/.{76}/g, '$&\r\n');
  return [
    `From: ${oneLine(from)}`,
    `To: <${oneLine(to)}>`,
    `Reply-To: <${oneLine(replyTo)}>`,
    `Subject: ${encodeHeader(oneLine(subject))}`,
    `Message-ID: <${crypto.randomUUID()}@${domain}>`,
    `Date: ${new Date().toUTCString()}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: base64',
    'Auto-Submitted: auto-generated',
    '',
    body,
  ].join('\r\n');
}

// ---------- incoming replies (Email Routing rule: TASKS_FROM -> this Worker) ----------
export async function handleTaskEmail(message, env, onOther, isBlocked) {
  const db = env.DB;
  await ensureTaskTables(db);
  const raw = new Uint8Array(await new Response(message.raw).arrayBuffer());
  const mail = parseMime(raw);
  const sender = (addrOf(mail.headers.from) || addrOf(message.from) || '').toLowerCase();
  const subject = decodeWords(mail.headers.subject || '');
  const idm = subject.match(/task #(\d+)/i);
  const user = sender ? await db.prepare(`SELECT username, email, role FROM users WHERE lower(email)=?`).bind(sender).first() : null;
  const task = idm ? await db.prepare(`SELECT * FROM tasks WHERE id=?`).bind(Number(idm[1])).first() : null;
  const failedAuth = !senderVerified(mail.authResults);
  const autoReply = /auto-replied|auto-generated/i.test(mail.headers['auto-submitted'] || '') || /^(out of office|automatic reply)/i.test(subject);

  // Replies to other CRM emails (like "[Fruit City message #N]") are handled by the caller's hook.
  if (!idm && onOther) {
    const hit = await onOther({ mail, sender, subject, user, failedAuth, autoReply });
    if (hit) return hit;
  }
  // Anything we can't match to a person and their task goes to the first admin, untouched.
  if (!user || !task || !canSee(user, task) || autoReply || (isBlocked && (await isBlocked(user)))) {
    const admin = await db.prepare(`SELECT email FROM users WHERE role='admin' AND email IS NOT NULL ORDER BY id LIMIT 1`).first();
    if (admin?.email && message.canBeForwarded !== false) {
      try { await message.forward(admin.email); return; } catch (e) { /* fall through */ }
    }
    return;
  }

  const reply = replyText(mail.text);
  const first = reply.split('\n').find((l) => l.trim()) || '';
  const saysDone = /^\s*(done|finished|complete|completed)\b[\s.!]*/i.test(first);
  let rest = saysDone ? reply.replace(/^\s*(done|finished|complete|completed)\b[\s.!,:-]*/i, '').trim() : reply.trim();
  if (rest.length > 5000) rest = rest.slice(0, 5000) + '…';

  if (saysDone && !failedAuth && !CLOSED.includes(task.status)) {
    await db.prepare(`UPDATE tasks SET status='done', completed_at=?, updated_at=datetime('now') WHERE id=?`).bind(now(), task.id).run();
    await addUpdate(db, { task_id: task.id, author: user.username, kind: 'status', body: 'Marked done by email reply', source: 'email' });
  }
  let updId = null;
  if (rest || !saysDone) {
    updId = await addUpdate(db, { task_id: task.id, author: user.username, kind: 'message', source: 'email',
      body: (failedAuth ? '[Sender could not be verified, so this did not change the task] ' : '') + (rest || '(empty reply)') });
  }
  const to = otherParty(task, user.username);
  const hit = { username: user.username, table: 'tasks', id: task.id, label: task.title, singular: 'Task' };
  if (!to) return hit;
  const head = saysDone && !failedAuth ? `${user.username} replied "done", so this task is now marked done.` : `${user.username} replied by email:`;
  await emailPerson(env, { ...task, status: saysDone && !failedAuth ? 'done' : task.status }, to,
    `${head}${rest ? `\n\n${rest}` : ''}\n\n${taskText(env, { ...task, status: saysDone && !failedAuth ? 'done' : task.status })}`,
    saysDone && !failedAuth ? 'Done: ' : 'Reply: ', user.username, updId);
  return hit;
}

// Keeps only the new part of a reply: drops quoted lines and the "On ... wrote:" block below them.
export function replyText(text) {
  const lines = String(text || '').replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^\s*>/.test(l)) break;
    if (/^-{2,}\s*(original message|forwarded message)/i.test(l.trim())) break;
    if (/^On\b.*/.test(l.trim()) && [l, lines[i + 1] || '', lines[i + 2] || ''].join(' ').includes('wrote:')) break;
    if (/^From:\s.+/.test(l) && /^(Sent|Date):\s/.test(lines[i + 1] || '')) break;
    if (/^__+$|^-- ?$/.test(l.trim())) break; // signature or Outlook divider
    out.push(l);
  }
  return out.join('\n').trim();
}

// ---------- is the sender who they say they are? ----------
// An email counts as verified only when the Authentication-Results header added by the receiving server
// (Cloudflare Email Routing) says it passed the checks:
// - DMARC (Domain-based Message Authentication, Reporting and Conformance) = pass. DMARC passes only when SPF or
//   DKIM passed for the same domain as the visible From address, so it is the check that matters most; or
// - when the sender's domain publishes no DMARC policy (dmarc=none, or no DMARC result at all), both
//   SPF (Sender Policy Framework: the sending server is allowed to send for that domain) = pass and
//   DKIM (DomainKeys Identified Mail: the message carries a valid signature from the domain) = pass.
// Anything else (fail, softfail, neutral, temperror, permerror, a missing header) is not verified.
// Only the topmost Authentication-Results header is read: the receiving server adds its own on top, and any
// lower one could have been written by the sender to fake a "pass".
export function senderVerified(authResults) {
  const a = String(authResults || '').toLowerCase();
  const result = (name) => (a.match(new RegExp(`\\b${name}=([a-z]+)`)) || [])[1] || null;
  const dmarc = result('dmarc');
  if (dmarc === 'pass') return true;
  if (dmarc && dmarc !== 'none') return false;
  return result('spf') === 'pass' && result('dkim') === 'pass';
}

// ---------- small MIME reader (enough for replies from Gmail, Outlook and phones) ----------
const addrOf = (v) => (String(v || '').match(/<([^>]+)>/) || String(v || '').match(/([^\s<>"]+@[^\s<>"]+)/) || [])[1] || null;

function parseHeaders(str) {
  const h = {};
  const auth = [];
  str.replace(/\r?\n[ \t]+/g, ' ').split(/\r?\n/).forEach((line) => {
    const i = line.indexOf(':');
    if (i < 1) return;
    const k = line.slice(0, i).trim().toLowerCase();
    const v = line.slice(i + 1).trim();
    if (k === 'authentication-results') auth.push(v); // in order, top first
    if (!(k in h)) h[k] = v;
  });
  return { h, auth: auth[0] || '' }; // only the topmost one (see senderVerified)
}

function splitPart(bytes) {
  const s = latin1(bytes);
  const m = s.match(/\r?\n\r?\n/);
  if (!m) return { head: s, body: new Uint8Array() };
  return { head: s.slice(0, m.index), body: bytes.subarray(m.index + m[0].length) };
}
const latin1 = (bytes) => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return s; };
const fromLatin1 = (s) => Uint8Array.from(s, (c) => c.charCodeAt(0) & 255);
const param = (v, name) => (String(v || '').match(new RegExp(`${name}\\s*=\\s*"?([^";]+)"?`, 'i')) || [])[1];

function decodeBody(bytes, cte, charset) {
  let data = bytes;
  const enc = String(cte || '').toLowerCase();
  if (enc === 'base64') data = fromLatin1(atob(latin1(bytes).replace(/[^A-Za-z0-9+/=]/g, '')));
  else if (enc === 'quoted-printable') data = fromLatin1(latin1(bytes).replace(/=\r?\n/g, '').replace(/=([0-9A-Fa-f]{2})/g, (_, x) => String.fromCharCode(parseInt(x, 16))));
  try { return new TextDecoder(charset || 'utf-8').decode(data); } catch (e) { return new TextDecoder('utf-8').decode(data); }
}

function findText(bytes, depth = 0) {
  const { head, body } = splitPart(bytes);
  const { h } = parseHeaders(head);
  const ct = h['content-type'] || 'text/plain';
  if (/^multipart\//i.test(ct) && depth < 5) {
    const boundary = param(ct, 'boundary');
    if (!boundary) return null;
    const parts = latin1(body).split(`--${boundary}`).slice(1).filter((p) => !p.startsWith('--'));
    const found = parts.map((p) => findText(fromLatin1(p.replace(/^\r?\n/, '')), depth + 1)).filter(Boolean);
    return found.find((f) => f.type === 'plain') || found[0] || null;
  }
  if (/^text\/plain/i.test(ct)) return { type: 'plain', text: decodeBody(body, h['content-transfer-encoding'], param(ct, 'charset')) };
  if (/^text\/html/i.test(ct)) {
    const html = decodeBody(body, h['content-transfer-encoding'], param(ct, 'charset'));
    const text = html.replace(/<blockquote[\s\S]*$/i, '').replace(/<br\s*\/?>|<\/(p|div)>/gi, '\n').replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    return { type: 'html', text };
  }
  return null;
}

export function parseMime(bytes) {
  const { head } = splitPart(bytes);
  const { h, auth } = parseHeaders(head);
  const t = findText(bytes);
  return { headers: h, authResults: auth, text: t ? t.text : '' };
}

function decodeWords(s) {
  return String(s).replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g, (_, cs, enc, data) => {
    try {
      const bytes = enc.toUpperCase() === 'B' ? fromLatin1(atob(data))
        : fromLatin1(data.replace(/_/g, ' ').replace(/=([0-9A-Fa-f]{2})/g, (__, x) => String.fromCharCode(parseInt(x, 16))));
      return new TextDecoder(cs).decode(bytes);
    } catch (e) { return data; }
  });
}

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
