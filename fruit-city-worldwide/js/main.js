/* ============================================================
   Fruit City Worldwide — Main JavaScript
   ============================================================
   1. Mobile navigation toggle
   2. Active nav link highlighting
   3. Scroll-triggered fade-in animations
   4. Auto-updating footer year
   ============================================================ */

/* ── 1. MOBILE NAV ─────────────────────────────────────────── */
function initMobileNav() {
  const toggleBtn = document.querySelector('.nav-toggle');
  const nav       = document.querySelector('.site-nav');
  if (!toggleBtn || !nav) return;

  toggleBtn.addEventListener('click', function () {
    const isOpen = nav.classList.toggle('is-open');
    toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  document.addEventListener('click', function (e) {
    if (!nav.contains(e.target) && !toggleBtn.contains(e.target)) {
      nav.classList.remove('is-open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
  });

  nav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      nav.classList.remove('is-open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ── 2. ACTIVE NAV LINK ────────────────────────────────────── */
function initActiveNav() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.site-nav__list a').forEach(function (link) {
    const linkPage = link.getAttribute('href').split('/').pop();
    if (linkPage === currentPage) {
      link.setAttribute('aria-current', 'page');
    }
  });
}

/* ── 3. SCROLL FADE-IN ─────────────────────────────────────── */
function initScrollAnimations() {
  const elements = document.querySelectorAll('.fade-in');
  if (!elements.length) return;

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  elements.forEach(function (el) { observer.observe(el); });
}

/* ── 4. FOOTER YEAR ────────────────────────────────────────── */
function initFooterYear() {
  const el = document.querySelector('.footer-year');
  if (el) el.textContent = new Date().getFullYear();
}

/* ── INIT ──────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  initMobileNav();
  initActiveNav();
  initScrollAnimations();
  initFooterYear();
});
