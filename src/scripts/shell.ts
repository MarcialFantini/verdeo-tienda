/**
 * App shell: boots the store and the simulation once, then keeps the persistent header,
 * ticker, notifications, command palette, shortcuts and toasts in sync with the state.
 */
import { navigate } from 'astro:transitions/client';
import { PRODUCTS, ROOMS, getProduct, getWood, type Product } from '../data/catalog';
import { normalize, formatPrice } from '../lib/format';
import { isShowcase, isStill, prefersReducedMotion, escapeHtml } from '../lib/page';
import {
  boot, cartCount, getState, resetDemo, subscribe, toggleWishlist, unreadCount, update, type State,
} from '../lib/store';
import {
  cycleSpeed, onPurchase, onTick, recentPurchases, shoppersOnline, startSim, stockOf, toggleRunning, viewersOf, type Purchase,
} from '../lib/sim';
import { announce, simClockLabel, thumbSvg, toast } from '../lib/ui';
import { relativeMinutes } from '../lib/format';

const showcase = isShowcase();
const still = isStill();
const reduced = prefersReducedMotion();
boot({ memory: showcase || still, reducedMotion: reduced });
startSim(showcase || still ? { seed: 7 } : {});

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(sel));

const isMac = /Mac|iPhone|iPad/.test(navigator.userAgent);
$$('[data-kbd-mod]').forEach((k) => {
  k.textContent = isMac ? '⌘ K' : 'Ctrl K';
});

/* ---------- Counters ---------- */
function setBadge(sel: string, value: number, prevValue: number): void {
  $$(sel).forEach((badge) => {
    badge.textContent = String(value);
    badge.hidden = value === 0;
    if (value > prevValue) {
      badge.classList.remove('bump');
      void badge.offsetWidth;
      badge.classList.add('bump');
    }
  });
}

function renderCounts(s: State, prev?: State): void {
  setBadge('[data-cart-count]', cartCount(s), prev ? cartCount(prev) : cartCount(s));
  setBadge('[data-wish-count]', s.wishlist.length, prev ? prev.wishlist.length : s.wishlist.length);
  setBadge('[data-unread]', unreadCount(s), prev ? unreadCount(prev) : unreadCount(s));
  const bell = $('[data-bell]');
  bell?.setAttribute('aria-label', unreadCount(s) ? `Notificaciones, ${unreadCount(s)} sin leer` : 'Notificaciones');
  const cart = $$('[data-cart-link]');
  cart.forEach((c) => c.setAttribute('aria-label', cartCount(s) ? `Carrito, ${cartCount(s)} productos` : 'Carrito'));
}

/* ---------- Sim controls + clock ---------- */
function renderSim(s: State): void {
  document.documentElement.classList.toggle('sim-paused', !s.sim.running);
  const toggle = $('[data-action="sim-toggle"]');
  if (toggle) {
    toggle.setAttribute('aria-pressed', String(!s.sim.running));
    toggle.setAttribute('aria-label', s.sim.running ? 'Pausar simulación' : 'Reanudar simulación');
    const pause = $('[data-sim-icon="pause"]', toggle);
    const play = $('[data-sim-icon="play"]', toggle);
    if (pause) pause.hidden = !s.sim.running;
    if (play) play.hidden = s.sim.running;
  }
  const speed = $('[data-speed]');
  if (speed) speed.textContent = `${s.sim.speed}×`;
  $('[data-action="sim-speed"]')?.setAttribute('aria-label', `Velocidad de la simulación: ${s.sim.speed} por`);
  const clock = $('[data-sim-clock]');
  if (clock) clock.textContent = simClockLabel(s.sim.clock);
  const online = $('[data-online]');
  if (online) online.textContent = String(shoppersOnline(s.sim.clock));
}

/* ---------- Ticker ---------- */
function purchaseText(p: Purchase, clock: number): string {
  const wood = getWood(p.selection.wood).name.toLowerCase();
  const ago = relativeMinutes(Math.max(0, (clock - p.at) * 60));
  return `${p.buyer} de ${p.place} compró ${p.product.name} en ${wood} · ${ago}`;
}

