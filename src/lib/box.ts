/**
 * Isometric shipping box with four animated flaps. Geometry in cm, projected like the furniture.
 */
import { getProduct, getSize, getWood, type SizeId } from '../data/catalog';
import { boxesMarkup, buildShape, project } from './iso';

export interface BoxDims {
  W: number;
  D: number;
  H: number;
}

const P = (x: number, y: number, z: number): string => {
  const [sx, sy] = project(x, y, z);
  return `${sx.toFixed(1)},${sy.toFixed(1)}`;
};

export const boxFor = (w: number, d: number, h: number): BoxDims => ({ W: Math.round(w + 10), D: Math.round(d + 10), H: Math.round(h + 6) });

export function wallPoints(b: BoxDims) {
  const { W, D, H } = b;
  return {
    innerLeft: [P(0, 0, 0), P(0, D, 0), P(0, D, H), P(0, 0, H)].join(' '),
    innerBack: [P(0, 0, 0), P(W, 0, 0), P(W, 0, H), P(0, 0, H)].join(' '),
    floor: [P(0, 0, 0), P(W, 0, 0), P(W, D, 0), P(0, D, 0)].join(' '),
    front: [P(0, D, 0), P(W, D, 0), P(W, D, H), P(0, D, H)].join(' '),
    right: [P(W, 0, 0), P(W, D, 0), P(W, D, H), P(W, 0, H)].join(' '),
  };
}

export type FlapId = 'left' | 'right' | 'back' | 'front';

/**
 * Flap polygon for an angle in degrees: -110 = open and leaning out, 0 = upright, 90 = closed flat.
 */
export function flapPoints(b: BoxDims, id: FlapId, angle: number): string {
  const { W, D, H } = b;
  const t = (angle * Math.PI) / 180;
  const up = Math.cos(t);
  const inward = Math.sin(t);
  switch (id) {
    case 'left': {
      const L = W / 2;
      const dx = L * inward;
      const dz = L * up;
      return [P(0, 0, H), P(0, D, H), P(dx, D, H + dz), P(dx, 0, H + dz)].join(' ');
    }
    case 'right': {
      const L = W / 2;
      const dx = -L * inward;
      const dz = L * up;
      return [P(W, 0, H), P(W, D, H), P(W + dx, D, H + dz), P(W + dx, 0, H + dz)].join(' ');
    }
    case 'back': {
      const L = D / 2;
      const dy = L * inward;
      const dz = L * up;
      return [P(0, 0, H), P(W, 0, H), P(W, dy, H + dz), P(0, dy, H + dz)].join(' ');
    }
    case 'front': {
      const L = D / 2;
      const dy = -L * inward;
      const dz = L * up;
      return [P(0, D, H), P(W, D, H), P(W, D + dy, H + dz), P(0, D + dy, H + dz)].join(' ');
    }
  }
}

export function tapePoints(b: BoxDims): string {
  const { W, D, H } = b;
  const half = 4;
  return [P(W / 2 - half, 0, H + 0.6), P(W / 2 + half, 0, H + 0.6), P(W / 2 + half, D, H + 0.6), P(W / 2 - half, D, H + 0.6)].join(' ');
}

/** Affine matrix that maps (u right, v down) onto the front face (y = D). */
export function frontFaceMatrix(b: BoxDims): string {
  const C = Math.cos(Math.PI / 6);
  const [ox, oy] = project(0, b.D, b.H);
  return `matrix(${C.toFixed(4)} 0.5 0 1 ${ox.toFixed(1)} ${oy.toFixed(1)})`;
}

export function boxViewBox(b: BoxDims, dropHeight: number): string {
  const pts = [project(0, b.D + b.D / 2, 0), project(b.W + b.W / 2, 0, 0), project(0, 0, b.H + dropHeight), project(b.W, b.D, 0), project(b.W / 2, b.D / 2, b.H + b.D / 2 + 8), project(-b.W / 2, 0, b.H)];
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const pad = 12;
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  return `${Math.floor(minX)} ${Math.floor(minY)} ${Math.ceil(Math.max(...xs) - minX + pad)} ${Math.ceil(Math.max(...ys) - minY + pad)}`;
}

export interface BoxSceneOptions {
  productId: string;
  size: SizeId;
  wood: string;
  fabric: string | null;
  to: string;
  city: string;
  id: string;
}

const esc = (t: string): string =>
  t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c);

/** Full SVG markup of the packing scene plus its geometry. Shared by the server and the browser. */
export function boxSceneSvg(o: BoxSceneOptions): { svg: string; geo: BoxDims & { drop: number } } {
  const product = getProduct(o.productId);
  if (!product) return { svg: '', geo: { W: 0, D: 0, H: 0, drop: 0 } };
  const dims = getSize(product.kind, o.size);
  const box = boxFor(dims.w, dims.d, dims.h);
  const walls = wallPoints(box);
  const drop = Math.max(80, dims.h * 1.1);
  const [ox, oy] = project(5, 5, 3);
  const fs = Math.max(4.2, Math.min(box.W, 90) * 0.075);
  const labelW = box.W * 0.62;
  const labelH = fs * 4.6;
  const lu = box.W * 0.3;
  const lv = box.H * 0.3;
  const flap = (id: FlapId, cls: string) => `<polygon class="${cls}" data-flap="${id}" points="${flapPoints(box, id, 90)}"/>`;
  const text = (dy: number, size: number, body: string, cls = '') =>
    `<text x="${(lu + fs * 0.8).toFixed(1)}" y="${(lv + fs * dy).toFixed(1)}" font-size="${(fs * size).toFixed(2)}"${cls ? ` class="${cls}"` : ''}>${body}</text>`;
  const svg = [
    `<svg class="iso box-svg" viewBox="${boxViewBox(box, drop)}" role="img" aria-labelledby="${o.id}-t">`,
    `<title id="${o.id}-t">${esc(product.name)} entrando en su caja, que se cierra y se etiqueta</title>`,
    `<polygon class="bx-in-a" points="${walls.innerBack}"/><polygon class="bx-in-b" points="${walls.innerLeft}"/><polygon class="bx-floor" points="${walls.floor}"/>`,
    `<g transform="translate(${ox.toFixed(1)} ${oy.toFixed(1)})"><g data-drop data-wood="${o.wood}" data-fabric="${o.fabric ?? ''}">${boxesMarkup(buildShape(product.kind, dims))}</g></g>`,
    `<polygon class="bx-front" points="${walls.front}"/><polygon class="bx-right" points="${walls.right}"/>`,
    flap('left', 'bx-flap-a') + flap('right', 'bx-flap-b') + flap('back', 'bx-flap-c') + flap('front', 'bx-flap-d'),
    `<polygon class="bx-tape" data-tape points="${tapePoints(box)}"/>`,
    `<g transform="${frontFaceMatrix(box)}"><g data-label class="bx-label">`,
    `<rect x="${lu.toFixed(1)}" y="${lv.toFixed(1)}" width="${labelW.toFixed(1)}" height="${labelH.toFixed(1)}" class="bx-label-bg"/>`,
    text(1.4, 0.92, 'Río Luján · Tucumán', 'bx-label-strong'),
    text(2.6, 0.8, `Para ${esc(o.to)}, ${esc(o.city)}`),
    text(3.7, 0.8, `${esc(product.name)} · ${esc(getWood(o.wood).name)}`),
    `</g></g></svg>`,
  ].join('');
  return { svg, geo: { ...box, drop } };
}
