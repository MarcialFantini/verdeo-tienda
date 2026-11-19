/**
 * Single client store shared by every view. Persisted in localStorage, synced across tabs.
 * In showcase mode it runs in memory from a clean state and never touches the saved session.
 */
import type { SizeId } from '../data/catalog';

export interface CartLine {
  key: string;
  productId: string;
  wood: string;
  fabric: string | null;
  size: SizeId;
  qty: number;
  unitPrice: number;
}

export interface Customer {
  name: string;
  email: string;
  phone: string;
  dni: string;
  address: string;
  city: string;
}

export interface Order {
  id: string;
  lines: CartLine[];
  subtotal: number;
  shippingCost: number;
  total: number;
  province: string;
  shippingDays: number;
  productionDays: number;
  customer: Customer;
  payment: 'tarjeta' | 'transferencia' | 'efectivo';
  /** sim clock (in sim hours) when the order was placed */
  placedAt: number;
  createdAt: number;
}

export type NoticeKind = 'order' | 'stock' | 'restock' | 'system' | 'wishlist';

export interface Notice {
  id: string;
  kind: NoticeKind;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  at: number;
}

export type Speed = 1 | 2 | 4;

export interface SimState {
  running: boolean;
  speed: Speed;
  /** sim hours elapsed since the demo started */
  clock: number;
  stock: Record<string, number>;
  sold: Record<string, number>;
  /** sim hour when a sold-out product comes back */
  restock: Record<string, number>;
  /** last order stage notified, per order id */
  stages: Record<string, string>;
}

export interface State {
  v: 2;
  cart: CartLine[];
  wishlist: string[];
  compare: [string | null, string | null];
  orders: Order[];
  notices: Notice[];
  recent: string[];
  province: string;
  toasts: boolean;
  sim: SimState;
}

const KEY = 'rioLujan.demo.v2';

export function freshState(): State {
  return {
    v: 2,
    cart: [],
    wishlist: [],
    compare: [null, null],
    orders: [],
    notices: [
      {
        id: 'welcome',
        kind: 'system',
        title: 'Bienvenida a la demo',
        body: 'Todo lo que pasa acá es simulado: stock, compras y envíos. Probá Ctrl + K para buscar.',
        read: false,
        at: 0,
      },
    ],
    recent: [],
    province: 'cordoba',
    toasts: true,
    sim: { running: true, speed: 1, clock: 0, stock: {}, sold: {}, restock: {}, stages: {} },
  };
}

type Listener = (state: State, prev: State) => void;

let memoryOnly = false;
let state: State = freshState();
const listeners = new Set<Listener>();
let saveTimer = 0;
let booted = false;

function isState(value: unknown): value is State {
  return typeof value === 'object' && value !== null && (value as { v?: unknown }).v === 2;
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return freshState();
    const parsed: unknown = JSON.parse(raw);
    if (!isState(parsed)) return freshState();
    const base = freshState();
    return { ...base, ...parsed, sim: { ...base.sim, ...parsed.sim } };
  } catch {
    return freshState();
  }
}

function persist(): void {
  if (memoryOnly) return;
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked: the demo keeps working in memory */
    }
  }, 120);
}

export interface BootOptions {
  memory: boolean;
  reducedMotion: boolean;
}

export function boot(options: BootOptions): State {
  if (booted) return state;
  booted = true;
  memoryOnly = options.memory;
  state = memoryOnly ? freshState() : load();
  if (options.reducedMotion) state = { ...state, sim: { ...state.sim, running: false } };
  if (!memoryOnly) {
    window.addEventListener('storage', (event) => {
      if (event.key !== KEY || !event.newValue) return;
      try {
        const next: unknown = JSON.parse(event.newValue);
        if (isState(next)) {
          const prev = state;
          // keep this tab's clock authority; take the user's data from the other tab
          state = { ...next, sim: { ...next.sim, running: prev.sim.running } };
          listeners.forEach((fn) => fn(state, prev));
        }
      } catch {
        /* ignore malformed */
      }
    });
  }
  return state;
}

export const isMemoryOnly = (): boolean => memoryOnly;

export function getState(): State {
  return state;
}

export function update(mutator: (draft: State) => State | void): State {
  const prev = state;
  const draft = structuredClone(state);
  const result = mutator(draft);
  state = result ?? draft;
  persist();
  listeners.forEach((fn) => fn(state, prev));
  return state;
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function resetDemo(): void {
  const prev = state;
  state = freshState();
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  persist();
  listeners.forEach((fn) => fn(state, prev));
}

/* ---------- Domain helpers ---------- */

export const lineKey = (productId: string, wood: string, fabric: string | null, size: SizeId): string =>
  [productId, wood, fabric ?? '-', size].join('|');

export function addToCart(line: Omit<CartLine, 'key' | 'qty'>, qty = 1): void {
  update((s) => {
    const key = lineKey(line.productId, line.wood, line.fabric, line.size);
    const existing = s.cart.find((l) => l.key === key);
    if (existing) existing.qty = Math.min(9, existing.qty + qty);
    else s.cart.unshift({ ...line, key, qty });
  });
}

export function cartCount(s: State = state): number {
  return s.cart.reduce((n, l) => n + l.qty, 0);
}

export function cartSubtotal(s: State = state): number {
  return s.cart.reduce((n, l) => n + l.qty * l.unitPrice, 0);
}

export function toggleWishlist(productId: string): boolean {
  let added = false;
  update((s) => {
    const i = s.wishlist.indexOf(productId);
    if (i >= 0) s.wishlist.splice(i, 1);
    else {
      s.wishlist.unshift(productId);
      added = true;
    }
  });
  return added;
}

export function pushNotice(notice: Omit<Notice, 'id' | 'read' | 'at'>, at: number): void {
  update((s) => {
    s.notices.unshift({ ...notice, id: `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, read: false, at });
    s.notices = s.notices.slice(0, 40);
  });
}

export function unreadCount(s: State = state): number {
  return s.notices.filter((n) => !n.read).length;
}

export function rememberRecent(productId: string): void {
  update((s) => {
    s.recent = [productId, ...s.recent.filter((id) => id !== productId)].slice(0, 8);
  });
}
