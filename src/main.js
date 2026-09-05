// src/main.js — Perfumatory Oman App Entry
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BottleViewer } from './three/bottleViewer.js';
import { HOUSES, NOTES, findFragrances, getAllFragrances, getHouseById } from './data/houses.js';

gsap.registerPlugin(ScrollTrigger);

// ════════════════════════════════════════════════════════════════
// 1. ORDERING SYSTEM & SHOPPING BAG STATE
// ════════════════════════════════════════════════════════════════
const CART_STORAGE_KEY = 'perfumatory_oman_cart';

let cart = {
  items: [],
};

function loadCart() {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (saved) cart = JSON.parse(saved);
  } catch (e) {
    cart = { items: [] };
  }
}

function saveCart() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (e) {}
}

export function addToCart(fragrance, house) {
  const existing = cart.items.find(i => i.id === fragrance.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.items.push({
      id: fragrance.id,
      name: fragrance.name,
      houseName: house.name,
      price: fragrance.price,
      currency: fragrance.currency,
      size: fragrance.variants?.[0]?.size || '100ml',
      sku: fragrance.sku || `SKU-${fragrance.id}`,
      quantity: 1,
      image: house.logoFile,
    });
  }
  saveCart();
  updateCartUI();
  openCartDrawer();
}

function updateQuantity(id, delta) {
  const item = cart.items.find(i => i.id === id);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    cart.items = cart.items.filter(i => i.id !== id);
  }
  saveCart();
  updateCartUI();
  renderCartItems();
}

function removeFromCart(id) {
  cart.items = cart.items.filter(i => i.id !== id);
  saveCart();
  updateCartUI();
  renderCartItems();
}

function updateCartUI() {
  const countEl = document.getElementById('cart-count');
  const totalCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  if (countEl) {
    countEl.textContent = totalCount;
    countEl.classList.toggle('visible', totalCount > 0);
  }
}

function openCartDrawer() {
  const overlay = document.getElementById('cart-drawer-overlay');
  if (!overlay) return;
  renderCartItems();
  overlay.hidden = false;
  document.body.classList.add('menu-open');
}

function closeCartDrawer() {
  const overlay = document.getElementById('cart-drawer-overlay');
  if (!overlay) return;
  overlay.hidden = true;
  document.body.classList.remove('menu-open');
}

function renderCartItems() {
  const container = document.getElementById('cart-drawer-items');
  const subtotalEl = document.getElementById('cart-subtotal');
  if (!container || !subtotalEl) return;

  if (cart.items.length === 0) {
    container.innerHTML = `
      <div class="cart-empty-state">
        <p style="font-family: var(--font-editorial); font-size: 1.25rem; margin-bottom: 8px;">Your Olfactory Selection is Empty</p>
        <p style="font-size: 0.8rem; color: var(--color-cream-muted);">Explore our 16 fragrance houses or use our Scent Finder to add exquisite flacons.</p>
      </div>
    `;
    subtotalEl.textContent = 'OMR 0';
    return;
  }

  let total = 0;
  container.innerHTML = cart.items.map(item => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    return `
      <div class="cart-item" id="cart-item-${item.id}">
        <div class="cart-item-info">
          <p class="cart-item-brand">${item.houseName}</p>
          <p class="cart-item-name">${item.name} (${item.size})</p>
          <p class="cart-item-price">${item.currency} ${item.price}</p>
          <div class="cart-item-controls">
            <button class="qty-btn" data-action="dec" data-id="${item.id}" aria-label="Decrease quantity">&minus;</button>
            <span class="qty-val">${item.quantity}</span>
            <button class="qty-btn" data-action="inc" data-id="${item.id}" aria-label="Increase quantity">&plus;</button>
          </div>
        </div>
        <button class="cart-item-remove" data-action="remove" data-id="${item.id}" aria-label="Remove item">&times;</button>
      </div>
    `;
  }).join('');

  subtotalEl.textContent = `OMR ${total}`;

  // Attach event listeners to buttons
  container.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      if (action === 'inc') updateQuantity(id, 1);
      else if (action === 'dec') updateQuantity(id, -1);
      else if (action === 'remove') removeFromCart(id);
    });
  });
}

