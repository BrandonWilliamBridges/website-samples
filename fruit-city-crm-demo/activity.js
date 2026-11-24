// Copied from crm/src/activity.js by crm/demo/build.mjs. Do not edit.
// Activity alerts and the weekly report.
// - Every add, edit and delete in the CRM is written to activity_log.
// - When someone named in ALERT_USERS (wrangler.toml, comma separated, for example "ahmed") changes something,
//   the admins get a short email about it.
// - Every week (Cron Trigger in wrangler.toml) the admins get one email that totals what those people did.
// Free: the email goes through the same Email Routing binding as task emails (admins' addresses are verified).
import { sendMail } from './tasks.js';

export const ACTIVITY_SQL = `
CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id INTEGER,
  label TEXT,
  source TEXT NOT NULL DEFAULT 'crm',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(username, created_at);`;

let ready = false;
export async function ensureActivityTable(db) {
  if (ready) return;
  await db.batch(ACTIVITY_SQL.split(';').map((s) => s.trim()).filter(Boolean).map((s) => db.prepare(s)));
  ready = true;
}

export const watchedUsers = (env) => String(env.ALERT_USERS || '').split(',').map((u) => u.trim()).filter(Boolean);

const VERB = { add: 'added', edit: 'changed', delete: 'deleted', message: 'wrote on', reply: 'replied by email on', upload: 'added a photo or video to', sign: 'signed' };

// Writes one line to the log, and emails the admins when the person is on the alert list.
// Task changes and task messages already email the other person on the task, so those don't send a second alert.
export async function logActivity(env, me, action, table, id, label, singular, source = 'crm') {
  const db = env.DB;
  await ensureActivityTable(db);
  await db.prepare(`INSERT INTO activity_log (username, action, table_name, record_id, label, source) VALUES (?,?,?,?,?,?)`)
    .bind(me.username, action, table, id ?? null, label ? String(label).slice(0, 200) : null, source).run();
  if (!watchedUsers(env).includes(me.username) || table === 'tasks' || table === 'task_updates' || (table === 'interactions' && source === 'email')) return;
  const what = `${singular ? singular.toLowerCase() : table}${label ? `: ${String(label).slice(0, 120)}` : ''}`;
  const line = `${me.username} ${VERB[action] || action} ${singular && action !== 'add' ? 'the ' : 'a '}${what}`;
  const url = `${env.CRM_URL || 'https://crm.fruitcityworldwide.org'}/#${table}`;
  const admins = (await db.prepare(`SELECT email FROM users WHERE role='admin' AND email IS NOT NULL`).all()).results;
  for (const a of admins) {
    try {
      await sendMail(env, { to: a.email, subject: `Fruit City CRM: ${line}`.slice(0, 150),
        text: `${line} (${new Date().toUTCString()}).\n\nOpen it: ${url}\n\nYou get this because ${me.username} is on the CRM's alert list (ALERT_USERS). A weekly total comes every Monday morning.` });
    } catch (e) { /* the change is saved either way; a failed alert must not block it */ }
  }
}

// ---------- weekly report ----------
const LABELS = { tasks: 'tasks', organizations: 'organizations', contacts: 'contacts', interactions: 'interactions', donations: 'donations',
  grants: 'grants', programs: 'programs', deliveries: 'deliveries', budget_lines: 'budget lines', volunteer_applications: 'volunteer applications', attachments: 'photos or videos' };
const plural = (n, word) => `${n} ${n === 1 ? word.replace(/ies$/, 'y').replace(/s$/, '') : word}`;

export async function weeklyReport(env, days = 7) {
  const db = env.DB;
  await ensureActivityTable(db);
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 19).replace('T', ' ');
  const today = new Date().toISOString().slice(0, 10);
  const users = watchedUsers(env);
  const sections = [];
  for (const u of users) {
    const rows = (await db.prepare(`SELECT action, table_name, COUNT(*) n FROM activity_log WHERE username=? AND created_at>=? GROUP BY action, table_name`).bind(u, since).all()).results;
    const by = (action) => rows.filter((r) => r.action === action && LABELS[r.table_name]).map((r) => plural(r.n, LABELS[r.table_name]));
    const t = await db.prepare(`SELECT
        SUM(CASE WHEN status='done' AND completed_at>=? THEN 1 ELSE 0 END) AS finished,
        SUM(CASE WHEN status NOT IN ('done','cancelled') THEN 1 ELSE 0 END) AS open,
        SUM(CASE WHEN status NOT IN ('done','cancelled') AND due_date IS NOT NULL AND due_date<? THEN 1 ELSE 0 END) AS overdue,
        SUM(CASE WHEN created_at>=? THEN 1 ELSE 0 END) AS given
      FROM tasks WHERE assigned_to=?`).bind(since, today, since, u).first().catch(() => ({}));
    const msgs = await db.prepare(`SELECT COUNT(*) n FROM task_updates WHERE author=? AND kind='message' AND created_at>=?`).bind(u, since).first().catch(() => ({ n: 0 }));
    const dv = await db.prepare(`SELECT COUNT(*) n, SUM(pounds) lbs, SUM(people_reached) ppl FROM deliveries WHERE created_by=? AND created_at>=?`).bind(u, since).first().catch(() => ({ n: 0 }));
    const openList = (await db.prepare(`SELECT id, title, due_date FROM tasks WHERE assigned_to=? AND status NOT IN ('done','cancelled') ORDER BY due_date IS NULL, due_date LIMIT 5`).bind(u).all().catch(() => ({ results: [] }))).results;
    const lines = [`${u}, last ${days} days:`];
    const added = by('add'), edited = by('edit'), deleted = by('delete');
    lines.push(`- Added: ${added.length ? added.join(', ') : 'nothing'}`);
    lines.push(`- Changed: ${edited.length ? edited.join(', ') : 'nothing'}`);
    if (deleted.length) lines.push(`- Deleted: ${deleted.join(', ')}`);
    lines.push(`- Tasks: ${t?.finished || 0} finished, ${t?.open || 0} still open${t?.overdue ? ` (${t.overdue} past due)` : ''}, ${t?.given || 0} new this week`);
    if (msgs?.n) lines.push(`- Messages on tasks: ${msgs.n}`);
    if (dv?.n) lines.push(`- Deliveries logged: ${dv.n} (${Math.round(dv.lbs || 0)} lb, ${dv.ppl || 0} people reached)`);
    if (openList.length) lines.push('', `Open tasks for ${u}:`, ...openList.map((o) => `- #${o.id} ${o.title}${o.due_date ? ` (due ${o.due_date})` : ''}`));
    sections.push(lines.join('\n'));
  }
  const text = users.length
    ? `Weekly Fruit City CRM report\n\n${sections.join('\n\n')}\n\nOpen the CRM: ${env.CRM_URL || 'https://crm.fruitcityworldwide.org'}`
    : 'Nobody is on the alert list (ALERT_USERS in wrangler.toml), so there is nothing to report.';
  return { text, users };
}

export async function sendWeeklyReport(env) {
  const { text, users } = await weeklyReport(env);
  if (!users.length) return 'Nobody to report on.';
  const admins = (await env.DB.prepare(`SELECT email, username FROM users WHERE role='admin' AND email IS NOT NULL`).all()).results;
  const sent = [];
  for (const a of admins) {
    try { await sendMail(env, { to: a.email, subject: `Fruit City CRM weekly report: ${users.join(', ')}`, text }); sent.push(a.username); }
    catch (e) { /* keep going for the other admins */ }
  }
  return sent.length ? `Emailed to ${sent.join(', ')}.` : 'Not sent: no admin address could be reached.';
}