function setFeed(text: string, href?: string, animate = true): void {
  const feed = $('[data-feed]');
  if (!feed) return;
  const old = $('[data-feed-text]', feed);
  const next = document.createElement('span');
  next.dataset['feedText'] = '';
  next.innerHTML = href ? `<a href="${href}">${escapeHtml(text)}</a>` : escapeHtml(text);
  if (old && animate && !reduced) {
    old.removeAttribute('data-feed-text');
    old.classList.add('leave');
    window.setTimeout(() => old.remove(), 420);
    next.classList.add('enter');
  } else old?.remove();
  feed.append(next);
}

let feedIndex = 0;
function rotateFeed(): void {
  if (!recentPurchases.length) return;
  const s = getState();
  feedIndex = (feedIndex + 1) % Math.min(recentPurchases.length, 6);
  const p = recentPurchases[feedIndex];
  if (p) setFeed(purchaseText(p, s.sim.clock), `/producto/${p.product.slug}`);
}

const first = recentPurchases[0];
if (first) setFeed(purchaseText(first, getState().sim.clock), `/producto/${first.product.slug}`, false);

let lastToast = 0;
onPurchase((p) => {
  feedIndex = 0;
  setFeed(purchaseText(p, getState().sim.clock), `/producto/${p.product.slug}`);
  const s = getState();
  const now = Date.now();
  const view = document.body.dataset['view'] ?? '';
  const quiet = view === 'checkout';
  const gap = showcase || still ? 5000 : 16000;
  if (s.toasts && !quiet && now - lastToast > gap) {
    lastToast = now;
    toast({
      title: `${p.buyer} de ${p.place} compró ${p.product.name}`,
      body: `${getWood(p.selection.wood).name} · ${formatPrice(p.price)}`,
      href: `/producto/${p.product.slug}`,
      thumb: { productId: p.product.id, selection: p.selection },
    });
  }
});

let ticks = 0;
onTick(() => {
  ticks++;
  if (ticks % 6 === 0) rotateFeed();
});

/* ---------- Notifications ---------- */
let noticesSig = '';
function renderNotices(s: State): void {
  const list = $('[data-notices]');
  if (!list) return;
  if (!s.notices.length) {
    list.innerHTML = '<li class="empty">No hay novedades. Cuando un pedido avance o un favorito cambie de stock, aparece acá.</li>';
    return;
  }
  list.innerHTML = s.notices
    .map((n) => {
      const inner = `<span class="dot" aria-hidden="true"></span><strong>${escapeHtml(n.title)}</strong><small>${escapeHtml(n.body)} · ${escapeHtml(simClockLabel(n.at))}</small>`;
      const label = n.read ? '' : '<span class="sr-only">Sin leer. </span>';
      return `<li class="${n.read ? '' : 'unread'}">${n.href ? `<a href="${n.href}" data-notice="${n.id}">${label}${inner}</a>` : `<div>${label}${inner}</div>`}</li>`;
    })
    .join('');
}

const notices = $<HTMLElement>('#notices');
notices?.addEventListener('click', (event) => {
  const link = (event.target as Element).closest<HTMLElement>('[data-notice]');
  if (link) {
    const id = link.dataset['notice'];
    update((s) => {
      const n = s.notices.find((x) => x.id === id);
      if (n) n.read = true;
    });
    notices.hidePopover();
  }
});

/* ---------- Command palette ---------- */
interface PaletteItem {
  id: string;
  group: 'Acciones' | 'Páginas' | 'Muebles' | 'Ambientes';
  label: string;
  hint: string;
  keywords: string;
  productId?: string;
  run: () => void;
}

const go = (href: string) => () => void navigate(href);

const PAGES: PaletteItem[] = [
  ['/', 'Inicio', 'La silla que se arma'],
  ['/catalogo', 'Catálogo', '60 muebles con filtros'],
  ['/showroom', 'Showroom', 'Ambientes armados'],
  ['/comparar', 'Comparar medidas', 'Dos muebles superpuestos'],
  ['/carrito', 'Carrito', 'Tu caja'],
  ['/checkout', 'Finalizar compra', 'Pago simulado'],
  ['/favoritos', 'Favoritos', 'Lo que guardaste'],
  ['/cuenta', 'Mi cuenta', 'Pedidos y ajustes'],
  ['/pedido', 'Seguimiento de pedido', 'Fabricación y envío'],
].map(([href, label, hint]) => ({
  id: `page:${href}`, group: 'Páginas', label: label as string, hint: hint as string,
  keywords: normalize(`${label} ${hint}`), run: go(href as string),
}));