function initCartDrawer() {
  const cartBtn = document.getElementById('cart-btn');
  const closeBtn = document.getElementById('cart-close-btn');
  const overlay = document.getElementById('cart-drawer-overlay');
  const checkoutBtn = document.getElementById('cart-checkout-btn');

  cartBtn?.addEventListener('click', openCartDrawer);
  closeBtn?.addEventListener('click', closeCartDrawer);
  overlay?.addEventListener('click', e => {
    if (e.target === overlay) closeCartDrawer();
  });

  checkoutBtn?.addEventListener('click', () => {
    if (cart.items.length === 0) return;
    const originalText = checkoutBtn.innerHTML;
    checkoutBtn.innerHTML = '<span>Opening Private Consultation Channel...</span>';
    setTimeout(() => {
      closeCartDrawer();
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
        const msgField = document.getElementById('form-message');
        if (msgField) {
          const list = cart.items.map(i => `${i.houseName} - ${i.name} (${i.quantity}x)`).join(', ');
          msgField.value = `Hello Perfumatory Oman, I would like to arrange an order for: ${list}. Total estimate: ${document.getElementById('cart-subtotal')?.textContent}. Please contact me regarding delivery and bespoke packaging.`;
        }
      }
      checkoutBtn.innerHTML = originalText;
    }, 800);
  });
}

// ════════════════════════════════════════════════════════════════
// 2. PAGE LOADER & LENIS SMOOTH SCROLL
// ════════════════════════════════════════════════════════════════
function hideLoader() {
  const loader = document.getElementById('page-loader');
  if (!loader || loader.classList.contains('hidden')) return;
  loader.classList.add('hidden');
  // Remove from DOM after fade so it never blocks interaction
  setTimeout(() => {
    if (loader.parentNode) loader.remove();
  }, 900);
}

const lenis = new Lenis({
  duration: 1.5,
  easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  direction: 'vertical',
  gestureDirection: 'vertical',
  smooth: true,
  smoothTouch: false,
  touchMultiplier: 1.8,
});

function raf(time) {
  lenis.raf(time);
  ScrollTrigger.update();
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// ════════════════════════════════════════════════════════════════
// 3. NAVIGATION BAR & MOBILE MENU
// ════════════════════════════════════════════════════════════════
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 30);
  }, { passive: true });

  hamburger?.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', isOpen);
    document.body.classList.toggle('menu-open', isOpen);
  });

  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
    });
  });
}

// ════════════════════════════════════════════════════════════════
// 4. HERO SECTION: 3D OBVIOUS BOTTLE & ROUNDED GOLD PARTICLES
// ════════════════════════════════════════════════════════════════
let heroViewer = null;

function initHero() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  heroViewer = new BottleViewer(canvas, {
    autoRotate: true,
    rotationSpeed: 0.003,
    interactive: true,
  });

  // Parallax on scroll
  ScrollTrigger.create({
    trigger: '.hero',
    start: 'top top',
    end: 'bottom top',
    scrub: true,
    onUpdate: self => {
      heroViewer?.scrollRespond(self.progress);
    },
  });

  initHeroParticles();
}

function initHeroParticles() {
  const container = document.getElementById('hero-particles');
  if (!container) return;
  const count = 40;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const x = Math.random() * 100;
    const y = 15 + Math.random() * 75;
    const dur = 7 + Math.random() * 9;
    const delay = Math.random() * 8;
    const drift = (Math.random() - 0.5) * 80;
    const maxOpacity = 0.3 + Math.random() * 0.45;
    const size = 3 + Math.random() * 5; // Perfectly rounded visible golden orbs!
    p.style.cssText = `left:${x}%;top:${y}%;--dur:${dur}s;--delay:${delay}s;--drift:${drift}px;--max-opacity:${maxOpacity};width:${size}px;height:${size}px;`;
    container.appendChild(p);
  }
}

// ════════════════════════════════════════════════════════════════
// 5. INSTAGRAM STORY HIGHLIGHTS TRACK (THE 16 HOUSES)
// ════════════════════════════════════════════════════════════════
function initHighlights() {
  const track = document.getElementById('highlights-track');
  if (!track) return;

  track.innerHTML = '';
  HOUSES.forEach(house => {
    const item = document.createElement('button');
    item.className = 'highlight-item';
    item.setAttribute('aria-label', `View ${house.name} highlight`);

    // Use badgeText if available, otherwise truncate name
    const label = house.badgeText || house.name;

    item.innerHTML = `
      <div class="highlight-ring">
        <div class="highlight-inner">
          <img src="/assets/${house.logoFile}" alt="${house.name}" class="highlight-img" loading="lazy" />
        </div>
      </div>
      <span class="highlight-label">${label}</span>
    `;

    item.addEventListener('click', () => {
      // Open the house's signature fragrance modal
      openHouseModal(house);
    });

    track.appendChild(item);
  });
}

