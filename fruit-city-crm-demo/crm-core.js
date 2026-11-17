// Generated from crm/src/index.js by crm/demo/build.mjs. Do not edit.
// Fruit City Worldwide CRM — Cloudflare Worker + D1
// Auth: Cloudflare Access (email one-time code) in front of the whole site.
// The Worker verifies the Access JWT and maps the email to a row in `users` (role: admin/member).
// Members see only the records they created themselves; admins see everything.
const HTML = ''; // the demo serves ui.html itself
import { TASKS_SCHEMA, TASKS_SELECT, TASKS_ORDER, tasksScope, ensureTaskTables, userOptions, afterTaskSave, taskUpdatesApi, handleTaskEmail } from './tasks.js';
import { ensureInteractionColumns, afterInteractionSave, handleMessageReply, DIRECTIONS } from './messages.js';
import { ensureActivityTable, logActivity, weeklyReport, sendWeeklyReport, watchedUsers } from './activity.js';
import { ensureAgreements, agreementRow, statusOf, myAgreement, myAgreementApi, agreementsAdminApi, messagesApi, acceptFromInteraction, ADMIN_CONTACTS_SQL, OPEN_WHEN_BLOCKED } from './agreement.js';

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
const PROGRAM_STATUS = ['planned', 'waiting on partner', 'active', 'paused', 'ended'];
const BUDGET_CATEGORIES = ['cold storage (coolers, ice)', 'loading (hand truck, bins)', 'hand-off (tables, canopy)', 'food-safe supplies', 'volunteer training', 'fuel or van rental', 'other'];
// Volunteer applications from the website's volunteer page (crm/volunteer-intake writes them).
const VOLUNTEER_STATUS = ['new', 'reviewing', 'waiting on applicant', 'accepted', 'not a fit right now', 'withdrawn', 'finished'];
// Starting text for the "Next steps for the applicant" box when a reviewer picks a status and the box is empty.
// Fruit City's own wording: edit freely. Words in [brackets] are for the reviewer to fill in; {first_name} is filled automatically.
// Keep promises out of these until the team has agreed them (for example, never say hours "will be approved").
const VOLUNTEER_MESSAGES = {
  reviewing: 'Hi {first_name}, thank you for applying to volunteer with Fruit City Worldwide. We have your application and will be in touch soon.',
  'waiting on applicant': 'Hi {first_name}, thanks for applying to volunteer with Fruit City Worldwide. Before we can match you, we need: [what is missing].',
  accepted: 'Hi {first_name}, we would love to have you volunteer with Fruit City Worldwide. Your first activity: [date, time and place]. Please bring: [what to bring]. [For community service: what your supervising agency needs from us.]',
  'not a fit right now': 'Hi {first_name}, thank you for applying to volunteer with Fruit City Worldwide. We don\'t have a good fit for you right now, but we will keep your details and reach out if that changes.',
};
// Applications can include court-ordered community service details, so only admins and the
// usernames in the VOLUNTEER_REVIEWERS var (wrangler.toml, comma separated) can see them.
const REVIEWER_ONLY = ['volunteer_applications'];
const canReview = (env, user) => user.role === 'admin' ||
  String(env.VOLUNTEER_REVIEWERS || '').split(',').map((u) => u.trim()).filter(Boolean).includes(user.username);
const visibleSchema = (me) => (me.canReview ? SCHEMA : Object.fromEntries(Object.entries(SCHEMA).filter(([t]) => !REVIEWER_ONLY.includes(t))));

const CONTACT_TYPES = ['pastor', 'imam', 'rabbi', 'priest', 'monk / nun', 'faith leader', 'community leader', 'partner', 'volunteer', 'donor', 'board', 'advisor', 'staff', 'other'];