const ROOMS_ITEMS: PaletteItem[] = Object.entries(ROOMS).map(([id, name]) => ({
  id: `room:${id}`, group: 'Ambientes', label: `Ver ${name.toLowerCase()}`, hint: 'Filtrar el catálogo',
  keywords: normalize(`${name} ambiente`), run: go(`/catalogo?ambiente=${id}`),
}));

function actionItems(): PaletteItem[] {
  const s = getState();
  return [
    { id: 'act:sim', group: 'Acciones', label: s.sim.running ? 'Pausar simulación' : 'Reanudar simulación', hint: 'P', keywords: 'pausar reanudar simulacion vivo play pausa', run: () => toggleRunning() },
    { id: 'act:speed', group: 'Acciones', label: `Velocidad: pasar a ${s.sim.speed === 4 ? 1 : s.sim.speed * 2}×`, hint: '.', keywords: 'velocidad rapido simulacion', run: () => cycleSpeed() },
    { id: 'act:notices', group: 'Acciones', label: 'Abrir notificaciones', hint: 'N', keywords: 'notificaciones avisos campana', run: () => notices?.showPopover() },
    { id: 'act:toasts', group: 'Acciones', label: s.toasts ? 'Silenciar avisos de compras' : 'Mostrar avisos de compras', hint: 'Avisos', keywords: 'silenciar avisos toasts compras', run: () => update((d) => { d.toasts = !d.toasts; }) },
    { id: 'act:help', group: 'Acciones', label: 'Ver atajos de teclado', hint: '?', keywords: 'atajos teclado ayuda', run: () => openHelp() },
    { id: 'act:showcase', group: 'Acciones', label: 'Abrir modo vitrina', hint: 'Recorrido automático', keywords: 'vitrina showcase video', run: () => { window.location.href = '/?showcase'; } },
    { id: 'act:reset', group: 'Acciones', label: 'Reiniciar demo', hint: 'Vacía todo', keywords: 'reiniciar reset borrar demo', run: () => openReset() },
  ];
}

const productItem = (p: Product): PaletteItem => ({
  id: `p:${p.id}`, group: 'Muebles', label: p.name, hint: `${ROOMS[p.room]} · desde ${formatPrice(p.basePrice)}`,
  keywords: normalize(`${p.name} ${p.kindLabel} ${p.line} ${ROOMS[p.room]} ${p.woods.map((w) => getWood(w).name).join(' ')}`),
  productId: p.id, run: go(`/producto/${p.slug}`),
});
const PRODUCT_ITEMS = PRODUCTS.map(productItem);

const palette = $<HTMLDialogElement>('[data-palette]');
const paletteInput = $<HTMLInputElement>('[data-palette-input]');
const paletteList = $<HTMLUListElement>('[data-palette-list]');
let results: PaletteItem[] = [];
let active = 0;