// ════════════════════════════════════════════════════════════════
// 6. CURATED HOUSES GRID (16 PRESTIGE HOUSES)
// ════════════════════════════════════════════════════════════════
function initHouses() {
  const grid = document.getElementById('houses-grid');
  if (!grid) return;

  grid.innerHTML = '';
  HOUSES.forEach((house, i) => {
    const card = document.createElement('div');
    card.className = 'house-card';
    card.setAttribute('role', 'listitem');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `${house.name} — ${house.essence}`);
    card.id = `house-card-${house.id}`;

    const sigCount = house.fragrances.length;

    card.innerHTML = `
      <span class="house-origin-tag">${house.origin} &bull; Est. ${house.founded}</span>
      <div class="house-badge-ring">
        <div class="house-badge-inner">
          <img
            src="/assets/${house.logoFile}"
            alt="${house.name} insignia"
            class="house-badge-img"
            loading="lazy"
          />
        </div>
      </div>
      <h3 class="house-name">${house.name}</h3>
      <p class="house-essence">${house.essence}</p>
      <div class="house-footer">
        <span class="house-sig-count">${sigCount} Signature Flacon${sigCount > 1 ? 's' : ''}</span>
        <span class="house-explore">Explore House &rarr;</span>
      </div>
    `;

    card.addEventListener('click', () => openHouseModal(house));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openHouseModal(house);
      }
    });

    grid.appendChild(card);

    // Fade-in trigger
    gsap.fromTo(card,
      { opacity: 0, y: 30 },
      {
        opacity: 1, y: 0, duration: 0.8, delay: (i % 4) * 0.1, ease: 'power2.out',
        scrollTrigger: { trigger: card, start: 'top 88%', once: true },
      }
    );
  });
}

// ════════════════════════════════════════════════════════════════
// 7. FRAGRANCE FINDER
// ════════════════════════════════════════════════════════════════
let selectedNotes = new Set();

function initFinder() {
  const topContainer = document.getElementById('top-notes');
  const heartContainer = document.getElementById('heart-notes');
  const baseContainer = document.getElementById('base-notes');
  const preview = document.getElementById('selected-preview');
  const discoverBtn = document.getElementById('finder-discover-btn');
  const resultsEl = document.getElementById('finder-results');

  if (!topContainer) return;

  function renderChips(container, notes) {
    container.innerHTML = '';
    notes.forEach(note => {
      const chip = document.createElement('button');
      chip.className = 'note-chip';
      chip.textContent = note.label;
      chip.id = `chip-${note.id}`;
      chip.setAttribute('aria-pressed', 'false');

      chip.addEventListener('click', () => {
        if (selectedNotes.has(note.id)) {
          selectedNotes.delete(note.id);
          chip.classList.remove('selected');
          chip.setAttribute('aria-pressed', 'false');
        } else {
          selectedNotes.add(note.id);
          chip.classList.add('selected');
          chip.setAttribute('aria-pressed', 'true');
        }
        updatePreview();
      });

      container.appendChild(chip);
    });
  }

  renderChips(topContainer, NOTES.top);
  renderChips(heartContainer, NOTES.heart);
  renderChips(baseContainer, NOTES.base);

  function updatePreview() {
    if (!preview) return;
    if (selectedNotes.size === 0) {
      preview.innerHTML = '<span class="preview-placeholder">No notes selected &mdash; click notes above to begin</span>';
      return;
    }
    const allNotes = [...NOTES.top, ...NOTES.heart, ...NOTES.base];
    preview.innerHTML = Array.from(selectedNotes).map(id => {
      const n = allNotes.find(item => item.id === id);
      return `<span class="preview-chip">${n ? n.label : id}</span>`;
    }).join('');
  }

  discoverBtn?.addEventListener('click', () => {
    const matches = findFragrances(Array.from(selectedNotes));
    renderFinderResults(matches);
  });

  // Initial populate with top recommendations
  renderFinderResults(findFragrances([]));
}

