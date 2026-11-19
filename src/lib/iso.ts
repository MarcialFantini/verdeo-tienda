/**
 * Isometric furniture renderer. Every piece is a list of axis-aligned boxes (in cm),
 * projected to SVG polygons with three flat tones per material. Pure functions: used at
 * build time for static markup and in the browser when a size changes.
 */
import type { Kind } from '../data/catalog';

export type Mat = 'wood' | 'fabric' | 'dark';

export interface Box {
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
  h: number;
  mat: Mat;
  part: string;
  /** explode offset in cm, used by the assembly scene */
  ex?: [number, number, number];
}

export interface Dims {
  w: number;
  d: number;
  h: number;
}

const C = Math.cos(Math.PI / 6);
const S = 0.5;

export function project(x: number, y: number, z: number): [number, number] {
  return [(x - y) * C, (x + y) * S - z];
}

const b = (
  x: number, y: number, z: number, w: number, d: number, h: number,
  mat: Mat, part: string, ex?: [number, number, number],
): Box => (ex ? { x, y, z, w, d, h, mat, part, ex } : { x, y, z, w, d, h, mat, part });

function legs(w: number, d: number, size: number, height: number, inset = 0, z = 0): Box[] {
  const far = (n: number) => n - size - inset;
  return [
    b(inset, inset, z, size, size, height, 'wood', 'leg', [-30, -30, -40]),
    b(far(w), inset, z, size, size, height, 'wood', 'leg', [36, -30, -40]),
    b(inset, far(d), z, size, size, height, 'wood', 'leg', [-30, 36, -40]),
    b(far(w), far(d), z, size, size, height, 'wood', 'leg', [30, 30, -40]),
  ];
}