// Single source of truth for tables + form fields (UI reads this via /api/schema)
const SCHEMA = {
  tasks: TASKS_SCHEMA,
  organizations: {
    label: 'Organizations', singular: 'Organization', title: 'name', tagged: true,
    search: ['name', 'type', 'city', 'denomination', 'tags', 'auto_tags', 'notes'],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true, list: true },
      { name: 'type', label: 'Type', type: 'select', options: ORG_TYPES, list: true, help: 'What kind of place this is. Places of worship of every faith are listed first; pick other to type your own.' },
      { name: 'denomination', label: 'Denomination / tradition', type: 'select', dependsOn: 'type', optionsMap: DENOMINATIONS, help: 'The choices change with the type. Leave it blank if you are not sure.' },
      { name: 'status', label: 'Status', type: 'select', options: ORG_STATUS, list: true, help: 'Prospect: not contacted yet. Contacted: you reached out. Engaged: talking regularly. Partner: working together. Inactive: on hold.' },
      { name: 'address', label: 'Street address', type: 'text', geo: true, help: 'Type the address and the map pin is found for you.' },
      { name: 'city', label: 'City', type: 'text', list: true, geo: true },
      { name: 'state', label: 'State', type: 'text', geo: true },
      { name: 'zip', label: 'ZIP', type: 'text', geo: true },
      { name: 'lat', label: 'Latitude', type: 'number', step: 'any' },
      { name: 'lng', label: 'Longitude', type: 'number', step: 'any' },
      { name: 'website', label: 'Website', type: 'url' },
      { name: 'phone', label: 'Phone', type: 'tel', list: true },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'tags', label: 'Extra tags (optional, comma separated)', type: 'text', help: 'Tags like type and city are added for you. Add your own here, such as "garden site", to find records later.' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  contacts: {
    label: 'Contacts', singular: 'Contact', title: 'first_name', tagged: true,
    search: ['c.first_name', 'c.last_name', 'c.email', 'c.phone', 'c.role', 'c.tags', 'c.auto_tags', 'o.name'],
    fields: [
      { name: 'first_name', label: 'First name', type: 'text', required: true, list: true },
      { name: 'last_name', label: 'Last name', type: 'text', list: true },
      { name: 'org_id', label: 'Organization', type: 'ref', ref: 'organizations', list: true, allowNew: true, help: 'Where this person works or worships. Pick + Add new organization if it is not listed yet.' },
      { name: 'role', label: 'Role / title', type: 'text', list: true },
      { name: 'type', label: 'Type', type: 'select', options: CONTACT_TYPES, help: 'How this person relates to Fruit City, for example faith leader, volunteer or donor.' },
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
      { name: 'direction', label: 'Who reached out', type: 'select', options: DIRECTIONS, list: true, help: 'We contacted them, or they contacted us. Emails sent and received through the CRM fill this in for you.' },
      { name: 'contact_id', label: 'Contact', type: 'ref', ref: 'contacts', list: true },
      { name: 'org_id', label: 'Organization', type: 'ref', ref: 'organizations', list: true, allowNew: true },
      { name: 'summary', label: 'Summary', type: 'textarea', list: true, help: 'What happened. If you tick the email box below, this is the message the contact gets.' },
      { name: 'email_now', label: 'Email this summary to the contact when I save', type: 'checkbox', virtual: true, help: "Sends the Summary to the contact's email address, signed with your name. When they reply, their answer is saved here as a new interaction and you get it by email." },
      { name: 'follow_up_date', label: 'Follow-up date', type: 'date', list: true, help: 'When to get back in touch. It shows on the Dashboard until you tick Follow-up done.' },
      { name: 'follow_up_done', label: 'Follow-up done', type: 'checkbox' },
    ],
  },
  donations: {
    label: 'Donations', singular: 'Donation', title: 'amount', stub: true,
    search: ['d.method', 'd.notes', 'c.first_name', 'c.last_name', 'o.name'],
    fields: [
      { name: 'date', label: 'Date', type: 'date', list: true, default: 'today' },
      { name: 'amount', label: 'Amount ($)', type: 'number', step: '0.01', list: true },
      { name: 'method', label: 'Method', type: 'select', options: ['Zelle', 'PayPal', 'check', 'cash', 'in-kind', 'other'], list: true, help: 'In-kind means goods or services instead of money; describe them in notes.' },
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
      { name: 'stage', label: 'Stage', type: 'select', options: ['researching', 'drafting', 'submitted', 'awarded', 'declined'], list: true, help: 'Where the application stands. Move it along as you go so deadlines do not slip.' },
      { name: 'deadline', label: 'Deadline', type: 'date', list: true },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },

  // ---- Food rescue tracker. These live under "Food rescue" in the menu, not as their own tabs. ----
  programs: {
    label: 'Programs', singular: 'Program', title: 'name', hub: 'impact',
    intro: 'A program is one ongoing effort you report on, like the weekly food pickups with Food Not Bombs. Set it up once; then log each delivery against it.',
    search: ['p.name', 'p.food_source', 'p.status', 'p.notes', 'o.name'],
    fields: [
      { name: 'name', label: 'Program name', type: 'text', required: true, list: true,
        help: 'What you call it in grant reports, for example "Community Food Rescue".' },
      { name: 'partner_org_id', label: 'Partner organization', type: 'ref', ref: 'organizations', list: true, allowNew: true,
        help: 'The group you run it with, such as Food Not Bombs Houston. Pick it from your organizations so its contacts and history stay linked.' },
      { name: 'status', label: 'Status', type: 'select', options: PROGRAM_STATUS, list: true,
        help: 'Planned: not started. Waiting on partner: ready, but a deal or paperwork is pending. Active: deliveries are happening. Paused or Ended when it stops.' },
      { name: 'start_date', label: 'Start date', type: 'date', list: true,
        help: 'The first week of deliveries. Grant forms ask for this, and the Impact page counts weeks from it.' },
      { name: 'food_source', label: 'Main food source', type: 'text', list: true,
        help: 'Where the food usually comes from, for example a grocery store. Each delivery can name its own source too.' },
      { name: 'goal_pounds_week', label: 'Goal: pounds per week', type: 'number', step: 'any',
        help: 'How many pounds of food you aim to move in a typical week. The Impact page shows how close you are.' },
      { name: 'goal_people_week', label: 'Goal: people reached per week', type: 'number', step: '1',
        help: 'How many people you aim to reach in a typical week.' },
      { name: 'partner_contact_id', label: 'Partner contact', type: 'ref', ref: 'contacts', more: true,
        help: 'Your main person at the partner, so you know who to call.' },
      { name: 'source_deal_signed', label: 'Food source deal is signed', type: 'checkbox', more: true,
        help: 'Tick this once the store or partner has agreed in writing. Funders want to see the program is real.' },
      { name: 'end_date', label: 'End date', type: 'date', more: true, help: 'Leave blank while it is running.' },
      { name: 'goal_deliveries_week', label: 'Goal: deliveries per week', type: 'number', step: 'any', more: true,
        help: 'How many pickup-and-drop-off runs you plan each week.' },
      { name: 'goal_volunteers_week', label: 'Goal: volunteers per week', type: 'number', step: '1', more: true,
        help: 'How many volunteers you need each week to keep it running.' },
      { name: 'lbs_per_meal', label: 'Pounds per meal', type: 'number', step: 'any', more: true,
        help: 'How many pounds of food count as one meal. Use the rate your funder or food bank uses, and keep it the same, so meal counts can be estimated from pounds when nobody counted meals.' },
      { name: 'budget_total', label: 'Total budget ($)', type: 'number', step: '0.01', more: true,
        help: 'The program budget you are asking for or working with. Break it into lines under Budget below.' },
      { name: 'notes', label: 'Notes', type: 'textarea', more: true },
    ],
  },
  deliveries: {
    label: 'Deliveries', singular: 'Delivery', title: 'date', hub: 'impact',
    intro: 'Log one row for each pickup and drop-off run. Only the date is required, but pounds and people reached are what grant reports ask for most.',
    search: ['dv.pickup_source', 'dv.notes', 'p.name', 'o.name'],
    fields: [
      { name: 'date', label: 'Date', type: 'date', list: true, default: 'today', required: true },
      { name: 'program_id', label: 'Program', type: 'ref', ref: 'programs', list: true, default: 'only',
        help: 'Which program this run belongs to. If you only have one, it is picked for you.' },
      { name: 'pickup_source', label: 'Picked up from', type: 'text', list: true,
        help: 'The store or partner the food came from on this run.' },
      { name: 'pounds', label: 'Pounds of food', type: 'number', step: 'any', list: true,
        help: 'Total weight moved on this run. A bathroom scale and a few weighed boxes are fine; estimate the rest.' },
      { name: 'people_reached', label: 'People reached', type: 'number', step: '1', list: true,
        help: 'How many people received food from this run. Count people, not households, and say so in notes if you counted households.' },
      { name: 'site_org_id', label: 'Drop-off site', type: 'ref', ref: 'organizations', list: true, allowNew: true,
        help: 'Where the food went, such as a church, mosque or community center. Leave blank for home deliveries only.' },
      { name: 'volunteers', label: 'Volunteers', type: 'number', step: '1', list: true,
        help: 'How many volunteers helped on this run, drivers included.' },
      { name: 'meals', label: 'Meals', type: 'number', step: 'any', more: true,
        help: 'Leave blank to estimate meals from pounds, using the program\'s pounds-per-meal rate.' },
      { name: 'items', label: 'Boxes or items', type: 'number', step: '1', more: true,
        help: 'Optional count of boxes, bags or items, if that is easier than weight.' },
      { name: 'home_deliveries', label: 'Home deliveries', type: 'number', step: '1', more: true,
        help: 'How many drop-offs went straight to people who could not come to a site.' },
      { name: 'volunteer_hours', label: 'Volunteer hours', type: 'number', step: 'any', more: true,
        help: 'Total hours across all volunteers on this run. Funders often value volunteer time.' },
      { name: 'miles', label: 'Miles driven', type: 'number', step: 'any', more: true,
        help: 'Round-trip miles, for fuel and mileage reporting.' },
      { name: 'cost', label: 'Cost of this run ($)', type: 'number', step: '0.01', more: true,
        help: 'Fuel, van rental, ice or supplies spent on this run. Used for cost per pound and per meal.' },
      { name: 'notes', label: 'Notes', type: 'textarea', more: true },
    ],
  },
  volunteer_applications: {
    label: 'Volunteer applications', singular: 'Volunteer application', title: 'first_name',
    intro: 'Applications from the volunteer page on the website. Only admins and named reviewers can see them. Pick a status, write the next steps, then use Email or Text to send them. Saving a new status records who changed it and when.',
    messages: VOLUNTEER_MESSAGES,
    search: ['va.first_name', 'va.last_name', 'va.email', 'va.phone', 'va.area', 'va.interests', 'va.experience', 'va.status'],
    fields: [
      { name: 'status', label: 'Status', type: 'select', options: VOLUNTEER_STATUS, list: true, required: true,
        help: 'New: just arrived. Reviewing: someone is looking at it. Waiting on applicant: you asked them for something. Accepted: they can start. Not a fit right now, Withdrawn or Finished close it.' },
      { name: 'first_name', label: 'First name', type: 'text', list: true, required: true },
      { name: 'last_name', label: 'Last name', type: 'text', list: true },
      { name: 'submitted_at', label: 'Applied', type: 'text', list: true, help: 'When the application arrived (UTC).' },
      { name: 'court_ordered', label: 'Court-ordered hours', type: 'checkbox', list: true,
        help: 'Ticked when the applicant said they need court-ordered community service hours.' },
      { name: 'hours_needed', label: 'Hours needed', type: 'number', step: 'any', list: true },
      { name: 'hours_deadline', label: 'Hours deadline', type: 'date', list: true },
      { name: 'area', label: 'Area', type: 'text', list: true },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'phone', label: 'Phone', type: 'tel' },
      { name: 'availability', label: 'Availability', type: 'text' },
      { name: 'availability_notes', label: 'Schedule notes', type: 'text' },
      { name: 'interests', label: 'Interested in', type: 'text' },
      { name: 'experience', label: 'Experience', type: 'textarea' },
      { name: 'next_steps', label: 'Next steps for the applicant', type: 'textarea',
        help: 'What you will send them. Picking a status fills in a starting message when this is empty; edit the [brackets] before sending.' },
      { name: 'review_notes', label: 'Internal notes', type: 'textarea',
        help: 'For the team only. Never sent to the applicant. Don\'t record case numbers, charges or other legal details here.' },
      { name: 'contact_ok', label: 'Agreed to be contacted', type: 'checkbox', more: true },
      { name: 'cs_acknowledged', label: 'Acknowledged acceptance is not guaranteed', type: 'checkbox', more: true },
      { name: 'age_confirmed', label: 'Confirmed minimum age', type: 'checkbox', more: true },
      { name: 'source', label: 'Applied on page', type: 'text', more: true },
    ],
  },
  budget_lines: {
    label: 'Budget lines', singular: 'Budget line', title: 'category', hub: 'impact', hidden: true,
    search: ['bl.category', 'bl.description', 'bl.notes', 'p.name'],
    fields: [
      { name: 'program_id', label: 'Program', type: 'ref', ref: 'programs', list: true, default: 'only', required: true },
      { name: 'category', label: 'Category', type: 'select', options: BUDGET_CATEGORIES, list: true,
        help: 'Group costs the way grant forms do, so the totals drop straight into a budget table.' },
      { name: 'description', label: 'What it is', type: 'text', list: true, help: 'For example "4 large coolers and ice packs".' },
      { name: 'estimated', label: 'Estimated ($)', type: 'number', step: '0.01', list: true,
        help: 'Your quote or best guess before buying. Replace guesses with real quotes before you submit a grant.' },
      { name: 'actual', label: 'Actual spent ($)', type: 'number', step: '0.01', list: true,
        help: 'What you really paid. Fill it in after buying, for the grant report.' },
      { name: 'grant_id', label: 'Paid for by grant', type: 'ref', ref: 'grants', list: true,
        help: 'If a grant covers this line, pick it here so you can show the funder where their money went.' },
      { name: 'notes', label: 'Notes', type: 'textarea', more: true },
    ],
  },
};

