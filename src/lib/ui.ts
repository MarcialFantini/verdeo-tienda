/** Shared UI primitives used by the shell and every view: toasts, announcements, product thumbs. */
import { getProduct, getSize, type Selection } from '../data/catalog';
import { furnitureSvg } from './iso';
import { escapeHtml } from './page';

export interface ToastOptions {
  title: string;
  body?: string;
  href?: string;
  thumb?: { productId: string; selection?: Selection };
  action?: { label: string; run: () => void };
  duration?: number;
}

const CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';

export function thumbSvg(productId: string, selection?: Selection): string {
  const product = getProduct(productId);
  if (!product) return '';
  const size = getSize(product.kind, selection?.size ?? 'm');
  const wood = selection?.wood ?? product.defaultWood;
  const fabric = selection?.fabric ?? product.defaultFabric;
  const svg = furnitureSvg(product.kind, size, { label: '', pad: 4 }).replace('role="img" aria-label=""', 'aria-hidden="true"');
  return `<span class="mat" data-wood="${wood}" data-fabric="${fabric ?? ''}">${svg}</span>`;
}

export function toast(options: ToastOptions): void {
  const host = document.querySelector<HTMLElement>('[data-toasts]');
  if (!host) return;
  const node = document.createElement('div');
  node.className = options.thumb ? 'toast' : 'toast plain';
  const title = options.href
    ? `<a href="${options.href}">${escapeHtml(options.title)}</a>`
    : `<strong>${escapeHtml(options.title)}</strong>`;
  node.innerHTML = `${options.thumb ? `<span class="thumb">${thumbSvg(options.thumb.productId, options.thumb.selection)}</span>` : ''}<div>${title}${options.body ? `<small>${escapeHtml(options.body)}</small>` : ''}</div>`;
  if (options.action) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toast-action';
    btn.textContent = options.action.label;
    btn.style.width = 'auto';
    btn.style.padding = '0 8px';
    btn.style.textDecoration = 'underline';
    const run = options.action.run;
    btn.addEventListener('click', () => {
      run();
      dismiss();
    });
    node.append(btn);
  } else {
    const close = document.createElement('button');
    close.type = 'button';
    close.setAttribute('aria-label', 'Cerrar aviso');
    close.innerHTML = CLOSE;
    close.addEventListener('click', () => dismiss());
    node.append(close);
  }
  host.prepend(node);
  while (host.children.length > 3) host.lastElementChild?.remove();
  let gone = false;
  function dismiss(): void {
    if (gone) return;
    gone = true;
    node.classList.add('out');
    window.setTimeout(() => node.remove(), 320);
  }
  let remaining = options.duration ?? 5200;
  let started = Date.now();
  let timer = window.setTimeout(dismiss, remaining);
  node.addEventListener('pointerenter', () => {
    window.clearTimeout(timer);
    remaining -= Date.now() - started;
  });
  node.addEventListener('pointerleave', () => {
    started = Date.now();
    timer = window.setTimeout(dismiss, Math.max(1200, remaining));
  });
}

export function announce(message: string): void {
  const region = document.querySelector<HTMLElement>('[data-announce]');
  if (!region) return;
  region.textContent = '';
  window.setTimeout(() => {
    region.textContent = message;
  }, 40);
}

export function simClockLabel(clock: number): string {
  const total = clock + 8;
  const day = Math.floor(total / 24) + 1;
  const hour = Math.floor(total % 24);
  return `Día ${day} · ${String(hour).padStart(2, '0')}:00`;
}
