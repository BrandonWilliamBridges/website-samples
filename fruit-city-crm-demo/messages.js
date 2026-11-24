// Copied from crm/src/messages.js by crm/demo/build.mjs. Do not edit.
// Messages to contacts, kept in the Interactions log.
// - Tick "Email this summary to the contact when I save" on an interaction and the CRM emails the Summary
//   to the contact's email address, signed with your name, and marks the interaction "we contacted them".
// - When they reply, the reply is saved as a new interaction ("they contacted us") and the admins get it by email.
// - When an admin replies to that email, it is saved the same way and goes back to the contact.
// Free: it uses the same Email Routing binding as task emails, so the contact's address must be a verified
// destination address in Cloudflare Email Routing.
import { sendMail, replyText } from './tasks.js';

export const DIRECTIONS = ['we contacted them', 'they contacted us'];

let ready = false;
export async function ensureInteractionColumns(db) {
  if (ready) return;
  const cols = (await db.prepare(`PRAGMA table_info(interactions)`).all()).results.map((c) => c.name);
  for (const [name, type] of [['direction', 'TEXT'], ['emailed_to', 'TEXT'], ['email_result', 'TEXT']]) {
    if (cols.includes(name)) continue;
    // Several requests can arrive at once on first run; another one may have just added it.
    try { await db.prepare(`ALTER TABLE interactions ADD COLUMN ${name} ${type}`).run(); }
    catch (e) { if (!/duplicate column/i.test(String(e?.message || e))) throw e; }
  }
  ready = true;
}

const tag = (id) => `[Fruit City message #${id}]`;
const nameOf = (username) => (username ? username.charAt(0).toUpperCase() + username.slice(1) : 'The Fruit City team');
const crmUrl = (env) => env.CRM_URL || 'https://crm.fruitcityworldwide.org';
const contactName = (c) => [c?.first_name, c?.last_name].filter(Boolean).join(' ') || 'the contact';
const today = () => new Date().toISOString().slice(0, 10);

function footer(env, who) {
  return ['', '---', `To answer ${who}, just reply to this email. Your reply is saved in the Fruit City CRM and ${who} gets it by email.`].join('\n');
}

function explain(e) {
  const m = String(e?.message || e);
  if (/destination|verif/i.test(m)) return 'their address is not verified in Cloudflare Email Routing yet (Email Routing > Destination addresses)';
  return m.slice(0, 200) || 'email is not set up for the CRM yet';
}

// Runs after an interaction is saved. Returns a short line for the save message, or null.
// canSeeContact(id) answers whether this person may see that contact under the same rule as the Contacts list
// (members: contacts they created, plus the admins' own contact records; admins: all). Without it, only admins may email.
export async function afterInteractionSave(env, me, id, full, emailNow, canSeeContact) {
  if (!emailNow) return null;
  const db = env.DB;
  await ensureInteractionColumns(db);
  const contact = full.contact_id ? await db.prepare(`SELECT first_name, last_name, email FROM contacts WHERE id=?`).bind(full.contact_id).first() : null;
  const allowed = contact && (canSeeContact ? await canSeeContact(Number(full.contact_id)) : me.role === 'admin');
  let result;
  if (!contact || !allowed) result = 'not emailed: pick a Contact first';
  else if (!contact.email) result = `not emailed: ${contactName(contact)} has no email address on their contact record`;
  else if (!String(full.summary || '').trim()) result = 'not emailed: write the message in Summary first';
  else {
    const who = nameOf(me.username);
    try {
      await sendMail(env, {
        to: contact.email,
        fromName: `${who} via Fruit City CRM`,
        subject: `${tag(id)} Message from ${who}`,
        text: `${String(full.summary).trim()}\n\n${who}\nFruit City Worldwide\n${footer(env, who)}`,
      });
      result = `emailed to ${contactName(contact)} at ${contact.email}`;
    } catch (e) {
      result = `not emailed to ${contactName(contact)}: ${explain(e)}`;
    }
  }
  const sent = result.startsWith('emailed');
  await db.prepare(`UPDATE interactions SET emailed_to=?, email_result=?, direction=COALESCE(direction, ?), kind=CASE WHEN ? THEN 'email' ELSE kind END WHERE id=?`)
    .bind(contact?.email || null, result, sent ? 'we contacted them' : null, sent ? 1 : 0, id).run();
  return result.charAt(0).toUpperCase() + result.slice(1) + '.';
}

