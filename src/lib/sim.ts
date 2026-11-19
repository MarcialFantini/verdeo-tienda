/**
 * Simulation engine: one clock drives every live element of the demo.
 * 1 real second = `speed` sim hours. Purchases, stock, viewers and order progress all derive from it.
 */
import { PRODUCTS, WOODS, getProduct, priceFor, stagePlan, type Product, type Selection, type SizeId } from '../data/catalog';
import { PROVINCES, shippingQuote } from '../data/argentina';
import { hashString, mulberry32, pick } from './prng';
import { getState, pushNotice, subscribe, update, type Order, type Speed, type State } from './store';

export interface Purchase {
  id: string;
  buyer: string;
  place: string;
  product: Product;
  selection: Selection;
  price: number;
  at: number;
}

type PurchaseListener = (p: Purchase) => void;
type TickListener = (clock: number) => void;

const NAMES = [
  'Lucía', 'Martín', 'Sofía', 'Joaquín', 'Valentina', 'Facundo', 'Camila', 'Agustín', 'Julieta', 'Tomás',
  'Florencia', 'Matías', 'Carolina', 'Nicolás', 'Milagros', 'Santiago', 'Rocío', 'Ignacio', 'Paula', 'Gonzalo',
  'Micaela', 'Franco', 'Belén', 'Lautaro', 'Antonella', 'Emiliano', 'Agostina', 'Bruno', 'Victoria', 'Ramiro',
];

export const DAY = 24;

let rand = mulberry32(Date.now() >>> 0);
let timer = 0;
let started = false;
const purchaseListeners = new Set<PurchaseListener>();
const tickListeners = new Set<TickListener>();
export const recentPurchases: Purchase[] = [];

export function stockOf(productId: string, s: State = getState()): number {
  const product = getProduct(productId);
  if (!product) return 0;
  return s.sim.stock[productId] ?? product.stock;
}

/** Live viewers for a product: popularity baseline plus a slow wobble on the sim clock. */
export function viewersOf(productId: string, clock = getState().sim.clock): number {
  const product = getProduct(productId);
  if (!product) return 0;
  const h = hashString(productId);
  const base = 2 + product.popularity * 16;
  const wobble = Math.sin(clock / 3 + (h % 360)) * 3 + Math.sin(clock / 1.3 + (h % 97)) * 1.4;
  return Math.max(1, Math.round(base + wobble));
}

export function shoppersOnline(clock = getState().sim.clock): number {
  return Math.round(84 + Math.sin(clock / 5) * 18 + Math.sin(clock / 1.7) * 6);
}

export type OrderPhase = 'production' | 'shipping' | 'delivered';

export interface OrderProgress {
  phase: OrderPhase;
  day: number;
  stageId: string;
  stageName: string;
  stageIndex: number;
  /** 0..1 over production */
  production: number;
  /** 0..1 over shipping */
  shipping: number;
  label: string;
}

export function orderProgress(order: Order, clock = getState().sim.clock): OrderProgress {
  const elapsedDays = Math.max(0, (clock - order.placedAt) / DAY);
  const plan = stagePlan(order.productionDays);
  if (elapsedDays < order.productionDays) {
    const day = Math.floor(elapsedDays) + 1;
    const index = Math.max(0, plan.findIndex((st) => day >= st.from && day <= st.to));
    const stage = plan[index] ?? plan[0];
    return {
      phase: 'production',
      day,
      stageId: stage?.id ?? 'corte',
      stageName: stage?.name ?? 'Corte',
      stageIndex: index,
      production: elapsedDays / order.productionDays,
      shipping: 0,
      label: `Día ${day} de ${order.productionDays}: ${stage?.name.toLowerCase() ?? ''}`,
    };
  }
  const shipped = elapsedDays - order.productionDays;
  if (shipped < order.shippingDays) {
    return {
      phase: 'shipping',
      day: Math.floor(elapsedDays) + 1,
      stageId: 'envio',
      stageName: 'En camino',
      stageIndex: plan.length,
      production: 1,
      shipping: shipped / order.shippingDays,
      label: `En camino a ${shippingQuote(order.province).province.name}`,
    };
  }
  return {
    phase: 'delivered',
    day: Math.floor(elapsedDays) + 1,
    stageId: 'entregado',
    stageName: 'Entregado',
    stageIndex: plan.length + 1,
    production: 1,
    shipping: 1,
    label: 'Entregado',
  };
}