function renderFinderResults(fragrances) {
  const resultsEl = document.getElementById('finder-results');
  if (!resultsEl) return;

  resultsEl.innerHTML = '';

  fragrances.forEach(frag => {
    const house = getHouseById(frag.houseId) || { name: frag.houseName, origin: frag.houseOrigin };
    const card = document.createElement('div');
    card.className = 'result-card';

    const tagsHtml = (frag.topNotes || []).slice(0, 3).map(n => `<span class="result-tag">${n}</span>`).join('');

    card.innerHTML = `
      <span class="result-house">${house.name} &bull; ${house.origin}</span>
      <h4 class="result-name">${frag.name}</h4>
      <p class="result-price">${frag.currency} ${frag.price}</p>
      <p class="result-story">${frag.story.substring(0, 130)}...</p>
      <div class="result-notes-match">${tagsHtml}</div>
      <div class="result-actions">
        <button class="result-btn-view" data-frag-id="${frag.id}">View Flacon</button>
        <button class="result-btn-cart" data-cart-id="${frag.id}" title="Add to Bag">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:16px;height:16px;"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
        </button>
      </div>
    `;

    card.querySelector('.result-btn-view').addEventListener('click', () => {
      openProductModal(frag, house);
    });

    card.querySelector('.result-btn-cart').addEventListener('click', () => {
      addToCart(frag, house);
    });

    resultsEl.appendChild(card);
  });

  // Smooth scroll down to results
  gsap.fromTo('.result-card',
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out' }
  );
}

// ════════════════════════════════════════════════════════════════
// 8. 360° INTERACTIVE PRODUCT DETAIL MODAL
// ════════════════════════════════════════════════════════════════
let productViewer = null;

function openHouseModal(house) {
  if (house.fragrances && house.fragrances.length) {
    openProductModal(house.fragrances[0], house);
  }
}

function openProductModal(fragrance, house) {
  const overlay = document.getElementById('product-modal-overlay');
  const infoEl = document.getElementById('product-info');
  const anglesEl = document.getElementById('product-angles');
  if (!overlay || !infoEl) return;

  productViewer?.dispose();
  productViewer = null;

  infoEl.innerHTML = `
    <p class="product-brand">${house.name} &mdash; ${house.origin}</p>
    <h2 class="product-name">${fragrance.name}</h2>
    <div class="product-price-row">
      <span class="product-price">${fragrance.currency} ${fragrance.price}</span>
      <span class="product-vat">Includes luxury curation &amp; GCC packaging</span>
    </div>
    <p class="product-story">${fragrance.story}</p>
    
    <div class="notes-pyramid">
      <p class="pyramid-header">OLFACTORY NOTES PYRAMID</p>
      <div class="pyramid-tier tier-top">
        <span class="tier-title">Top Notes:</span>
        <span class="tier-notes">${fragrance.topNotes.join(', ')}</span>
      </div>
      <div class="pyramid-tier tier-heart">
        <span class="tier-title">Heart Notes:</span>
        <span class="tier-notes">${fragrance.heartNotes.join(', ')}</span>
      </div>
      <div class="pyramid-tier tier-base">
        <span class="tier-title">Base Notes:</span>
        <span class="tier-notes">${fragrance.baseNotes.join(', ')}</span>
      </div>
    </div>

    <div class="product-specs">
      <div class="spec-item">
        <span class="spec-label">Family</span>
        <p class="spec-val">${fragrance.family}</p>
      </div>
      <div class="spec-item">
        <span class="spec-label">Concentration</span>
        <p class="spec-val">${fragrance.concentration}</p>
      </div>
      <div class="spec-item">
        <span class="spec-label">Longevity</span>
        <p class="spec-val">${fragrance.longevity}</p>
      </div>
      <div class="spec-item">
        <span class="spec-label">Sillage</span>
        <p class="spec-val">${fragrance.sillage}</p>
      </div>
    </div>

    <div class="product-actions">
      <button class="btn btn-primary btn-add-cart" id="modal-add-cart">
        <span>Add Flacon to Bag &bull; ${fragrance.currency} ${fragrance.price}</span>
      </button>
      <button class="btn-sample" id="modal-sample-btn">Request Sample Set</button>
    </div>
  `;

  // Angle thumbnails
  anglesEl.innerHTML = `
    <img src="/assets/${house.imageFallback}" alt="${fragrance.name} angle 1" class="angle-thumb active" />
    <img src="/assets/fragrance example for 3d2.jpg" alt="${fragrance.name} angle 2" class="angle-thumb" />
  `;

  anglesEl.querySelectorAll('.angle-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      anglesEl.querySelectorAll('.angle-thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });

  // Modal 3D interactive bottle viewer
  const pCanvas = document.getElementById('product-canvas');
  if (pCanvas) {
    productViewer = new BottleViewer(pCanvas, {
      autoRotate: true,
      rotationSpeed: 0.004,
      interactive: true,
    });
  }

  // Connect Add to Cart
  document.getElementById('modal-add-cart')?.addEventListener('click', () => {
    addToCart(fragrance, house);
    closeProductModal();
  });

  // Sample Set Request
  document.getElementById('modal-sample-btn')?.addEventListener('click', () => {
    closeProductModal();
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
      const select = document.getElementById('form-interest');
      const msgField = document.getElementById('form-message');
      if (select) select.value = 'sampling';
      if (msgField) msgField.value = `I would like to request an olfactory discovery sample of ${house.name} — ${fragrance.name}.`;
    }
  });

  overlay.hidden = false;
  document.body.classList.add('menu-open');
}