// List/read SQL with joins so the UI can show names instead of ids
const SELECT = {
  tasks: TASKS_SELECT,
  organizations: `SELECT o.*, (SELECT COUNT(*) FROM contacts c WHERE c.org_id=o.id) AS contact_count FROM organizations o`,
  contacts: `SELECT c.*, o.name AS org_id__label FROM contacts c LEFT JOIN organizations o ON o.id=c.org_id`,
  interactions: `SELECT i.*, TRIM(COALESCE(c.first_name,'')||' '||COALESCE(c.last_name,'')) AS contact_id__label, o.name AS org_id__label
                 FROM interactions i LEFT JOIN contacts c ON c.id=i.contact_id LEFT JOIN organizations o ON o.id=i.org_id`,
  donations: `SELECT d.*, TRIM(COALESCE(c.first_name,'')||' '||COALESCE(c.last_name,'')) AS contact_id__label, o.name AS org_id__label
              FROM donations d LEFT JOIN contacts c ON c.id=d.contact_id LEFT JOIN organizations o ON o.id=d.org_id`,
  grants: `SELECT g.*, o.name AS funder_org_id__label FROM grants g LEFT JOIN organizations o ON o.id=g.funder_org_id`,
  programs: `SELECT p.*, o.name AS partner_org_id__label, TRIM(COALESCE(c.first_name,'')||' '||COALESCE(c.last_name,'')) AS partner_contact_id__label
             FROM programs p LEFT JOIN organizations o ON o.id=p.partner_org_id LEFT JOIN contacts c ON c.id=p.partner_contact_id`,
  deliveries: `SELECT dv.*, p.name AS program_id__label, o.name AS site_org_id__label,
               CASE WHEN dv.meals IS NULL AND dv.pounds IS NOT NULL AND p.lbs_per_meal > 0 THEN ROUND(dv.pounds / p.lbs_per_meal) END AS meals__estimate
               FROM deliveries dv LEFT JOIN programs p ON p.id=dv.program_id LEFT JOIN organizations o ON o.id=dv.site_org_id`,
  volunteer_applications: `SELECT va.* FROM volunteer_applications va`,
  budget_lines: `SELECT bl.*, p.name AS program_id__label, g.name AS grant_id__label
                 FROM budget_lines bl LEFT JOIN programs p ON p.id=bl.program_id LEFT JOIN grants g ON g.id=bl.grant_id`,
};
const ALIAS = { tasks: 'tk', organizations: 'o', contacts: 'c', interactions: 'i', donations: 'd', grants: 'g', programs: 'p', deliveries: 'dv', budget_lines: 'bl', volunteer_applications: 'va' };
const ORDER = {
  tasks: TASKS_ORDER,
  organizations: 'o.name COLLATE NOCASE', contacts: 'c.first_name COLLATE NOCASE, c.last_name COLLATE NOCASE',
  interactions: 'i.date DESC, i.id DESC', donations: 'd.date DESC, d.id DESC', grants: 'g.deadline IS NULL, g.deadline',
  programs: 'p.start_date IS NULL, p.start_date DESC, p.id DESC', deliveries: 'dv.date DESC, dv.id DESC', budget_lines: 'bl.program_id, bl.category, bl.id',
  volunteer_applications: "va.status != 'new', va.submitted_at DESC, va.id DESC",
};
// Members only see rows they created, except Food rescue: its program, budget and delivery log are shared team records,
// so everyone who signs in can see the program and log deliveries against it.
// Volunteer applications are shared among reviewers; who may see them at all is checked by canReview.
// Tasks have their own rule: the person who gave a task and the person doing it both see it (tasksScope).
const SHARED = ['programs', 'deliveries', 'budget_lines', 'tasks', ...REVIEWER_ONLY];
const PRIVATE = Object.fromEntries(Object.entries(ALIAS).filter(([t]) => !SHARED.includes(t)));
// Members can also read (never change) the admins' own contact records, so everyone can find how to reach them.
const scopeSql = (table, me, write = false) => (table === 'tasks' ? tasksScope(me)
  : me.role !== 'admin' && PRIVATE[table]
    ? (table === 'contacts' && !write ? { sql: `(c.created_by=? OR ${ADMIN_CONTACTS_SQL})`, binds: [me.username] } : { sql: `${PRIVATE[table]}.created_by=?`, binds: [me.username] })
    : null);
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
      user.canReview = canReview(env, user);
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
  // Replies to task emails (Email Routing rule: tasks@ -> this Worker)
  async email(message, env) {
    await ensureAgreements(env);
    // Someone limited by the confidentiality agreement can't change tasks by email; those replies go to the admin untouched.
    const isBlocked = async (u) => u.role !== 'admin' && statusOf(env, await agreementRow(env, u.username)).status === 'blocked';
    const hit = await handleTaskEmail(message, env, (m) => handleMessageReply(env, m), isBlocked);
    if (hit) await logActivity(env, { username: hit.username }, 'reply', hit.table, hit.id, hit.label, hit.singular || 'Interaction', 'email');
    // A "Yes, I agree" reply to a CRM message accepts the confidentiality agreement.
    if (hit?.table === 'interactions') await acceptFromInteraction(env, hit.id, 'email');
  },
  // Weekly report (Cron Trigger in wrangler.toml)
  async scheduled(event, env, ctx) {
    ctx.waitUntil(sendWeeklyReport(env));
  },
};

