/** Rolling-digit price display. Only transforms move. */
const DIGITS = '0123456789';

export function renderOdometer(el: HTMLElement, value: string, animate = true): void {
  const chars = [...value];
  const current = el.dataset['odoShape'];
  const shape = chars.map((c) => (DIGITS.includes(c) ? 'd' : c)).join('');
  if (current !== shape) {
    el.innerHTML = chars
      .map((c) =>
        DIGITS.includes(c)
          ? `<span class="odo-d" aria-hidden="true"><span class="odo-strip">${[...DIGITS].map((d) => `<span>${d}</span>`).join('')}</span></span>`
          : `<span class="odo-c" aria-hidden="true">${c === ' ' ? '&nbsp;' : c}</span>`,
      )
      .join('') + `<span class="sr-only">${value}</span>`;
    el.dataset['odoShape'] = shape;
    if (animate) {
      // start from zero so the new layout also rolls
      el.querySelectorAll<HTMLElement>('.odo-strip').forEach((s) => (s.style.transform = 'translateY(0)'));
      void el.offsetWidth;
    }
  }
  const strips = el.querySelectorAll<HTMLElement>('.odo-strip');
  let i = 0;
  chars.forEach((c) => {
    if (!DIGITS.includes(c)) return;
    const strip = strips[i++];
    if (strip) {
      strip.style.transitionDelay = animate ? `${(strips.length - i) * 35}ms` : '0ms';
      strip.style.transform = `translateY(-${Number(c) * 10}%)`;
    }
  });
  const sr = el.querySelector('.sr-only');
  if (sr) sr.textContent = value;
}