const SHAPES: Record<Kind, (dims: Dims) => Box[]> = {
  silla: ({ w, d, h }) => {
    const legH = Math.round(h * 0.53);
    const l = 4;
    return [
      ...legs(w, d, l, legH),
      b(0, 0, legH, w, d, 4, 'wood', 'seat', [0, 0, 0]),
      b(2, 7, legH + 4, w - 4, d - 9, 5, 'fabric', 'cushion', [16, 16, 40]),
      b(0, 0, legH + 4, l, l, h - legH - 4, 'wood', 'post', [-26, -30, 26]),
      b(w - l, 0, legH + 4, l, l, h - legH - 4, 'wood', 'post', [30, -26, 26]),
      b(l, 0, h - 16, w - 2 * l, 3, 13, 'wood', 'rail', [6, -44, 58]),
    ];
  },
  sillon: ({ w, d, h }) => {
    const arm = 13;
    const back = 18;
    return [
      ...legs(w, d, 5, 12, 3),
      b(0, 0, 12, w, d, 12, 'wood', 'frame', [0, 0, 0]),
      b(0, 0, 24, w, back, h - 24, 'fabric', 'back', [0, -30, 24]),
      b(0, back, 24, arm, d - back, 30, 'fabric', 'arm', [-30, 0, 14]),
      b(w - arm, back, 24, arm, d - back, 30, 'fabric', 'arm', [30, 0, 14]),
      b(arm, back, 24, w - 2 * arm, d - back - 2, 15, 'fabric', 'cushion', [0, 20, 40]),
    ];
  },
  banqueta: ({ w, d, h }) => [
    ...legs(w, d, 3.5, h - 4),
    b(3.5, d - 3.5, 22, w - 7, 3, 3, 'wood', 'rail', [0, 24, -10]),
    b(0, 0, h - 4, w, d, 4, 'wood', 'seat', [0, 0, 0]),
    b(2, 2, h, w - 4, d - 4, 4, 'fabric', 'cushion', [0, 0, 30]),
  ],
  mesa: ({ w, d, h }) => [
    ...legs(w, d, 7, h - 4, 6),
    b(0, 0, h - 4, w, d, 4, 'wood', 'top', [0, 0, 40]),
  ],
  ratona: ({ w, d, h }) => [
    ...legs(w, d, 5, h - 4),
    b(5, 5, 11, w - 10, d - 10, 3, 'wood', 'shelf', [0, 0, -16]),
    b(0, 0, h - 4, w, d, 4, 'wood', 'top', [0, 0, 30]),
  ],
  aparador: ({ w, d, h }) => {
    const doors = w >= 180 ? 4 : w >= 150 ? 3 : 2;
    const gap = 1.5;
    const dw = (w - 8 - gap * (doors - 1)) / doors;
    const fronts: Box[] = [];
    for (let i = 0; i < doors; i++) {
      const x = 4 + i * (dw + gap);
      fronts.push(b(x, d, 18, dw, 1.2, h - 26, 'wood', 'door', [0, 26, 0]));
      fronts.push(b(x + dw - 6, d + 1.2, h * 0.5, 2, 1.5, 9, 'dark', 'knob', [0, 34, 0]));
    }
    return [...legs(w, d, 4, 14, 4), b(0, 0, 14, w, d, h - 14, 'wood', 'body', [0, 0, 0]), ...fronts];
  },
  biblioteca: ({ w, d, h }) => {
    const shelves: Box[] = [];
    const count = 5;
    for (let i = 0; i < count; i++) {
      const z = i === count - 1 ? h - 2.5 : Math.round((h / (count - 1)) * i);
      shelves.push(b(3, 1.5, z, w - 6, d - 1.5, 2.5, 'wood', 'shelf', [0, 18, (i - 2) * 10]));
    }
    const books: Box[] = [
      b(8, 6, Math.round(h / 4) + 2.5, 14, d - 10, 26, 'dark', 'books', [0, 30, 0]),
      b(w - 30, 6, Math.round(h / 2) + 2.5, 20, d - 10, 22, 'dark', 'books', [0, 30, 0]),
    ];
    return [
      b(0, 0, 0, 3, d, h, 'wood', 'side', [-26, 0, 0]),
      b(3, 0, 0, w - 6, 1.5, h, 'wood', 'back', [0, -26, 0]),
      ...shelves,
      ...books,
      b(w - 3, 0, 0, 3, d, h, 'wood', 'side', [26, 0, 0]),
    ];
  },
  escritorio: ({ w, d, h }) => [
    ...legs(w, d, 4, h - 3),
    b(w - 52, 4, h - 16, 44, d - 8, 13, 'wood', 'drawer', [0, 26, 0]),
    b(w - 33, d - 4, h - 11, 6, 1.5, 2, 'dark', 'knob', [0, 34, 0]),
    b(0, 0, h - 3, w, d, 3, 'wood', 'top', [0, 0, 36]),
  ],
  cama: ({ w, d, h }) => [
    b(0, 0, 0, w, 6, h, 'wood', 'headboard', [0, -40, 20]),
    b(2, 8, 0, 6, 6, 10, 'wood', 'leg', [-14, 0, -30]),
    b(w - 8, 8, 0, 6, 6, 10, 'wood', 'leg', [14, 0, -30]),
    b(2, d - 8, 0, 6, 6, 10, 'wood', 'leg', [-14, 14, -30]),
    b(w - 8, d - 8, 0, 6, 6, 10, 'wood', 'leg', [14, 14, -30]),
    b(0, 6, 10, w, d - 6, 20, 'wood', 'frame', [0, 0, 0]),
    b(4, 8, 30, w - 8, d - 12, 22, 'fabric', 'mattress', [0, 0, 34]),
    b(10, 14, 52, w / 2 - 16, 34, 9, 'fabric', 'pillow', [0, 0, 60]),
    b(w / 2 + 6, 14, 52, w / 2 - 16, 34, 9, 'fabric', 'pillow', [0, 0, 60]),
  ],
  'mesa-de-luz': ({ w, d, h }) => [
    ...legs(w, d, 3.5, 14, 2),
    b(0, 0, 14, w, d, h - 14, 'wood', 'body', [0, 0, 0]),
    b(3, d, h - 19, w - 6, 1.2, 15, 'wood', 'drawer', [0, 28, 0]),
    b(w / 2 - 4, d + 1.2, h - 12, 8, 1.5, 2, 'dark', 'knob', [0, 36, 0]),
  ],
};

export function buildShape(kind: Kind, dims: Dims): Box[] {
  return sortBoxes(SHAPES[kind](dims));
}

/** Topological painter's order: a box separable behind another on any axis is drawn first. */
export function sortBoxes(boxes: Box[]): Box[] {
  const n = boxes.length;
  const eps = 0.01;
  const behind = (a: Box, c: Box): boolean =>
    a.x + a.w <= c.x + eps || a.y + a.d <= c.y + eps || a.z + a.h <= c.z + eps;
  const edges: number[][] = boxes.map(() => []);
  const indeg = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const a = boxes[i] as Box;
      const c = boxes[j] as Box;
      if (behind(a, c) && !behind(c, a)) {
        (edges[i] as number[]).push(j);
        indeg[j] = (indeg[j] ?? 0) + 1;
      }
    }
  }
  const key = (bx: Box) => bx.x + bx.w / 2 + bx.y + bx.d / 2 + bx.z + bx.h / 2;
  const ready = boxes.map((_, i) => i).filter((i) => indeg[i] === 0);
  const out: Box[] = [];
  const done = new Set<number>();
  while (out.length < n) {
    if (!ready.length) {
      // cycle (touching boxes): fall back to centre depth
      const rest = boxes.map((_, i) => i).filter((i) => !done.has(i));
      rest.sort((p, q) => key(boxes[p] as Box) - key(boxes[q] as Box));
      ready.push(rest[0] as number);
    }
    ready.sort((p, q) => key(boxes[q] as Box) - key(boxes[p] as Box));
    const i = ready.pop() as number;
    if (done.has(i)) continue;
    done.add(i);
    out.push(boxes[i] as Box);
    for (const j of edges[i] as number[]) {
      indeg[j] = (indeg[j] ?? 0) - 1;
      if (indeg[j] === 0 && !done.has(j)) ready.push(j);
    }
  }
  return out;
}

