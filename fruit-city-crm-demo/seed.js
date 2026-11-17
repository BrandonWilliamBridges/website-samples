// Sample data for the CRM demo. EVERY record here is made up.
// Never paste real contacts, organizations, donations, users or notes into this file:
// it is published on the public website-samples site.
// Names end in "(sample)", emails use example.org, and phone numbers use the fictional 555-01xx range.
// Dates are relative to today so the dashboard always has upcoming and overdue follow-ups.
export default `
INSERT INTO users (id, username, salt, pw_hash, role, email) VALUES
  (1, 'demo', '', '', 'admin', 'demo@example.org'),
  (2, 'sam.sample', '', '', 'member', 'sam@example.org');

INSERT INTO organizations (id, name, type, denomination, status, city, state, zip, lat, lng, website, phone, email, tags, notes, created_by) VALUES
  (1, 'Riverbend Community Church (sample)', 'church', 'non-denominational', 'partner', 'Houston', 'TX', '77002', 29.7604, -95.3698, 'https://example.org', '(555) 010-0101', 'hello@example.org', 'garden site', 'Fictional demo record. Hosts the monthly produce share.', 'demo'),
  (2, 'Northside Masjid (sample)', 'mosque', 'Sunni', 'engaged', 'Houston', 'TX', '77009', 29.7952, -95.3654, NULL, '(555) 010-0102', 'office@example.org', NULL, 'Fictional demo record. Interested in a rooftop garden.', 'demo'),
  (3, 'Bayou Gurdwara (sample)', 'gurdwara', 'non-denominational', 'contacted', 'Sugar Land', 'TX', '77478', 29.6197, -95.6349, NULL, '(555) 010-0103', NULL, 'langar', 'Fictional demo record. Asked about donating surplus produce.', 'demo'),
  (4, 'Third Ward Food Collective (sample)', 'nonprofit', NULL, 'partner', 'Houston', 'TX', '77004', 29.7340, -95.3620, 'https://example.org', '(555) 010-0104', 'team@example.org', 'food access', 'Fictional demo record.', 'demo'),
  (5, 'Green Roof Foundation (sample)', 'foundation', NULL, 'prospect', 'Houston', 'TX', '77027', 29.7420, -95.4460, 'https://example.org', NULL, 'grants@example.org', 'funder', 'Fictional demo record. Funds urban agriculture.', 'demo'),
  (6, 'Eastwood Elementary Garden Club (sample)', 'school', NULL, 'prospect', 'Houston', 'TX', '77023', 29.7230, -95.3260, NULL, '(555) 010-0106', NULL, 'youth', 'Fictional demo record.', 'sam.sample'),
  (7, 'Westpark Synagogue (sample)', 'synagogue', 'Reform', 'contacted', 'Houston', 'TX', '77081', 29.7110, -95.4950, NULL, '(555) 010-0107', NULL, NULL, 'Fictional demo record.', 'demo'),
  (8, 'City Parks Office (sample)', 'government', NULL, 'inactive', 'Houston', 'TX', '77002', 29.7570, -95.3630, NULL, '(555) 010-0108', NULL, 'permits', 'Fictional demo record.', 'demo');

INSERT INTO contacts (id, first_name, last_name, org_id, role, type, email, phone, tags, notes, created_by) VALUES
  (1, 'Jordan', 'Rivera (sample)', 1, 'Lead pastor', 'pastor', 'jordan@example.org', '(555) 010-0111', NULL, 'Fictional demo contact.', 'demo'),
  (2, 'Amina', 'Yusuf (sample)', 2, 'Outreach coordinator', 'community leader', 'amina@example.org', '(555) 010-0112', NULL, 'Fictional demo contact.', 'demo'),
  (3, 'Harpreet', 'Gill (sample)', 3, 'Committee member', 'faith leader', 'harpreet@example.org', '(555) 010-0113', NULL, 'Fictional demo contact.', 'demo'),
  (4, 'Grace', 'Okafor (sample)', 4, 'Executive director', 'partner', 'grace@example.org', '(555) 010-0114', 'board intro', 'Fictional demo contact.', 'demo'),
  (5, 'Dev', 'Mehta (sample)', 5, 'Program officer', 'advisor', 'dev@example.org', '(555) 010-0115', NULL, 'Fictional demo contact.', 'demo'),
  (6, 'Leah', 'Stern (sample)', 7, 'Social action chair', 'volunteer', 'leah@example.org', '(555) 010-0116', NULL, 'Fictional demo contact.', 'demo'),
  (7, 'Marcus', 'Bell (sample)', 6, 'Teacher', 'volunteer', 'marcus@example.org', '(555) 010-0117', NULL, 'Fictional demo contact.', 'sam.sample'),
  (8, 'Rosa', 'Delgado (sample)', NULL, NULL, 'donor', 'rosa@example.org', '(555) 010-0118', 'monthly', 'Fictional demo contact.', 'demo'),
  (9, 'Sam', 'Taylor (sample)', 4, 'Volunteer lead', 'volunteer', 'sam@example.org', '(555) 010-0119', NULL, 'Fictional demo contact.', 'demo'),
  (10, 'Priya', 'Nair (sample)', NULL, 'Landscape architect', 'advisor', 'priya@example.org', '(555) 010-0120', 'tower design', 'Fictional demo contact.', 'demo');

INSERT INTO interactions (contact_id, org_id, kind, date, summary, follow_up_date, follow_up_done, created_by) VALUES
  (1, 1, 'meeting', date('now', '-12 days'), 'Walked the lot behind the church for a pilot garden bed.', date('now', '+3 days'), 0, 'demo'),
  (2, 2, 'call', date('now', '-6 days'), 'Intro call about a rooftop garden. Wants a cost estimate.', date('now', '-1 days'), 0, 'demo'),
  (3, 3, 'email', date('now', '-4 days'), 'Shared the produce donation schedule.', date('now', '+7 days'), 0, 'demo'),
  (4, 4, 'visit', date('now', '-20 days'), 'Toured their pantry and cold storage.', date('now', '-10 days'), 1, 'demo'),
  (5, 5, 'meeting', date('now', '-2 days'), 'Grant pre-application chat. Deadline is next month.', date('now', '+14 days'), 0, 'demo'),
  (6, 7, 'text', date('now', '-1 days'), 'Confirmed volunteers for the Saturday build day.', NULL, 0, 'demo'),
  (7, 6, 'event', date('now', '-9 days'), 'Garden club seed-starting workshop.', date('now', '+21 days'), 0, 'sam.sample'),
  (10, NULL, 'call', date('now', '-15 days'), 'Talked through the town tower planting plan.', date('now', '-3 days'), 0, 'demo');

INSERT INTO donations (contact_id, org_id, amount, date, method, notes, created_by) VALUES
  (8, NULL, 50, date('now', '-30 days'), 'Zelle', 'Fictional monthly gift.', 'demo'),
  (8, NULL, 50, date('now', '-1 days'), 'Zelle', 'Fictional monthly gift.', 'demo'),
  (NULL, 1, 250, date('now', '-18 days'), 'check', 'Fictional church gift.', 'demo'),
  (9, 4, 0, date('now', '-7 days'), 'in-kind', 'Fictional: 40 seedling trays.', 'demo');

INSERT INTO grants (name, funder_org_id, amount, stage, deadline, notes, created_by) VALUES
  ('Urban Agriculture Starter Grant (sample)', 5, 15000, 'drafting', date('now', '+30 days'), 'Fictional demo grant.', 'demo'),
  ('Community Garden Mini-Grant (sample)', 5, 2500, 'submitted', date('now', '+10 days'), 'Fictional demo grant.', 'demo'),
  ('Neighborhood Green Space Fund (sample)', NULL, 40000, 'researching', NULL, 'Fictional demo grant.', 'demo');

INSERT INTO programs (id, name, partner_org_id, partner_contact_id, food_source, source_deal_signed, status, start_date, goal_pounds_week, goal_people_week, goal_deliveries_week, goal_volunteers_week, lbs_per_meal, budget_total, notes, created_by) VALUES
  (1, 'Community Food Rescue (sample)', 4, 9, 'Corner Market (sample)', 1, 'active', date('now', '-72 days'), 350, 80, 1, 5, 1.2, 3500, 'Fictional demo program. Weekly grocery pickups taken to partner pantries.', 'demo'),
  (2, 'Holiday Produce Drive (sample)', 1, 1, 'Riverbend garden beds (sample)', 0, 'planned', date('now', '+20 days'), 120, 40, NULL, NULL, 1.2, NULL, 'Fictional demo program, not started yet.', 'demo');

INSERT INTO budget_lines (program_id, category, description, estimated, actual, grant_id, notes, created_by) VALUES
  (1, 'cold storage (coolers, ice)', 'Two 120-quart coolers and weekly ice (sample)', 900, 640, 1, NULL, 'demo'),
  (1, 'loading (hand truck, bins)', 'Hand truck and 20 stacking bins (sample)', 650, 610, 1, NULL, 'demo'),
  (1, 'hand-off (tables, canopy)', 'Folding tables and a canopy (sample)', 450, NULL, NULL, NULL, 'demo'),
  (1, 'fuel or van rental', 'Fuel for weekly runs (sample)', 1200, 180, NULL, NULL, 'demo'),
  (1, 'food-safe supplies', 'Gloves, thermometers, labels (sample)', 300, 95, NULL, NULL, 'demo');

INSERT INTO deliveries (program_id, date, pickup_source, pounds, items, meals, people_reached, site_org_id, home_deliveries, volunteers, volunteer_hours, miles, cost, notes, created_by) VALUES
  (1, date('now', '-68 days'), 'Corner Market (sample)', 175, 7, 146, 39, 4, 0, 4, 10.0, 22, NULL, 'Fictional demo delivery.', 'demo'),
  (1, date('now', '-61 days'), 'Corner Market (sample)', 181, 7, NULL, 40, 1, 3, 6, 15.0, 18, NULL, 'Fictional demo delivery.', 'demo'),
  (1, date('now', '-54 days'), 'Corner Market (sample)', 236, 9, NULL, 52, 4, 0, 3, 7.5, 26, 18.00, 'Fictional demo delivery.', 'demo'),
  (1, date('now', '-47 days'), 'Sunrise Bakery (sample)', 226, 9, 188, 50, 3, 2, 5, 12.5, 22, 14.00, 'Fictional demo delivery.', 'demo'),
  (1, date('now', '-33 days'), 'Corner Market (sample)', 270, 11, NULL, 60, 1, 0, 6, 15.0, 22, 14.00, 'Fictional demo delivery.', 'demo'),
  (1, date('now', '-26 days'), 'Corner Market (sample)', 301, 12, 251, 67, 4, 0, 6, 15.0, 18, 26.00, 'Fictional demo delivery.', 'demo'),
  (1, date('now', '-19 days'), 'Sunrise Bakery (sample)', 323, 13, NULL, 72, 3, 3, 3, 7.5, 26, 18.00, 'Fictional demo delivery.', 'demo'),
  (1, date('now', '-12 days'), 'Corner Market (sample)', 357, 14, NULL, 79, 4, 3, 4, 10.0, 26, 14.00, 'Fictional demo delivery.', 'demo'),
  (1, date('now', '-5 days'), 'Corner Market (sample)', 388, 16, 323, 86, 1, 3, 4, 10.0, 18, 18.00, 'Fictional demo delivery.', 'demo');

INSERT INTO volunteer_applications (status, first_name, last_name, email, phone, area, availability, availability_notes, interests, experience, court_ordered, hours_needed, hours_deadline, cs_acknowledged, contact_ok, source, next_steps, review_notes, reviewed_by, reviewed_at, submitted_at, created_by) VALUES
  ('new', 'Taylor', 'Brooks (sample)', 'taylor@example.org', '(555) 010-0131', 'Southwest / Alief / Sugar Land', 'Saturdays, Sundays', NULL, 'growing, food', 'Fictional demo applicant. Helped at a school garden.', 0, NULL, NULL, 0, 1, '/volunteer.html', NULL, NULL, NULL, NULL, datetime('now', '-1 days'), 'website'),
  ('new', 'Chris', 'Moreno (sample)', 'chris@example.org', '(555) 010-0132', 'East End / Pasadena / Baytown', 'Weekday mornings, Saturdays', 'Free after 9 am', 'building', 'Fictional demo applicant. Some carpentry.', 1, 40, date('now', '+60 days'), 1, 1, '/volunteer.html', NULL, NULL, NULL, NULL, datetime('now', '-2 days'), 'website'),
  ('reviewing', 'Morgan', 'Lee (sample)', 'morgan@example.org', '(555) 010-0133', 'Inner Loop (Heights, Montrose, Third Ward)', 'Weekday evenings, Remote / from home', NULL, 'media, education', 'Fictional demo applicant. Edits video.', 0, NULL, NULL, 0, 1, '/volunteer.html', 'Hi Morgan, thank you for applying to volunteer with Fruit City Worldwide. We have your application and will be in touch soon.', 'Fictional note: could help with the documentary.', 'demo', datetime('now', '-3 days'), datetime('now', '-5 days'), 'website'),
  ('accepted', 'Jamie', 'Ortiz (sample)', 'jamie@example.org', '(555) 010-0134', 'North Houston / Aldine', 'Saturdays', NULL, 'food', 'Fictional demo applicant.', 1, 25, date('now', '+30 days'), 1, 1, '/volunteer.html', 'Hi Jamie, we would love to have you volunteer with Fruit City Worldwide. Your first activity: [date, time and place]. Please bring: [what to bring].', NULL, 'demo', datetime('now', '-6 days'), datetime('now', '-9 days'), 'website');
`;