function randomSelection(product: Product): Selection {
  const sizes: SizeId[] = ['s', 'm', 'm', 'l'];
  return {
    wood: pick(rand, product.woods),
    fabric: product.fabrics.length ? pick(rand, product.fabrics) : null,
    size: pick(rand, sizes),
  };
}

function weightedProduct(): Product {
  const s = getState();
  const pool = PRODUCTS.filter((p) => stockOf(p.id, s) > 0);
  const total = pool.reduce((n, p) => n + p.popularity, 0);
  let roll = rand() * total;
  for (const p of pool) {
    roll -= p.popularity;
    if (roll <= 0) return p;
  }
  return pool[0] ?? (PRODUCTS[0] as Product);
}

function makePurchase(at: number): Purchase {
  const product = weightedProduct();
  const selection = randomSelection(product);
  const province = pick(rand, PROVINCES);
  return {
    id: `p${at}-${Math.floor(rand() * 1e6)}`,
    buyer: pick(rand, NAMES),
    place: province.name,
    product,
    selection,
    price: priceFor(product, selection),
    at,
  };
}

function seedHistory(clock: number): void {
  for (let i = 1; i <= 6; i++) recentPurchases.push(makePurchase(clock - i * 0.35));
}

function emitPurchase(p: Purchase): void {
  recentPurchases.unshift(p);
  recentPurchases.length = Math.min(recentPurchases.length, 24);
  purchaseListeners.forEach((fn) => fn(p));
}

function tick(): void {
  const before = getState();
  if (!before.sim.running) return;
  const step = before.sim.speed;
  let purchase: Purchase | null = null;
  const chance = Math.min(0.9, 0.17 * step);
  if (rand() < chance) purchase = makePurchase(before.sim.clock + step);

  update((s) => {
    s.sim.clock += step;
    const clock = s.sim.clock;
    // restocks
    for (const [id, when] of Object.entries(s.sim.restock)) {
      if (clock >= when) {
        const product = getProduct(id);
        delete s.sim.restock[id];
        s.sim.stock[id] = 4 + Math.floor(rand() * 6);
        if (product && s.wishlist.includes(id)) {
          queueNotice(s, { kind: 'restock', title: `Volvió el stock de ${product.name}`, body: `Hay ${s.sim.stock[id]} unidades listas para fabricar.`, href: `/producto/${product.slug}` });
        }
      }
    }
    if (purchase) {
      const id = purchase.product.id;
      const left = Math.max(0, (s.sim.stock[id] ?? purchase.product.stock) - 1);
      s.sim.stock[id] = left;
      s.sim.sold[id] = (s.sim.sold[id] ?? 0) + 1;
      if (left === 0) s.sim.restock[id] = clock + DAY * (2 + Math.floor(rand() * 3));
      const watched = s.wishlist.includes(id) || s.cart.some((l) => l.productId === id);
      if (watched && left <= 3) {
        queueNotice(s, {
          kind: 'stock',
          title: left === 0 ? `${purchase.product.name} se agotó` : `Quedan ${left} de ${purchase.product.name}`,
          body: left === 0 ? 'Vuelve en unos días. Te avisamos cuando haya stock.' : 'Alguien acaba de comprar uno. Si lo querías, es buen momento.',
          href: `/producto/${purchase.product.slug}`,
        });
      }
    }
    // order progress
    for (const order of s.orders) {
      const progress = orderProgress(order, clock);
      const last = s.sim.stages[order.id];
      if (last !== progress.stageId) {
        s.sim.stages[order.id] = progress.stageId;
        if (last !== undefined) {
          const title =
            progress.phase === 'production'
              ? `Pedido ${order.id}: ${progress.stageName.toLowerCase()}`
              : progress.phase === 'shipping'
                ? `Pedido ${order.id} despachado`
                : `Pedido ${order.id} entregado`;
          queueNotice(s, { kind: 'order', title, body: progress.label, href: `/pedido?id=${order.id}` });
        }
      }
    }
  });
  flushNotices();
  if (purchase) emitPurchase(purchase);
  const clock = getState().sim.clock;
  tickListeners.forEach((fn) => fn(clock));
}