const pt = (x: number, y: number, z: number): string => {
  const [sx, sy] = project(x, y, z);
  return `${sx.toFixed(1)},${sy.toFixed(1)}`;
};

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function boundsOf(boxes: Box[], explode = 0): Bounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const bx of boxes) {
    const [ex, ey, ez] = bx.ex ?? [0, 0, 0];
    for (const [x, y, z] of [
      [bx.x, bx.y, bx.z], [bx.x + bx.w, bx.y, bx.z], [bx.x, bx.y + bx.d, bx.z], [bx.x + bx.w, bx.y + bx.d, bx.z],
      [bx.x, bx.y, bx.z + bx.h], [bx.x + bx.w, bx.y, bx.z + bx.h], [bx.x, bx.y + bx.d, bx.z + bx.h], [bx.x + bx.w, bx.y + bx.d, bx.z + bx.h],
    ] as const) {
      const [sx, sy] = project(x + ex * explode, y + ey * explode, z + ez * explode);
      minX = Math.min(minX, sx);
      minY = Math.min(minY, sy);
      maxX = Math.max(maxX, sx);
      maxY = Math.max(maxY, sy);
    }
  }
  return { minX, minY, maxX, maxY };
}

const MAT_CLASS: Record<Mat, string> = { wood: 'w', fabric: 'f', dark: 'k' };

/** Inner SVG markup (one <g> per box). Faces use classes like `w1 w2 w3` styled by CSS variables. */
export function boxesMarkup(boxes: Box[], options: { explodeData?: boolean } = {}): string {
  return boxes
    .map((bx) => {
      const m = MAT_CLASS[bx.mat];
      const { x, y, z, w, d, h } = bx;
      const top = [pt(x, y, z + h), pt(x + w, y, z + h), pt(x + w, y + d, z + h), pt(x, y + d, z + h)].join(' ');
      const left = [pt(x, y + d, z), pt(x + w, y + d, z), pt(x + w, y + d, z + h), pt(x, y + d, z + h)].join(' ');
      const right = [pt(x + w, y, z), pt(x + w, y + d, z), pt(x + w, y + d, z + h), pt(x + w, y, z + h)].join(' ');
      let attrs = ` data-part="${bx.part}"`;
      if (options.explodeData && bx.ex) {
        const [ex, ey, ez] = bx.ex;
        const [sx, sy] = project(ex, ey, ez);
        attrs += ` style="--ex:${sx.toFixed(1)}px;--ey:${sy.toFixed(1)}px"`;
      }
      return `<g${attrs}><polygon class="${m}2" points="${left}"/><polygon class="${m}3" points="${right}"/><polygon class="${m}1" points="${top}"/></g>`;
    })
    .join('');
}

export function viewBoxFor(bounds: Bounds, pad = 8): string {
  const x = Math.floor(bounds.minX - pad);
  const y = Math.floor(bounds.minY - pad);
  const w = Math.ceil(bounds.maxX - bounds.minX + pad * 2);
  const h = Math.ceil(bounds.maxY - bounds.minY + pad * 2);
  return `${x} ${y} ${w} ${h}`;
}

/** Full standalone SVG string. */
export function furnitureSvg(kind: Kind, dims: Dims, opts: { label: string; pad?: number; explode?: boolean }): string {
  const boxes = buildShape(kind, dims);
  const bounds = boundsOf(boxes, 0);
  if (opts.explode) {
    const e = boundsOf(boxes, 1);
    bounds.minX = Math.min(bounds.minX, e.minX);
    bounds.minY = Math.min(bounds.minY, e.minY);
    bounds.maxX = Math.max(bounds.maxX, e.maxX);
    bounds.maxY = Math.max(bounds.maxY, e.maxY);
  }
  return `<svg class="iso${opts.explode ? ' explodable' : ''}" viewBox="${viewBoxFor(bounds, opts.pad ?? 8)}" role="img" aria-label="${opts.label}" preserveAspectRatio="xMidYMid meet">${boxesMarkup(boxes, { explodeData: opts.explode ?? false })}</svg>`;
}

/** Front elevation (x/z) rectangles, for the measures comparison. */
export function elevationRects(kind: Kind, dims: Dims): { x: number; y: number; w: number; h: number; mat: Mat }[] {
  const boxes = SHAPES[kind](dims);
  return boxes
    .filter((bx) => bx.mat !== 'dark')
    .map((bx) => ({ x: bx.x, y: dims.h - (bx.z + bx.h), w: bx.w, h: bx.h, mat: bx.mat }));
}