function search(query: string): PaletteItem[] {
  const q = normalize(query.trim());
  if (!q) {
    const recent = getState().recent.map((id) => getProduct(id)).filter((p): p is Product => !!p).slice(0, 4).map(productItem);
    const picks = recent.length ? recent : PRODUCT_ITEMS.filter((_, i) => i % 13 === 0).slice(0, 4);
    return [...actionItems().slice(0, 3), ...PAGES.slice(1, 5), ...picks];
  }
  const tokens = q.split(/\s+/);
  const score = (item: PaletteItem): number => {
    const label = normalize(item.label);
    if (!tokens.every((t) => item.keywords.includes(t) || label.includes(t))) return -1;
    return (label.startsWith(q) ? 3 : 0) + (label.includes(q) ? 2 : 0) + (item.group === 'Acciones' ? 0.5 : 0);
  };
  return [...actionItems(), ...PAGES, ...ROOMS_ITEMS, ...PRODUCT_ITEMS]
    .map((item) => ({ item, s: score(item) }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 12)
    .map((x) => x.item);
}

function renderPalette(): void {
  if (!paletteList || !paletteInput) return;
  results = search(paletteInput.value);
  active = Math.min(active, Math.max(0, results.length - 1));
  if (!results.length) {
    paletteList.innerHTML = '<li class="none" role="presentation">Sin resultados. Probá con “mesa”, “cedro” o “dormitorio”.</li>';
    paletteInput.removeAttribute('aria-activedescendant');
    return;
  }
  let lastGroup = '';
  paletteList.innerHTML = results
    .map((item, i) => {
      const head = item.group !== lastGroup ? `<li class="group" role="presentation">${item.group}</li>` : '';
      lastGroup = item.group;
      const thumb = item.productId ? thumbSvg(item.productId) : '';
      return `${head}<li role="option" id="pal-${i}" data-index="${i}" aria-selected="${i === active}"><span class="thumb">${thumb}</span><span>${escapeHtml(item.label)}</span><small>${escapeHtml(item.hint)}</small></li>`;
    })
    .join('');
  paletteInput.setAttribute('aria-activedescendant', `pal-${active}`);
}

function moveActive(delta: number): void {
  if (!results.length || !paletteList) return;
  active = (active + delta + results.length) % results.length;
  $$('[role="option"]', paletteList).forEach((li) => li.setAttribute('aria-selected', String(li.dataset['index'] === String(active))));
  paletteInput?.setAttribute('aria-activedescendant', `pal-${active}`);
  $(`#pal-${active}`, paletteList)?.scrollIntoView({ block: 'nearest' });
}

function runActive(index = active): void {
  const item = results[index];
  if (!item) return;
  palette?.close();
  item.run();
}

function openPalette(): void {
  if (!palette || !paletteInput) return;
  if (palette.open) return;
  closeAll();
  paletteInput.value = '';
  active = 0;
  renderPalette();
  palette.showModal();
  paletteInput.focus();
}

paletteInput?.addEventListener('input', () => {
  active = 0;
  renderPalette();
});
paletteInput?.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    moveActive(1);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    moveActive(-1);
  } else if (event.key === 'Enter') {
    event.preventDefault();
    runActive();
  }
});
paletteList?.addEventListener('click', (event) => {
  const li = (event.target as Element).closest<HTMLElement>('[role="option"]');
  if (li) runActive(Number(li.dataset['index']));
});
palette?.addEventListener('click', (event) => {
  if (event.target === palette) palette.close();
});

/* ---------- Help + reset dialogs ---------- */
const help = $<HTMLDialogElement>('[data-help]');
const reset = $<HTMLDialogElement>('[data-reset]');
function closeAll(): void {
  if (palette?.open) palette.close();
  if (help?.open) help.close();
  if (reset?.open) reset.close();
  try {
    notices?.hidePopover();
  } catch {
    /* not open */
  }
}
function openHelp(): void {
  closeAll();
  help?.showModal();
}
function openReset(): void {
  closeAll();
  reset?.showModal();
}
help?.addEventListener('click', (event) => {
  if (event.target === help || (event.target as Element).closest('[data-close]')) help.close();
});
reset?.addEventListener('close', () => {
  if (reset.returnValue === 'confirm') {
    resetDemo();
    announce('Demo reiniciada.');
    toast({ title: 'Demo reiniciada', body: 'Todo vuelve al día 1.' });
    void navigate(window.location.pathname + window.location.search);
  }
});

/* ---------- Delegated actions ---------- */
document.addEventListener('click', (event) => {
  const target = (event.target as Element).closest<HTMLElement>('[data-action]');
  if (!target) return;
  switch (target.dataset['action']) {
    case 'palette':
      openPalette();
      break;
    case 'help':
      openHelp();
      break;
    case 'reset':
      openReset();
      break;
    case 'sim-toggle': {
      const running = toggleRunning();
      announce(running ? 'Simulación en marcha.' : 'Simulación en pausa.');
      break;
    }
    case 'sim-speed': {
      const speed = cycleSpeed();
      announce(`Velocidad ${speed} por.`);
      break;
    }
    case 'read-all':
      update((s) => {
        s.notices.forEach((n) => {
          n.read = true;
        });
      });
      break;
  }
});

/* ---------- Keyboard shortcuts ---------- */
const GOTO: Record<string, string> = { i: '/', c: '/catalogo', s: '/showroom', m: '/comparar', f: '/favoritos', b: '/carrito', a: '/cuenta' };
let gPending = 0;

