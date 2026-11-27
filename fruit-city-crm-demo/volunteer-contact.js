// Copied from crm/src/volunteer-contact.js by crm/demo/build.mjs. Do not edit.
// Contact helpers shared by the CRM (src/index.js) and the volunteer intake (volunteer-intake/worker.js).
//
// Every volunteer application from the website also becomes a CRM contact tagged "volunteer", so applicants
// show up in Contacts next to everyone else. One contact per email address: a repeat application updates
// the existing contact instead of adding a second one.
//
// Court-ordered community service details are NOT copied to the contact. They stay in the application,
// which only admins and VOLUNTEER_REVIEWERS can open; the contact's notes only point to it.

export const normEmail = (e) => (e ? String(e).trim().toLowerCase() || null : null);
export const normPhone = (p) => {
  const d = String(p || '').replace(/\D/g, '');
  return d.length >= 7 ? d.slice(-10) : null;
};
export const tagList = (...vals) => [...new Set(vals.filter(Boolean).map((v) => String(v).trim().toLowerCase()).filter(Boolean))].join(', ');

// Same rule as the CRM's autoTags for contacts: the contact's type plus its organization's name, type and city.
export async function contactAutoTags(db, row) {
  const org = row.org_id ? await db.prepare(`SELECT name, type, city FROM organizations WHERE id=?`).bind(row.org_id).first() : null;
  return tagList(row.type, org?.name, org?.type, org?.city);
}

const addTag = (tags, tag) => {
  const list = String(tags || '').split(',').map((t) => t.trim()).filter(Boolean);
  return list.some((t) => t.toLowerCase() === tag) ? list.join(', ') : [...list, tag].join(', ');
};

// The application's answers, as a short note on the contact. No community service details.
export function applicationNote(appId, app, day = new Date().toISOString().slice(0, 10)) {
  const lines = [`Volunteer application #${appId} from the website (${day}).`];
  if (app.area) lines.push(`Area: ${app.area}`);
  if (app.availability) lines.push(`Availability: ${app.availability}`);
  if (app.availability_notes) lines.push(`Schedule notes: ${app.availability_notes}`);
  if (app.interests) lines.push(`Interested in: ${app.interests}`);
  if (app.experience) lines.push(`Experience: ${app.experience}`);
  lines.push(`Full application: Volunteer applications #${appId}.`);
  return lines.join('\n');
}

/**
 * Creates or updates the CRM contact for a volunteer application, matched by email.
 * New contact: type "volunteer", tag "volunteer", the application's answers in notes.
 * Existing contact: adds the "volunteer" tag, sets type to volunteer only if it had none, fills in a missing
 * phone or last name, and adds the application's answers to its notes. Its other details are left as they are.
 * Returns { id, created }.
 */
export async function upsertVolunteerContact(db, appId, app) {
  const email = normEmail(app.email);
  const note = applicationNote(appId, app);
  const existing = email ? await db.prepare(
    `SELECT * FROM contacts WHERE email_norm = ?1 OR lower(trim(email)) = ?1 ORDER BY id LIMIT 1`
  ).bind(email).first() : null;

  if (!existing) {
    const row = { first_name: app.first_name, last_name: app.last_name, type: 'volunteer', org_id: null };
    const r = await db.prepare(`
      INSERT INTO contacts (first_name, last_name, type, email, phone, email_norm, phone_norm, tags, notes, auto_tags, created_by)
      VALUES (?1, ?2, 'volunteer', ?3, ?4, ?5, ?6, 'volunteer', ?7, ?8, 'website') RETURNING id
    `).bind(app.first_name, app.last_name, app.email, app.phone, email, normPhone(app.phone), note, await contactAutoTags(db, row)).first();
    return { id: r.id, created: true };
  }

  const type = existing.type ? existing.type : 'volunteer';
  const phone = existing.phone || app.phone;
  await db.prepare(`
    UPDATE contacts SET type = ?1, tags = ?2, phone = ?3, phone_norm = ?4, last_name = COALESCE(last_name, ?5),
      email_norm = ?6, notes = ?7, auto_tags = ?8, updated_at = datetime('now')
    WHERE id = ?9
  `).bind(type, addTag(existing.tags, 'volunteer'), phone, normPhone(phone), app.last_name, email,
    existing.notes ? `${existing.notes}\n\n${note}` : note, await contactAutoTags(db, { ...existing, type }), existing.id).run();
  return { id: existing.id, created: false };
}