function closeProductModal() {
  const overlay = document.getElementById('product-modal-overlay');
  if (!overlay) return;
  overlay.hidden = true;
  document.body.classList.remove('menu-open');
  productViewer?.dispose();
  productViewer = null;
}

function initModal() {
  const overlay = document.getElementById('product-modal-overlay');
  const closeBtn = document.getElementById('modal-close-btn');

  closeBtn?.addEventListener('click', closeProductModal);
  overlay?.addEventListener('click', e => {
    if (e.target === overlay) closeProductModal();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeProductModal();
      closeCartDrawer();
    }
  });
}

// ════════════════════════════════════════════════════════════════
// 9. HERITAGE EDITORIAL SECTION
// ════════════════════════════════════════════════════════════════
function initHeritage() {
  const container = document.getElementById('heritage-editorial');
  if (!container) return;

  const featuredHouses = HOUSES.filter(h =>
    ['obvious', 'clive-christian', 'creed', 'nishane', 'thameen', 'ojar'].includes(h.id)
  );

  container.innerHTML = featuredHouses.map((house, i) => {
    const imgSrc = i % 2 === 0 ? 'fragrance example for 3d.jpg' : 'fragrance example for 3d2.jpg';
    return `
      <div class="heritage-item" id="heritage-${house.id}">
        <div class="heritage-img-wrap">
          <img src="/assets/${imgSrc}" alt="${house.name} heritage" class="heritage-img" loading="lazy" />
        </div>
        <div class="heritage-text">
          <span class="heritage-year">${house.origin} &bull; Established ${house.founded}</span>
          <h3 class="heritage-house-name">${house.name}</h3>
          <p class="heritage-philosophy">${house.philosophy}</p>
          <p class="heritage-founder">Craftsmanship Vision: ${house.founder}</p>
          <div class="heritage-scents">
            ${house.fragrances.map(f => `<span class="heritage-scent-tag">${f.name} &bull; ${f.family}</span>`).join('')}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ════════════════════════════════════════════════════════════════
// 10. CONTACT FORM & ANCHORS
// ════════════════════════════════════════════════════════════════
function initContact() {
  const form = document.getElementById('contact-form');
  form?.addEventListener('submit', e => {
    e.preventDefault();
    const btn = document.getElementById('contact-submit-btn');
    const original = btn.innerHTML;
    btn.innerHTML = '<span>Concierge Inquiry Received</span>';
    btn.disabled = true;
    setTimeout(() => {
      btn.innerHTML = original;
      btn.disabled = false;
      form.reset();
    }, 3500);
  });
}

function initAnchorScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        lenis.scrollTo(target, { offset: -70, duration: 1.4 });
      }
    });
  });
}

// ════════════════════════════════════════════════════════════════
// 11. BOOT APPLICATION
// ════════════════════════════════════════════════════════════════
function init() {
  const steps = [
    loadCart,
    updateCartUI,
    initNavbar,
    initCartDrawer,
    initHero,
    initHighlights,
    initHouses,
    initFinder,
    initModal,
    initHeritage,
    initContact,
    initAnchorScroll,
  ];

  for (const step of steps) {
    try {
      step();
    } catch (err) {
      console.error(`[Perfumatory] init step failed: ${step.name}`, err);
    }
  }

  // Always dismiss loader, even if a step crashed
  requestAnimationFrame(() => {
    setTimeout(hideLoader, 400);
  });
}

// Hard fallback so the splash never sticks forever
setTimeout(hideLoader, 4000);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