document.addEventListener('keydown', (event) => {
  const key = event.key;
  if ((event.ctrlKey || event.metaKey) && key.toLowerCase() === 'k') {
    event.preventDefault();
    if (palette?.open) palette.close();
    else openPalette();
    return;
  }
  const target = event.target as HTMLElement;
  const typing = target.matches('input, textarea, select, [contenteditable="true"]') || target.isContentEditable;
  if (typing || event.ctrlKey || event.metaKey || event.altKey) return;
  if (document.querySelector('dialog[open]')) return;
  if (gPending && Date.now() - gPending < 1200) {
    gPending = 0;
    const href = GOTO[key.toLowerCase()];
    if (href) {
      event.preventDefault();
      void navigate(href);
    }
    return;
  }
  switch (key) {
    case '/':
      event.preventDefault();
      openPalette();
      break;
    case '?':
      event.preventDefault();
      openHelp();
      break;
    case 'g':
    case 'G':
      gPending = Date.now();
      break;
    case 'n':
    case 'N':
      notices?.togglePopover();
      break;
    case 'p':
    case 'P': {
      const running = toggleRunning();
      announce(running ? 'Simulación en marcha.' : 'Simulación en pausa.');
      break;
    }
    case '.': {
      const speed = cycleSpeed();
      announce(`Velocidad ${speed} por.`);
      break;
    }
  }
});


/* ---------- Live bindings present on many views ---------- */
function renderLive(s: State): void {
  $$('[data-wish]').forEach((btn) => {
    const id = btn.dataset['wish'] ?? '';
    const on = s.wishlist.includes(id);
    btn.setAttribute('aria-pressed', String(on));
  });
  $$('[data-stock-for]').forEach((flag) => {
    const left = stockOf(flag.dataset['stockFor'] ?? '', s);
    const text = left === 0 ? 'Agotado: vuelve pronto' : left <= 3 ? `Quedan ${left}` : '';
    if (flag.textContent !== text) {
      flag.textContent = text;
      flag.classList.remove('flash');
      if (text) {
        void flag.offsetWidth;
        flag.classList.add('flash');
      }
    }
    flag.hidden = !text;
    flag.classList.toggle('out', left === 0);
  });
  $$('[data-viewers-for]').forEach((node) => {
    const n = viewersOf(node.dataset['viewersFor'] ?? '', s.sim.clock);
    const text = `${n} ${n === 1 ? 'persona viendo' : 'personas viendo'} esto`;
    if (node.textContent !== text) node.textContent = text;
  });
}

document.addEventListener('click', (event) => {
  const btn = (event.target as Element).closest<HTMLElement>('[data-wish]');
  if (!btn) return;
  event.preventDefault();
  const id = btn.dataset['wish'] ?? '';
  const product = getProduct(id);
  const added = toggleWishlist(id);
  btn.classList.remove('pop');
  void btn.offsetWidth;
  btn.classList.add('pop');
  if (product) {
    announce(added ? `${product.name} guardado en favoritos.` : `${product.name} quitado de favoritos.`);
    toast({
      title: added ? 'Guardado en favoritos' : 'Quitado de favoritos',
      body: added ? `${product.name}. Te avisamos si baja el stock.` : product.name,
      thumb: { productId: id },
      href: '/favoritos',
      ...(added ? {} : { action: { label: 'Deshacer', run: () => void toggleWishlist(id) } }),
    });
  }
});

/* ---------- Page lifecycle ---------- */
function markCurrent(): void {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const current = (href: string) => (href === '/' ? path === '/' : path.startsWith(href));
  $$('[data-nav]').forEach((a) => {
    if (current(a.dataset['nav'] ?? '')) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  $$('[data-tab]').forEach((a) => {
    if (current(a.dataset['tab'] ?? '')) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

let revealObserver: IntersectionObserver | null = null;
function reveals(): void {
  revealObserver?.disconnect();
  const items = $$('.reveal:not(.in)');
  if (reduced || !('IntersectionObserver' in window)) {
    items.forEach((i) => i.classList.add('in'));
    return;
  }
  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealObserver?.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  items.forEach((i) => revealObserver?.observe(i));
}

document.addEventListener('astro:page-load', () => {
  markCurrent();
  reveals();
  renderCounts(getState());
  renderLive(getState());
});
document.addEventListener('astro:after-swap', () => {
  closeAll();
});

subscribe((s, prev) => {
  renderCounts(s, prev);
  renderSim(s);
  renderLive(s);
  const sig = JSON.stringify(s.notices);
  if (sig !== noticesSig) {
    noticesSig = sig;
    renderNotices(s);
  }
});

renderCounts(getState());
renderSim(getState());
renderNotices(getState());
renderLive(getState());
markCurrent();
reveals();
