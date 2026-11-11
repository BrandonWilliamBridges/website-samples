/* ============================================================
   Fruit City Worldwide — Volunteer page settings
   ============================================================
   Everything on volunteer.html that is Fruit City's decision lives
   here, so it can change without touching the page or the form code.

   - Leave a list empty ([]) or a value '' when it hasn't been decided.
     The page then says those details are coming, instead of showing
     invented rules.
   - Text is shown exactly as written (no HTML).
   - Anything marked REVIEW was drafted from the site's existing
     "Who We Need" list and needs a team member to confirm it.
   ============================================================ */
window.FCW_VOLUNTEER = {

  /* Where the signup form sends applications: the volunteer intake
     service (crm/volunteer-intake in the CRM code). Leave '' until it
     is live; the form then asks people to call or email instead. */
  applyEndpoint: 'https://apply.fruitcityworldwide.org/apply',

  /* How people reach a person. Already public on contact.html. */
  contactEmail: 'aceofspadeblack@gmail.com',
  contactPhone: '346-541-5518',

  /* REVIEW: ways to help. `where` is shown under each one; leave ''
     until the location is decided. */
  opportunities: [
    { id: 'growing', title: 'Growing & planting', where: '',
      text: 'Help plant and care for fruit trees, gardens and green spaces.' },
    { id: 'food', title: 'Food sharing', where: '',
      text: 'Help collect, sort and share food with neighbors who need it.' },
    { id: 'building', title: 'Building & hands-on projects', where: '',
      text: 'Lend a hand with construction, set-up and practical projects.' },
    { id: 'media', title: 'Film, design & communications', where: '',
      text: 'Film, photograph, design, write and spread the word about Fruit City.' },
    { id: 'education', title: 'Teaching & outreach', where: '',
      text: 'Share knowledge at events, schools and community gatherings.' },
    { id: 'skills', title: 'Professional skills', where: '',
      text: 'Architecture, science, technology, healthcare or other expertise.' }
  ],

  /* General area of activities, shown in "Where we volunteer". */
  locationSummary: 'Activities take place around the greater Houston area. Exact places are shared when you are matched with an opportunity.',

  /* Areas applicants choose from ("Where in the Houston area are you?"). Geography only. */
  areas: [
    'Downtown / Midtown', 'Inner Loop (Heights, Montrose, Third Ward)', 'North Houston / Aldine',
    'Northeast / Humble / Kingwood', 'East End / Pasadena / Baytown', 'Southeast / Clear Lake / Pearland',
    'South / Missouri City', 'Southwest / Alief / Sugar Land', 'West / Katy / Energy Corridor',
    'Northwest / Cypress / Tomball', 'Spring / The Woodlands / Conroe', 'Outside the Houston area'
  ],

  /* When people can help: the form's availability choices. */
  availability: [
    'Weekday mornings', 'Weekday afternoons', 'Weekday evenings',
    'Saturdays', 'Sundays', 'Remote / from home'
  ],

  /* DECIDE: who can volunteer, e.g. minimum age, waivers, background
     checks. One sentence per item. */
  eligibility: [],

  /* DECIDE: minimum age. When set (for example 18), the form asks
     applicants to confirm it. Leave null to not ask. */
  minimumAge: null,

  /* DECIDE: scheduling expectations, e.g. shift length, notice to cancel. */
  scheduling: [],

  /* DECIDE: restrictions, e.g. activities with age limits or things
     volunteers cannot do. */
  restrictions: [],

  /* Court-ordered community service. */
  courtService: {
    /* Set false to stop offering community-service placements; the
       page and form then say so and the extra questions are hidden. */
    accepting: true,

    intro: 'Fruit City welcomes people completing court-ordered community service. Tell us how many hours you need and your deadline when you apply, and we will let you know whether we have a fit.',

    /* DECIDE: what Fruit City requires before accepting someone,
       e.g. "We accept placements for adults only." */
    acceptanceCriteria: [],

    /* DECIDE: how hours are verified and signed, e.g. who signs
       the log form and how often. */
    verification: [],

    /* Shown on the page and next to the form's community-service
       questions. Keep its meaning; adjust the wording if needed. */
    disclaimer: 'Submitting an application does not guarantee that Fruit City will accept you, or that a court, probation office or supervising agency will approve the hours you complete with us. Check with your supervising officer or the court that an assignment with Fruit City will count before you start.',

    /* Asked once, so no one sends case details through the form. */
    privacyNote: 'Please do not include case numbers, charges or court documents in this form. If we can offer you a placement, we will tell you what paperwork your supervising agency needs.'
  }
};