async function api(request, env, url, me) {
  const email = me.username;
  const isAdmin = me.role === 'admin';
  const db = env.DB;
  const parts = url.pathname.split('/').filter(Boolean); // ['api', table, id]
  const method = request.method;
  await ensureTaskTables(db);
  await ensureActivityTable(db);
  await ensureInteractionColumns(db);
  await ensureAgreements(env);

  // Confidentiality agreement gate: three days after it was sent, until they accept, a member can only read and sign it,
  // message the admins and see the admins' contact records. Admins are never limited.
  const ag = isAdmin ? { status: 'none' } : statusOf(env, await agreementRow(env, email));
  me.limited = ag.status === 'blocked';
  if (me.limited && !OPEN_WHEN_BLOCKED.includes(parts[1])) {
    return json({ error: 'Your CRM access is limited until you sign the Fruit City Confidentiality Agreement. Open the Agreement page to read and sign it.', blocked: true }, 403);
  }
  if (parts[1] === 'me') return json({ username: email, role: me.role, canReview: me.canReview, limited: me.limited, agreement: await myAgreement(env, me) });
  if (parts[1] === 'agreement') return myAgreementApi(request, env, me);
  if (parts[1] === 'messages') return messagesApi(request, env, me, me.email);
  if (parts[1] === 'agreements') {
    if (!isAdmin) return json({ error: 'Admins only' }, 403);
    return agreementsAdminApi(request, env, url, parts[2] ? decodeURIComponent(parts[2]) : null, me);
  }
  if (parts[1] === 'users') {
    if (!isAdmin) return json({ error: 'Admins only' }, 403);
    return users(request, env, parts[2] ? Number(parts[2]) : null, email);
  }
  if (parts[1] === 'schema') {
    if (me.limited) return json({});
    // "Who does it" on tasks lists everyone on the Users page
    const s = { ...visibleSchema(me) };
    const names = await userOptions(db);
    s.tasks = { ...s.tasks, fields: s.tasks.fields.map((f) => (f.name === 'assigned_to' ? { ...f, options: names } : f)) };
    return json(s);
  }
  if (parts[1] === 'tasks' && parts[2] && parts[3] === 'updates') {
    const res = await taskUpdatesApi(request, env, Number(parts[2]), me);
    if (method === 'POST' && res.ok) await logActivity(env, me, 'message', 'task_updates', Number(parts[2]), null, 'Task');
    return res;
  }
  // Weekly report: admins can preview it and email it to themselves now (it also goes out every Monday)
  if (parts[1] === 'report') {
    if (!isAdmin) return json({ error: 'Admins only' }, 403);
    if (method === 'POST') return json({ note: await sendWeeklyReport(env) });
    return json({ ...(await weeklyReport(env)), alertUsers: watchedUsers(env) });
  }
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
  if (parts[1] === 'impact') return parts[2] === 'export' ? impactExport(url.searchParams, db, me) : impact(url.searchParams, db, me);

  const table = parts[1];
  const def = visibleSchema(me)[table];
  if (!def) return json({ error: 'Not found' }, 404);
  const id = parts[2] ? Number(parts[2]) : null;
  const a = ALIAS[table];
  const cols = def.fields.filter((f) => !f.virtual).map((f) => f.name);
  const scope = scopeSql(table, me);

  // Members may only open/edit their own private rows (and read the admins' contact records)
  const ownScope = method === 'GET' ? scope : scopeSql(table, me, true);
  if (id && ownScope) {
    const own = await db.prepare(`SELECT 1 FROM ${table} ${a} WHERE ${a}.id=? AND ${ownScope.sql}`).bind(id, ...ownScope.binds).first();
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
    const virtual = {}; // form-only switches (like "Email this to them"), never saved as columns
    for (const f of def.fields) {
      if (!(f.name in body)) continue;
      if (f.virtual) { virtual[f.name] = f.type === 'checkbox' ? !!body[f.name] : body[f.name]; continue; }
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
    if (table === 'tasks') {
      if (method === 'POST' && !data.status) data.status = full.status = 'open';
      if ('assigned_to' in data && !(await db.prepare(`SELECT 1 FROM users WHERE username=?`).bind(data.assigned_to).first()))
        return json({ error: 'Pick who does it from the list' }, 400);
    }
    if (table === 'volunteer_applications') {
      if (method === 'POST' && !data.status) data.status = 'new';
      if ('status' in data && data.status !== (prev?.status ?? null)) {
        data.reviewed_by = email;
        data.reviewed_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
      }
    }

    const keys = Object.keys(data);
    if (method === 'POST') {
      keys.push('created_by');
      const vals = keys.map((k) => (k === 'created_by' ? email : data[k]));
      const r = await db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')}) RETURNING id`).bind(...vals).first();
      if (table === 'organizations') await retagContacts(db, r.id);
      await logActivity(env, me, 'add', table, r.id, labelOf(table, def, full), def.singular);
      if (table === 'tasks') return json({ id: r.id, note: await afterTaskSave(env, me, r.id, {}, { ...full, created_by: email }, virtual.email_now, true) }, 201);
      if (table === 'interactions') return json({ id: r.id, note: await afterInteractionSave(env, me, r.id, full, virtual.email_now) }, 201);
      return json({ id: r.id }, 201);
    }
    if (!id) return json({ error: 'Missing id' }, 400);
    if (keys.length) await db.prepare(`UPDATE ${table} SET ${keys.map((k) => `${k}=?`).join(',')}, updated_at=datetime('now') WHERE id=?`).bind(...keys.map((k) => data[k]), id).run();
    if (table === 'organizations') await retagContacts(db, id);
    await logActivity(env, me, 'edit', table, id, labelOf(table, def, full), def.singular);
    if (table === 'tasks') return json({ id, note: await afterTaskSave(env, me, id, prev, full, virtual.email_now, false) });
    if (table === 'interactions') return json({ id, note: await afterInteractionSave(env, me, id, full, virtual.email_now) });
    return json({ id });
  }
  if (method === 'DELETE' && id) {
    if (!isAdmin) return json({ error: 'Only admins can delete' }, 403);
    const gone = await db.prepare(`SELECT * FROM ${table} WHERE id=?`).bind(id).first();
    await removeAttachments(env, table, id);
    await db.prepare(`DELETE FROM ${table} WHERE id=?`).bind(id).run();
    if (table === 'tasks') await db.prepare(`DELETE FROM task_updates WHERE task_id=?`).bind(id).run();
    if (gone) await logActivity(env, me, 'delete', table, id, labelOf(table, def, gone), def.singular);
    return json({ ok: true });
  }
  return json({ error: 'Method not allowed' }, 405);
}

// A readable name for a record in alerts and the activity log
const labelOf = (table, def, row) => (table === 'contacts' ? [row.first_name, row.last_name].filter(Boolean).join(' ')
  : row[def.title] ?? row.name ?? row.date ?? null);

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
    if (SCHEMA[t].hidden || (REVIEWER_ONLY.includes(t) && !me.canReview)) continue;
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

async function canSee(db, table, id, me, write = false) {
  if (REVIEWER_ONLY.includes(table) && !me.canReview) return false;
  const s = scopeSql(table, me, write);
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
    if (!SCHEMA[table] || !id || !(await canSee(db, table, id, me, method !== 'GET'))) return json({ error: 'Not found' }, 404);
    if (method === 'GET') {
      const { results } = await db.prepare(`SELECT * FROM attachments WHERE table_name=? AND record_id=? ORDER BY id`).bind(table, id).all();
      return json(results.map(mediaOut));
    }
    if (method === 'POST') { // raw file in the body, its type in content-type
      if (REVIEWER_ONLY.includes(table)) return json({ error: "Files can't be attached to volunteer applications. Keep court paperwork out of the CRM." }, 400);
      const type = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
      if (!/^(image|video)\/[\w.+-]+$/.test(type)) return json({ error: 'Only photos and videos can be attached' }, 400);
      const size = Number(request.headers.get('content-length'));
      if (!size) return json({ error: 'That file is empty' }, 400);
      if (size > MAX_UPLOAD) return json({ error: 'Files must be under 100 MB' }, 413);
      // Hard stop before R2's free 10 GB so storage never costs money (raise MEDIA_LIMIT_GB in wrangler.toml when ready to pay)
      const limitGb = Number(env.MEDIA_LIMIT_GB) || 9;
      const used = (await db.prepare(`SELECT COALESCE(SUM(size),0) AS n FROM attachments`).first()).n;
      if (used + size > limitGb * 1e9) {
        return json({ error: `Photo & video storage is full (${(used / 1e9).toFixed(2)} of ${limitGb} GB used). Remove some files, or ask an admin to raise the limit.` }, 507);
      }
      const filename = (url.searchParams.get('name') || 'file').replace(/[\\/\r\n"]/g, '_').slice(0, 200);
      const key = `${table}/${id}/${crypto.randomUUID()}`;
      await env.MEDIA.put(key, request.body, { httpMetadata: { contentType: type } });
      const r = await db.prepare(`INSERT INTO attachments (table_name,record_id,r2_key,filename,content_type,size,created_by) VALUES (?,?,?,?,?,?,?) RETURNING *`)
        .bind(table, id, key, filename, type, size, me.username).first();
      await logActivity(env, me, 'upload', table, id, filename, SCHEMA[table].singular);
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

// ---- Food rescue impact: totals, weekly trend, goals, cost and breakdowns, for the Impact page and grant reports ----
// Meals are counted where someone typed them, otherwise estimated from pounds with the program's pounds-per-meal rate.
const MEALS_SQL = `COALESCE(dv.meals, CASE WHEN dv.pounds IS NOT NULL AND p.lbs_per_meal > 0 THEN dv.pounds / p.lbs_per_meal END)`;
const WEEK_SQL = `date(dv.date, 'weekday 0', '-6 days')`; // the Monday of the delivery's week
const FROM_DV = `FROM deliveries dv LEFT JOIN programs p ON p.id=dv.program_id LEFT JOIN organizations o ON o.id=dv.site_org_id`;
const isDay = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v || '');

function impactFilter(params, me) {
  const where = ['dv.date IS NOT NULL'];
  const binds = [];
  const s = scopeSql('deliveries', me);
  if (s) { where.push(s.sql); binds.push(...s.binds); }
  const pid = Number(params.get('program_id')) || null;
  if (pid) { where.push('dv.program_id=?'); binds.push(pid); }
  const from = isDay(params.get('from')) ? params.get('from') : null;
  const to = isDay(params.get('to')) ? params.get('to') : null;
  if (from) { where.push('dv.date>=?'); binds.push(from); }
  if (to) { where.push('dv.date<=?'); binds.push(to); }
  return { sql: 'WHERE ' + where.join(' AND '), binds, pid, from, to };
}

async function impact(params, db, me) {
  const f = impactFilter(params, me);
  const all = (sql) => db.prepare(sql).bind(...f.binds).all().then((r) => r.results);
  const ps = scopeSql('programs', me);
  const programs = (await db.prepare(`${SELECT.programs} ${ps ? 'WHERE ' + ps.sql : ''} ORDER BY ${ORDER.programs}`).bind(...(ps ? ps.binds : [])).all()).results;

  const totals = await db.prepare(`SELECT COUNT(*) AS runs, COUNT(DISTINCT ${WEEK_SQL}) AS weeks, MIN(dv.date) AS first_date, MAX(dv.date) AS last_date,
      SUM(dv.pounds) AS pounds, SUM(dv.items) AS items, SUM(${MEALS_SQL}) AS meals,
      SUM(CASE WHEN dv.meals IS NULL THEN ${MEALS_SQL} END) AS meals_estimated,
      SUM(dv.people_reached) AS people, SUM(dv.home_deliveries) AS home_deliveries,
      SUM(dv.volunteers) AS volunteers, SUM(dv.volunteer_hours) AS volunteer_hours, SUM(dv.miles) AS miles, SUM(dv.cost) AS cost,
      SUM(CASE WHEN dv.cost IS NOT NULL THEN dv.pounds END) AS pounds_with_cost,
      SUM(CASE WHEN dv.cost IS NOT NULL THEN ${MEALS_SQL} END) AS meals_with_cost
      ${FROM_DV} ${f.sql}`).bind(...f.binds).first();
  const weekly = await all(`SELECT ${WEEK_SQL} AS week, COUNT(*) AS runs, SUM(dv.pounds) AS pounds, SUM(${MEALS_SQL}) AS meals,
      SUM(dv.people_reached) AS people, SUM(dv.volunteers) AS volunteers, SUM(dv.cost) AS cost
      ${FROM_DV} ${f.sql} GROUP BY week ORDER BY week`);
  const bySource = await all(`SELECT COALESCE(NULLIF(TRIM(dv.pickup_source),''), '(not recorded)') AS name, COUNT(*) AS runs,
      SUM(dv.pounds) AS pounds, SUM(dv.people_reached) AS people ${FROM_DV} ${f.sql} GROUP BY 1 ORDER BY 3 DESC, 2 DESC LIMIT 25`);
  const bySite = await all(`SELECT COALESCE(o.name, CASE WHEN dv.home_deliveries > 0 THEN '(home deliveries only)' ELSE '(not recorded)' END) AS name,
      dv.site_org_id AS org_id, COUNT(*) AS runs, SUM(dv.pounds) AS pounds, SUM(dv.people_reached) AS people
      ${FROM_DV} ${f.sql} GROUP BY 1, 2 ORDER BY 5 DESC, 4 DESC LIMIT 25`);

  // Goals and budget come from the chosen program, or else from the active programs
  // (or, when none is active yet, every program that hasn't ended).
  const running = programs.filter((x) => x.status === 'active');
  const chosen = f.pid ? programs.filter((x) => x.id === f.pid) : running.length ? running : programs.filter((x) => x.status !== 'ended');
  const sum = (k) => { const v = chosen.reduce((n, x) => n + (Number(x[k]) || 0), 0); return v || null; };
  const goals = { pounds: sum('goal_pounds_week'), people: sum('goal_people_week'), runs: sum('goal_deliveries_week'), volunteers: sum('goal_volunteers_week') };

  const bs = scopeSql('budget_lines', me);
  const bw = [];
  const bb = [];
  if (bs) { bw.push(bs.sql); bb.push(...bs.binds); }
  if (chosen.length) { bw.push(`bl.program_id IN (${chosen.map(() => '?').join(',')})`); bb.push(...chosen.map((x) => x.id)); }
  else bw.push('0');
  const budget = (await db.prepare(`SELECT COALESCE(bl.category, 'other') AS category, SUM(bl.estimated) AS estimated, SUM(bl.actual) AS actual, COUNT(*) AS n
      FROM budget_lines bl WHERE ${bw.join(' AND ')} GROUP BY category ORDER BY estimated DESC`).bind(...bb).all()).results;

  return json({
    filter: { program_id: f.pid, from: f.from, to: f.to },
    programs, totals, weekly, bySource, bySite, goals, budget, budget_total: sum('budget_total'),
  });
}

// CSV of the delivery log for the same filters, for grant reports and spreadsheets.
async function impactExport(params, db, me) {
  const f = impactFilter(params, me);
  const { results } = await db.prepare(`SELECT dv.*, p.name AS program_name, o.name AS site_name, ${MEALS_SQL} AS meals_total
      ${FROM_DV} ${f.sql} ORDER BY dv.date, dv.id`).bind(...f.binds).all();
  const cols = [
    ['Date', (r) => r.date], ['Program', (r) => r.program_name], ['Picked up from', (r) => r.pickup_source],
    ['Pounds', (r) => r.pounds], ['Boxes or items', (r) => r.items],
    ['Meals', (r) => (r.meals_total == null ? null : Math.round(r.meals_total))], ['Meals estimated from pounds', (r) => (r.meals == null && r.meals_total != null ? 'yes' : '')],
    ['People reached', (r) => r.people_reached], ['Drop-off site', (r) => r.site_name], ['Home deliveries', (r) => r.home_deliveries],
    ['Volunteers', (r) => r.volunteers], ['Volunteer hours', (r) => r.volunteer_hours], ['Miles', (r) => r.miles], ['Cost ($)', (r) => r.cost],
    ['Notes', (r) => r.notes],
  ];
  const cell = (v) => {
    if (v == null) return '';
    let s = String(v);
    if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = "'" + s; // keep spreadsheets from running a cell as a formula
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [cols.map(([h]) => h).join(','), ...results.map((r) => cols.map(([, get]) => cell(get(r))).join(','))].join('\r\n') + '\r\n';
  const name = `food-rescue-deliveries-${f.from || 'start'}-to-${f.to || new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(csv, { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="${name}"` } });
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
