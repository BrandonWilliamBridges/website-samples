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
`;