// Handles a reply to a "[Fruit City message #N]" email. Returns {username, id, label} when saved, or null
// (the caller then forwards the mail to the first admin, untouched).
export async function handleMessageReply(env, { mail, sender, subject, user, failedAuth, autoReply }) {
  const idm = subject.match(/message #(\d+)/i);
  if (!idm || autoReply) return null;
  const db = env.DB;
  await ensureInteractionColumns(db);
  const orig = await db.prepare(`SELECT * FROM interactions WHERE id=?`).bind(Number(idm[1])).first();
  if (!orig) return null;
  const contact = orig.contact_id ? await db.prepare(`SELECT id, first_name, last_name, email FROM contacts WHERE id=?`).bind(orig.contact_id).first() : null;
  if (!contact) return null;
  const fromContact = sender && contact.email && sender === String(contact.email).toLowerCase();
  // failedAuth is true unless the receiving server's Authentication-Results header shows the sender passed
  // DMARC (Domain-based Message Authentication, Reporting and Conformance), or, when the sender's domain publishes
  // no DMARC policy, both SPF (Sender Policy Framework) and DKIM (DomainKeys Identified Mail) passed. See
  // senderVerified in tasks.js. An unverified email is still saved, marked as unverified, but it is never
  // treated as coming from an admin, so it can't be passed on to the contact in an admin's name.
  const fromAdmin = user?.role === 'admin' && !fromContact && !failedAuth;
  // Only the contact, a CRM user, or an admin may add to the log. Anyone else goes to the admin untouched.
  if (!fromContact && !user) return null;

  let text = replyText(mail.text).trim() || '(empty reply)';
  if (text.length > 5000) text = text.slice(0, 5000) + '…';
  if (failedAuth) text = `[The sender could not be verified] ${text}`;
  const author = user?.username || sender;
  const direction = fromAdmin ? 'we contacted them' : 'they contacted us';
  const r = await db.prepare(`INSERT INTO interactions (date, kind, contact_id, org_id, summary, direction, created_by) VALUES (?,?,?,?,?,?,?) RETURNING id`)
    .bind(today(), 'email', orig.contact_id, orig.org_id, text, direction, author).first();

  const who = fromAdmin ? nameOf(user.username) : contactName(contact);
  let result;
  try {
    if (fromAdmin && !failedAuth) {
      // An admin answered by email: send it on to the contact.
      await sendMail(env, { to: contact.email, fromName: `${who} via Fruit City CRM`, subject: `${tag(r.id)} Message from ${who}`,
        text: `${text}\n\n${who}\nFruit City Worldwide\n${footer(env, who)}` });
      result = `emailed to ${contactName(contact)} at ${contact.email}`;
    } else {
      // The contact answered: tell the admins.
      const admins = (await db.prepare(`SELECT email FROM users WHERE role='admin' AND email IS NOT NULL`).all()).results;
      for (const a of admins) {
        await sendMail(env, { to: a.email, fromName: 'Fruit City CRM', subject: `${tag(r.id)} Reply from ${who}`,
          text: `${who} replied:\n\n${text}\n\nSaved in the CRM under Interactions: ${crmUrl(env)}/#interactions\n${footer(env, who)}` });
      }
      result = `emailed to the admins`;
    }
  } catch (e) {
    result = `not emailed: ${explain(e)}`;
  }
  await db.prepare(`UPDATE interactions SET emailed_to=?, email_result=? WHERE id=?`)
    .bind(fromAdmin ? contact.email : 'admins', result, r.id).run();
  return { username: author, table: 'interactions', id: r.id, label: `${who} by email`, singular: 'Interaction' };
}