const pendingNotices: { kind: 'order' | 'stock' | 'restock'; title: string; body: string; href: string }[] = [];
function queueNotice(_s: State, n: { kind: 'order' | 'stock' | 'restock'; title: string; body: string; href: string }): void {
  pendingNotices.push(n);
}
function flushNotices(): void {
  const clock = getState().sim.clock;
  while (pendingNotices.length) {
    const n = pendingNotices.shift();
    if (n) pushNotice(n, clock);
  }
}

function schedule(): void {
  window.clearInterval(timer);
  timer = 0;
  if (document.hidden) return;
  timer = window.setInterval(tick, 1000);
}

export function startSim(options: { seed?: number } = {}): void {
  if (started) return;
  started = true;
  if (options.seed !== undefined) rand = mulberry32(options.seed);
  seedHistory(getState().sim.clock);
  schedule();
  document.addEventListener('visibilitychange', schedule);
  subscribe((s, prev) => {
    if (s.sim.clock < prev.sim.clock) {
      // demo was reset
      recentPurchases.length = 0;
      seedHistory(s.sim.clock);
    }
  });
}

export function setRunning(running: boolean): void {
  update((s) => {
    s.sim.running = running;
  });
}

export function toggleRunning(): boolean {
  const next = !getState().sim.running;
  setRunning(next);
  return next;
}

export function setSpeed(speed: Speed): void {
  update((s) => {
    s.sim.speed = speed;
  });
}

export function cycleSpeed(): Speed {
  const order: Speed[] = [1, 2, 4];
  const current = getState().sim.speed;
  const next = order[(order.indexOf(current) + 1) % order.length] ?? 1;
  setSpeed(next);
  return next;
}

/** Jump the clock forward (used by the order tracker's "adelantar un día"). */
export function advance(hours: number): void {
  const wasRunning = getState().sim.running;
  update((s) => {
    s.sim.running = true;
  });
  const steps = Math.max(1, Math.round(hours / getState().sim.speed));
  for (let i = 0; i < steps; i++) tick();
  if (!wasRunning) setRunning(false);
}

export const onPurchase = (fn: PurchaseListener): (() => void) => {
  purchaseListeners.add(fn);
  return () => purchaseListeners.delete(fn);
};

export const onTick = (fn: TickListener): (() => void) => {
  tickListeners.add(fn);
  return () => tickListeners.delete(fn);
};

/** A purchase made by the visitor also feeds the live layer. */
export function announceOwnPurchase(order: Order): void {
  const first = order.lines[0];
  const product = first ? getProduct(first.productId) : undefined;
  if (!first || !product) return;
  update((s) => {
    for (const line of order.lines) {
      const left = Math.max(0, (s.sim.stock[line.productId] ?? getProduct(line.productId)?.stock ?? 0) - line.qty);
      s.sim.stock[line.productId] = left;
    }
  });
  emitPurchase({
    id: `own-${order.id}`,
    buyer: order.customer.name.split(' ')[0] ?? 'Vos',
    place: shippingQuote(order.province).province.name,
    product,
    selection: { wood: first.wood, fabric: first.fabric, size: first.size },
    price: first.unitPrice,
    at: getState().sim.clock,
  });
}

export const woodName = (id: string): string => WOODS.find((w) => w.id === id)?.name ?? id;
