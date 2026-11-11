/* ============================================================
   Fruit City Worldwide — Volunteer page
   ============================================================
   1. Fills volunteer.html from window.FCW_VOLUNTEER (js/volunteer-config.js)
   2. Shows the community-service questions only when "Yes" is chosen
   3. Checks the form and sends it as JSON to applyEndpoint
   Nothing is stored in the browser, and no files are uploaded.
   ============================================================ */
(function () {
  'use strict';

  var C = window.FCW_VOLUNTEER;
  if (!C) return;
  var $ = function (id) { return document.getElementById(id); };
  var cs = C.courtService || {};

  /* ── 1. FILL THE PAGE ──────────────────────────────────────── */
  function el(tag, text, cls) {
    var e = document.createElement(tag);
    if (text != null) e.textContent = text;
    if (cls) e.className = cls;
    return e;
  }

  /* A list from the settings, or a plain "coming soon" line when it hasn't been decided yet. */
  function list(target, items, pending) {
    var box = $(target);
    if (!box) return;
    box.textContent = '';
    if (items && items.length) {
      var ul = el('ul', null, 'vol-list');
      items.forEach(function (t) { ul.appendChild(el('li', t)); });
      box.appendChild(ul);
    } else {
      box.appendChild(el('p', pending, 'vol-muted'));
    }
  }

  var ASK = 'Details coming soon. Contact us with any questions.';

  function fillPage() {
    var opps = $('vol-opportunities');
    (C.opportunities || []).forEach(function (o) {
      var card = el('div', null, 'vol-card');
      card.appendChild(el('h3', o.title));
      card.appendChild(el('p', o.text));
      card.appendChild(el('p', 'Where: ' + (o.where || 'Houston area, shared when you are matched'), 'vol-muted'));
      opps.appendChild(card);
    });

    $('vol-location').textContent = C.locationSummary || '';
    var eligibility = (C.eligibility || []).slice();
    if (C.minimumAge) eligibility.push('Volunteers must be at least ' + C.minimumAge + ' years old.');
    list('vol-eligibility', eligibility, ASK);
    list('vol-scheduling', C.scheduling, ASK);
    list('vol-restrictions', C.restrictions, ASK);

    if (cs.accepting === false) {
      $('vol-cs-intro').textContent = 'Fruit City is not taking court-ordered community service placements right now. You are still welcome to volunteer.';
      $('vol-cs-details').hidden = true;
      $('vol-cs-disclaimer').hidden = true;
      $('vol-cs-privacy').hidden = true;
      $('vol-cs-question').hidden = true;
      $('vol-cs-question').disabled = true;
    } else {
      $('vol-cs-intro').textContent = cs.intro || '';
      list('vol-cs-criteria', cs.acceptanceCriteria, 'Our requirements will be posted here. Apply or contact us to ask.');
      list('vol-cs-verification', cs.verification, 'We will explain how hours are logged and signed when we accept you.');
      $('vol-cs-disclaimer').textContent = cs.disclaimer || '';
      $('vol-cs-form-disclaimer').textContent = cs.disclaimer || '';
      $('vol-cs-privacy').textContent = cs.privacyNote || '';
      $('vol-cs-form-privacy').textContent = cs.privacyNote || '';
    }

    document.querySelectorAll('.js-vol-email').forEach(function (a) {
      a.href = 'mailto:' + C.contactEmail; a.textContent = C.contactEmail;
    });
    document.querySelectorAll('.js-vol-phone').forEach(function (a) {
      a.href = 'tel:' + String(C.contactPhone).replace(/[^\d+]/g, ''); a.textContent = C.contactPhone;
    });
  }

  /* ── 2. FORM CHOICES ───────────────────────────────────────── */
  function checks(boxId, name, options) {
    var box = $(boxId);
    options.forEach(function (o) {
      var label = el('label', null, 'vol-check');
      var input = document.createElement('input');
      input.type = 'checkbox'; input.name = name; input.value = o.value;
      label.appendChild(input);
      label.appendChild(document.createTextNode(' ' + o.label));
      box.appendChild(label);
    });
  }

  function fillForm() {
    var area = $('vol-area');
    (C.areas || []).forEach(function (a) { var o = el('option', a); o.value = a; area.appendChild(o); });
    checks('vol-availability', 'availability', (C.availability || []).map(function (a) { return { value: a, label: a }; }));
    checks('vol-interests', 'interests', (C.opportunities || []).map(function (o) { return { value: o.id, label: o.title }; }));

    if (C.minimumAge) {
      $('vol-age-row').hidden = false;
      $('vol-age-row').querySelector('input').disabled = false;
      $('vol-age-text').textContent = 'I am at least ' + C.minimumAge + ' years old. *';
    }

    // A deadline can't be in the past.
    var d = new Date();
    $('vol-deadline').min = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

    if (!C.applyEndpoint) {
      var closed = $('vol-closed');
      closed.hidden = false;
      closed.textContent = 'Online applications open soon. Until then, email ' + C.contactEmail + ' or call ' + C.contactPhone + ' to volunteer.';
      $('vol-submit').disabled = true;
    }
  }

  /* Community-service questions appear only for "Yes". A disabled fieldset
     is skipped by validation and never sent, so "No" sends none of it. */
  function syncCourtService() {
    var form = $('vol-form');
    var yes = cs.accepting !== false && form.querySelector('input[name="court_ordered"]:checked')?.value === 'yes';
    var box = $('vol-cs-fields');
    box.hidden = !yes;
    box.disabled = !yes;
  }

  /* ── 3. CHECK AND SEND ─────────────────────────────────────── */
  var LABELS = {
    first_name: 'your first name', last_name: 'your last name', email: 'a valid email address',
    phone: 'a phone number', area: 'your area', court_ordered: 'whether you need community service hours',
    hours_needed: 'how many hours you need', hours_deadline: 'your deadline (today or later)',
    cs_acknowledged: 'that you understand acceptance is not guaranteed',
    age_confirmed: 'your age', contact_ok: 'that we may contact you'
  };

  function problems(form) {
    var out = [];
    var first = null;
    Array.prototype.forEach.call(form.elements, function (f) {
      if (!f.name || f.disabled || !f.willValidate || f.checkValidity()) return;
      f.setAttribute('aria-invalid', 'true');
      var msg = 'Please add ' + (LABELS[f.name] || f.name.replace(/_/g, ' ')) + '.';
      if (out.indexOf(msg) === -1) out.push(msg);
      first = first || f;
    });
    if (!form.querySelector('input[name="availability"]:checked')) {
      out.push('Please choose at least one time you can help.');
      first = first || form.querySelector('input[name="availability"]');
    }
    return { messages: out, first: first };
  }

  function collect(form) {
    var data = { source: window.location.pathname };
    var fd = new FormData(form); // disabled fields are left out
    fd.forEach(function (v, k) {
      if (k === 'availability' || k === 'interests') (data[k] = data[k] || []).push(v);
      else data[k] = typeof v === 'string' ? v.trim() : v;
    });
    data.court_ordered = data.court_ordered === 'yes';
    data.contact_ok = data.contact_ok === 'yes';
    if (data.cs_acknowledged) data.cs_acknowledged = true;
    if (data.age_confirmed) data.age_confirmed = true;
    if (data.hours_needed) data.hours_needed = Number(data.hours_needed);
    return data;
  }

  function showError(text) {
    var e = $('vol-error');
    e.textContent = text;
    e.hidden = !text;
  }

  function onSubmit(ev) {
    ev.preventDefault();
    var form = ev.target;
    form.querySelectorAll('[aria-invalid]').forEach(function (f) { f.removeAttribute('aria-invalid'); });
    if (!C.applyEndpoint) return;

    var p = problems(form);
    if (p.messages.length) {
      showError(p.messages.join(' '));
      if (p.first) p.first.focus();
      return;
    }
    showError('');

    var btn = $('vol-submit');
    btn.disabled = true;
    btn.textContent = 'Sending…';
    fetch(C.applyEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(collect(form))
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) {
        if (!res.ok || !body.ok) throw new Error(body.message || 'Something went wrong.');
      });
    }).then(function () {
      form.hidden = true;
      var done = $('vol-done');
      done.hidden = false;
      done.focus();
    }).catch(function (err) {
      showError(err.message + ' Please try again, or email ' + C.contactEmail + ' or call ' + C.contactPhone + '.');
      btn.disabled = false;
      btn.textContent = 'Send application';
    });
  }

  function init() {
    fillPage();
    fillForm();
    var form = $('vol-form');
    form.addEventListener('change', function (e) { if (e.target.name === 'court_ordered') syncCourtService(); });
    form.addEventListener('submit', onSubmit);
    syncCourtService();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
