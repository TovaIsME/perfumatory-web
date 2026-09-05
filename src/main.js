import { HOUSES } from './data/houses.js';

function renderBrands() {
  const grid = document.getElementById('brand-grid');
  if (!grid) return;

  grid.innerHTML = HOUSES.map(
    (house) => `
    <a
      class="brand-card"
      href="${house.website}"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Visit ${house.name} official website"
    >
      <div class="brand-logo-wrap">
        <img src="/assets/${house.logo}" alt="${house.name}" loading="lazy" />
      </div>
      <div class="brand-meta">
        <h3>${house.name}</h3>
        <span>${house.origin}</span>
      </div>
      <span class="brand-link">Visit site →</span>
    </a>
  `
  ).join('');
}

function initNav() {
  const btn = document.getElementById('menu-btn');
  const panel = document.getElementById('mobile-nav');
  const header = document.getElementById('header');
  const links = panel ? [...panel.querySelectorAll('a')] : [];
  let staggerTimers = [];

  const clearStagger = () => {
    staggerTimers.forEach((id) => clearTimeout(id));
    staggerTimers = [];
  };

  const setOpen = (open) => {
    clearStagger();
    links.forEach((link) => link.classList.remove('is-in'));

    panel?.classList.toggle('is-open', open);
    panel?.setAttribute('aria-hidden', String(!open));
    if (open) panel?.removeAttribute('inert');
    else panel?.setAttribute('inert', '');
    btn?.setAttribute('aria-expanded', String(open));
    btn?.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('nav-open', open);

    if (!open) return;

    // Force starting off-screen state to paint, then slide each link in
    void panel.offsetWidth;
    links.forEach((link, i) => {
      const id = window.setTimeout(() => {
        link.classList.add('is-in');
      }, 60 + i * 90);
      staggerTimers.push(id);
    });
  };

  btn?.addEventListener('click', () => {
    btn.classList.remove('is-clicked');
    void btn.offsetWidth;
    btn.classList.add('is-clicked');
    window.setTimeout(() => btn.classList.remove('is-clicked'), 450);

    setOpen(!panel?.classList.contains('is-open'));
  });

  links.forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });

  window.addEventListener(
    'scroll',
    () => header?.classList.toggle('scrolled', window.scrollY > 20),
    { passive: true }
  );
}

function initReveal() {
  const section = document.getElementById('about');
  if (!section) return;

  const nodes = section.querySelectorAll('.reveal');
  if (!nodes.length) return;

  const play = () => {
    nodes.forEach((el) => el.classList.add('is-visible'));
  };

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        // Double rAF so the off-screen starting state paints before animate
        requestAnimationFrame(() => {
          requestAnimationFrame(play);
        });
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.25, rootMargin: '0px 0px -12% 0px' }
  );

  observer.observe(section);
}

function initLoader() {
  const loader = document.getElementById('loader');
  if (!loader) {
    document.body.classList.remove('is-loading');
    initReveal();
    return;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const minTime = reduceMotion ? 600 : 5200;
  const started = performance.now();

  const dismiss = () => {
    const wait = Math.max(0, minTime - (performance.now() - started));
    window.setTimeout(() => {
      loader.classList.add('is-done');
      document.body.classList.remove('is-loading');
      initReveal();
      window.setTimeout(() => loader.remove(), 750);
    }, wait);
  };

  if (document.readyState === 'complete') dismiss();
  else window.addEventListener('load', dismiss, { once: true });
}

renderBrands();
initNav();
initLoader();
