/**
 * Showcase mode (?showcase): a hands-free ~24 s loop through every scene on the home page,
 * for recording the portfolio video. Runs on an in-memory store, so it never touches the
 * visitor's saved session, and hides the cursor via the `.showcase` class.
 */
import { loadGsap } from '../lib/gsap';

const LOOP_SECONDS = 24;

function top(el: Element | null): number {
  if (!el) return 0;
  const header = (document.querySelector('.site-header') as HTMLElement | null)?.offsetHeight ?? 0;
  return el.getBoundingClientRect().top + window.scrollY - header;
}

function pickRadio(form: Element | null, kind: string, index: number): void {
  const inputs = Array.from(form?.querySelectorAll<HTMLInputElement>(`input[data-kind="${kind}"]`) ?? []);
  const input = inputs[index % Math.max(1, inputs.length)];
  if (!input) return;
  input.checked = true;
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

export async function runShowcase(): Promise<void> {
  const gsap = await loadGsap();
  document.documentElement.classList.add('showcase');
  const veil = document.createElement('div');
  veil.className = 'showcase-veil';
  document.body.append(veil);

  const hero = document.querySelector('[data-hero]');
  const cfg = document.querySelector('#configurador');
  const form = cfg?.querySelector('[data-configurator]') ?? null;
  const room = document.querySelector<HTMLElement>('[data-room="home-room"]');
  const roomSection = document.querySelector('.home-room');
  const production = document.querySelector<HTMLElement>('.home-production [data-production]');
  const boxSection = document.querySelector('.home-box');
  const box = document.querySelector<HTMLElement>('[data-box="home-box"]');
  const shipSection = document.querySelector('.home-ship');
  const ship = document.querySelector<HTMLElement>('[data-ship="home-map"]');

  const scroller = { y: 0 };
  const scrollTo = (y: number, duration: number) =>
    gsap.to(scroller, { y, duration, ease: 'power2.inOut', onUpdate: () => window.scrollTo(0, scroller.y) });

  const build = () => {
    const vh = window.innerHeight;
    const heroEnd = top(hero) + vh * 0.9;
    const tl = gsap.timeline({ onComplete: () => void restart() });
    const prod = { p: 0 };
    const roomPos = { x: 40, y: 200 };
    tl.call(() => {
      window.scrollTo(0, 0);
      scroller.y = 0;
    })
      .to(veil, { opacity: 0, duration: 0.6 })
      .add(scrollTo(heroEnd, 3.2), 1.1)
      .add(scrollTo(top(cfg) + vh * 0.12, 1.2), '>-0.2')
      .call(() => pickRadio(form, 'wood', 1), [], '>')
      .call(() => pickRadio(form, 'fabric', 1), [], '>+0.8')
      .call(() => pickRadio(form, 'wood', 2), [], '>+0.8')
      .call(() => pickRadio(form, 'size', 2), [], '>+0.7')
      .call(() => pickRadio(form, 'wood', 3), [], '>+0.7')
      .add(scrollTo(top(roomSection) + 40, 1.1), '>+0.5')
      .to(roomPos, {
        keyframes: [{ x: 210, y: 40, duration: 1.2 }, { x: 120, y: 170, duration: 1 }],
        ease: 'power1.inOut',
        onUpdate: () => room?.dispatchEvent(new CustomEvent('room:move', { detail: { x: Math.round(roomPos.x / 5) * 5, y: Math.round(roomPos.y / 5) * 5 } })),
      }, '>-0.2')
      .add(scrollTo(top(production) - 10, 1), '>')
      .to(prod, {
        p: 1,
        duration: 3,
        ease: 'none',
        onUpdate: () => production?.dispatchEvent(new CustomEvent('production:set', { detail: { progress: prod.p, playing: false } })),
      }, '>-0.3')
      .add(scrollTo(top(boxSection), 1), '>+0.2')
      .call(() => box?.dispatchEvent(new CustomEvent('box:play')), [], '>-0.2')
      .add(scrollTo(window.innerWidth < 960 ? top(ship?.querySelector('.ship-days') ?? shipSection) - 40 : top(shipSection) + 20, 1), '>+2.6')
      .call(() => ship?.dispatchEvent(new CustomEvent('ship:go', { detail: 'santacruz' })), [], '>')
      .call(() => ship?.dispatchEvent(new CustomEvent('ship:go', { detail: 'misiones' })), [], '>+2.4')
      .to(veil, { opacity: 1, duration: 0.6 }, '>+2');
    const length = tl.duration();
    if (length > LOOP_SECONDS + 2) tl.timeScale(length / LOOP_SECONDS);
    return tl;
  };

  let tl = build();
  async function restart(): Promise<void> {
    tl.kill();
    pickRadio(form, 'wood', 0);
    pickRadio(form, 'fabric', 0);
    pickRadio(form, 'size', 1);
    await new Promise((r) => window.setTimeout(r, 200));
    tl = build();
  }
}
