/**
 * Fictional catalogue for Muebles Río Luján (demo).
 * Generated from a fixed seed so the server build and the browser produce the same 60 products.
 */
import { hashString, mulberry32, shuffle } from '../lib/prng';

export const SEED = 20260919;

export type Kind =
  | 'silla'
  | 'sillon'
  | 'banqueta'
  | 'mesa'
  | 'ratona'
  | 'aparador'
  | 'biblioteca'
  | 'escritorio'
  | 'cama'
  | 'mesa-de-luz';

export type Room = 'living' | 'comedor' | 'dormitorio' | 'estudio';
export type SizeId = 's' | 'm' | 'l';

export interface Tone {
  /** top face, left-front face, right-front face */
  readonly t: string;
  readonly l: string;
  readonly r: string;
}

export interface Wood extends Tone {
  readonly id: string;
  readonly name: string;
  readonly note: string;
  readonly factor: number;
}

export interface Fabric extends Tone {
  readonly id: string;
  readonly name: string;
  readonly note: string;
  readonly factor: number;
}

export interface SizeOption {
  readonly id: SizeId;
  readonly label: string;
  readonly w: number;
  readonly d: number;
  readonly h: number;
  readonly factor: number;
}

export interface KindSpec {
  readonly id: Kind;
  readonly label: string;
  readonly plural: string;
  readonly room: Room;
  readonly basePrice: number;
  readonly days: number;
  readonly hasFabric: boolean;
  readonly sizes: readonly SizeOption[];
  readonly blurb: string;
}

export interface Product {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly kind: Kind;
  readonly kindLabel: string;
  readonly line: string;
  readonly room: Room;
  readonly woods: readonly string[];
  readonly fabrics: readonly string[];
  readonly defaultWood: string;
  readonly defaultFabric: string | null;
  readonly basePrice: number;
  readonly days: number;
  readonly stock: number;
  readonly popularity: number;
  readonly isNew: boolean;
  readonly description: string;
  readonly order: number;
}

export interface Selection {
  wood: string;
  fabric: string | null;
  size: SizeId;
}

export const WOODS: readonly Wood[] = [
  { id: 'paraiso', name: 'Paraíso', note: 'Clara, de veta suave', factor: 1, t: '#E6CDA4', l: '#CDAB7D', r: '#B79165' },
  { id: 'cedro', name: 'Cedro tucumano', note: 'Rojiza y aromática', factor: 1.14, t: '#CF946A', l: '#B4784F', r: '#98603B' },
  { id: 'nogal', name: 'Nogal criollo', note: 'Oscura y densa', factor: 1.26, t: '#8E684A', l: '#735139', r: '#5B3E2A' },
  { id: 'guatambu', name: 'Guatambú', note: 'Casi blanca, muy firme', factor: 1.08, t: '#EEE2C6', l: '#D8C6A2', r: '#C1AD86' },
];

export const FABRICS: readonly Fabric[] = [
  { id: 'lino', name: 'Lino crudo', note: 'Fresco, se lava a mano', factor: 1, t: '#E4DCCB', l: '#CFC4AF', r: '#B9AD96' },
  { id: 'pana', name: 'Pana verde bosque', note: 'Suave, de pelo corto', factor: 1.1, t: '#46745A', l: '#335D46', r: '#264A37' },
  { id: 'cuero', name: 'Cuero suela', note: 'Curtido vegetal', factor: 1.32, t: '#AE6E41', l: '#925732', r: '#774423' },
  { id: 'boucle', name: 'Bouclé hueso', note: 'Con textura de rulo', factor: 1.18, t: '#F3EDE2', l: '#DED6C8', r: '#C9C0B0' },
  { id: 'piedra', name: 'Gris piedra', note: 'Trama cerrada', factor: 1.05, t: '#ABA79F', l: '#928E86', r: '#7B7770' },
];

export const DARK: Tone = { t: '#4A4239', l: '#3A332C', r: '#2C2621' };

export const ROOMS: Readonly<Record<Room, string>> = {
  living: 'Living',
  comedor: 'Comedor',
  dormitorio: 'Dormitorio',
  estudio: 'Estudio',
};

const sz = (id: SizeId, label: string, w: number, d: number, h: number, factor: number): SizeOption => ({
  id,
  label,
  w,
  d,
  h,
  factor,
});

export const KINDS: Readonly<Record<Kind, KindSpec>> = {
  silla: {
    id: 'silla', label: 'Silla', plural: 'Sillas', room: 'comedor', basePrice: 312000, days: 15, hasFabric: true,
    sizes: [sz('s', 'Compacta', 42, 46, 80, 0.94), sz('m', 'Estándar', 46, 50, 84, 1), sz('l', 'Ancha', 52, 54, 86, 1.12)],
    blurb: 'Asiento tapizado sobre estructura de cuatro patas con respaldo de travesaño.',
  },
  sillon: {
    id: 'sillon', label: 'Sillón', plural: 'Sillones', room: 'living', basePrice: 1180000, days: 18, hasFabric: true,
    sizes: [sz('s', 'Un cuerpo', 78, 80, 78, 0.9), sz('m', 'Dos cuerpos', 150, 84, 80, 1), sz('l', 'Tres cuerpos', 206, 88, 80, 1.28)],
    blurb: 'Bastidor de madera maciza con almohadones de espuma y pluma.',
  },
  banqueta: {
    id: 'banqueta', label: 'Banqueta', plural: 'Banquetas', room: 'comedor', basePrice: 238000, days: 12, hasFabric: true,
    sizes: [sz('s', 'Baja', 36, 36, 48, 0.9), sz('m', 'Media', 38, 38, 65, 1), sz('l', 'Alta', 40, 40, 76, 1.08)],
    blurb: 'Banqueta de apoyo con travesaño para los pies y asiento tapizado.',
  },
  mesa: {
    id: 'mesa', label: 'Mesa', plural: 'Mesas', room: 'comedor', basePrice: 1460000, days: 15, hasFabric: false,
    sizes: [sz('s', '4 personas', 140, 85, 75, 0.88), sz('m', '6 personas', 180, 90, 75, 1), sz('l', '8 personas', 220, 95, 75, 1.22)],
    blurb: 'Tapa maciza de 4 cm sobre patas escuadradas, unidas a caja y espiga.',
  },
  ratona: {
    id: 'ratona', label: 'Mesa ratona', plural: 'Mesas ratonas', room: 'living', basePrice: 524000, days: 12, hasFabric: false,
    sizes: [sz('s', 'Chica', 90, 55, 40, 0.9), sz('m', 'Mediana', 110, 60, 42, 1), sz('l', 'Grande', 130, 70, 42, 1.14)],
    blurb: 'Mesa baja con estante inferior para revistas y mantas.',
  },
  aparador: {
    id: 'aparador', label: 'Aparador', plural: 'Aparadores', room: 'living', basePrice: 1640000, days: 18, hasFabric: false,
    sizes: [sz('s', 'Dos puertas', 120, 45, 80, 0.86), sz('m', 'Tres puertas', 160, 45, 80, 1), sz('l', 'Cuatro puertas', 200, 48, 82, 1.2)],
    blurb: 'Cuerpo de tablero macizo con puertas batientes y tiradores de hierro.',
  },
  biblioteca: {
    id: 'biblioteca', label: 'Biblioteca', plural: 'Bibliotecas', room: 'estudio', basePrice: 968000, days: 15, hasFabric: false,
    sizes: [sz('s', 'Angosta', 70, 34, 180, 0.86), sz('m', 'Estándar', 90, 35, 190, 1), sz('l', 'Ancha', 120, 36, 200, 1.18)],
    blurb: 'Cinco estantes regulables con fondo macizo, sin herrajes a la vista.',
  },
  escritorio: {
    id: 'escritorio', label: 'Escritorio', plural: 'Escritorios', room: 'estudio', basePrice: 884000, days: 15, hasFabric: false,
    sizes: [sz('s', 'Compacto', 110, 58, 75, 0.9), sz('m', 'Estándar', 130, 65, 75, 1), sz('l', 'Amplio', 160, 72, 75, 1.16)],
    blurb: 'Tapa de trabajo con cajón lateral y patas rectas.',
  },
  cama: {
    id: 'cama', label: 'Cama', plural: 'Camas', room: 'dormitorio', basePrice: 1920000, days: 20, hasFabric: true,
    sizes: [sz('s', '1½ plaza', 110, 200, 100, 0.8), sz('m', '2 plazas', 150, 200, 104, 1), sz('l', 'Queen', 170, 205, 108, 1.14)],
    blurb: 'Respaldo macizo y base de tablas; el textil de la ropa de cama se elige aparte.',
  },
  'mesa-de-luz': {
    id: 'mesa-de-luz', label: 'Mesa de luz', plural: 'Mesas de luz', room: 'dormitorio', basePrice: 296000, days: 12, hasFabric: false,
    sizes: [sz('s', 'Chica', 40, 35, 50, 0.92), sz('m', 'Mediana', 45, 40, 55, 1), sz('l', 'Grande', 55, 42, 58, 1.1)],
    blurb: 'Cajón con correderas de madera y patas cortas.',
  },
};

/** Tucumán places, one per collection line. */
const LINES = [
  'Tafí', 'Raco', 'Lules', 'Amaicha', 'Colalao', 'Trancas',
  'Simoca', 'Famaillá', 'Aconquija', 'Cadillal', 'San Javier', 'Anfama',
] as const;

const KIND_ORDER: readonly Kind[] = [
  'silla', 'sillon', 'banqueta', 'mesa', 'ratona',
  'aparador', 'biblioteca', 'escritorio', 'cama', 'mesa-de-luz',
];

const LINE_NOTES: readonly string[] = [
  'Dibujada con cantos redondeados, pensada para el uso de todos los días.',
  'De líneas rectas y uniones vistas, como los muebles de taller de antes.',
  'Proporciones bajas y anchas, para ambientes con mucha luz.',
  'Con patas levemente inclinadas y un perfil liviano.',
  'Robusta, con secciones generosas y lustre al aceite.',
  'Minimalista: sin molduras, solo madera bien escuadrada.',
];

const slugify = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

function generate(): Product[] {
  const rand = mulberry32(SEED);
  const list: Product[] = [];
  LINES.forEach((line, li) => {
    // Even lines carry seating, odd lines carry storage and bedroom pieces.
    const kinds = KIND_ORDER.slice((li % 2) * 5, (li % 2) * 5 + 5);
    kinds.forEach((kind) => {
      const spec = KINDS[kind];
      const woodCount = 2 + Math.floor(rand() * 3);
      const woods = shuffle(rand, WOODS.map((w) => w.id)).slice(0, woodCount);
      const fabrics = spec.hasFabric ? shuffle(rand, FABRICS.map((f) => f.id)).slice(0, 3 + Math.floor(rand() * 3)) : [];
      const name = `${spec.label} ${line}`;
      const variance = 0.86 + rand() * 0.32;
      const basePrice = Math.round((spec.basePrice * variance) / 1000) * 1000;
      const days = Math.max(10, spec.days + Math.round((rand() - 0.5) * 4));
      const order = list.length;
      list.push({
        id: `rl-${String(order + 1).padStart(3, '0')}`,
        slug: slugify(name),
        name,
        kind,
        kindLabel: spec.label,
        line,
        room: spec.room,
        woods,
        fabrics,
        defaultWood: woods[0] ?? 'paraiso',
        defaultFabric: fabrics[0] ?? null,
        basePrice,
        days,
        stock: 2 + Math.floor(rand() * 12),
        popularity: 0.25 + rand() * 0.75,
        isNew: rand() < 0.18,
        description: `${spec.blurb} ${LINE_NOTES[li % LINE_NOTES.length] ?? ''}`,
        order,
      });
    });
  });
  return list;
}

export const PRODUCTS: readonly Product[] = generate();

const byId = new Map(PRODUCTS.map((p) => [p.id, p]));
const bySlug = new Map(PRODUCTS.map((p) => [p.slug, p]));

export const getProduct = (id: string): Product | undefined => byId.get(id);
export const getProductBySlug = (slug: string): Product | undefined => bySlug.get(slug);
export const getWood = (id: string): Wood => WOODS.find((w) => w.id === id) ?? (WOODS[0] as Wood);
export const getFabric = (id: string | null): Fabric | null => (id ? FABRICS.find((f) => f.id === id) ?? null : null);
export const getSize = (kind: Kind, size: SizeId): SizeOption => {
  const sizes = KINDS[kind].sizes;
  return sizes.find((s) => s.id === size) ?? (sizes[1] as SizeOption);
};

export function priceFor(product: Product, sel: Selection): number {
  const wood = getWood(sel.wood).factor;
  const fabric = getFabric(sel.fabric)?.factor ?? 1;
  const size = getSize(product.kind, sel.size).factor;
  return Math.round((product.basePrice * wood * fabric * size) / 500) * 500;
}

export function defaultSelection(product: Product): Selection {
  return { wood: product.defaultWood, fabric: product.defaultFabric, size: 'm' };
}

export function describeSelection(product: Product, sel: Selection): string {
  const parts = [getWood(sel.wood).name];
  const fabric = getFabric(sel.fabric);
  if (fabric) parts.push(fabric.name.toLowerCase());
  parts.push(getSize(product.kind, sel.size).label.toLowerCase());
  return parts.join(' · ');
}

/** Five production stages; share of the total days each one takes. */
export const STAGES = [
  { id: 'corte', name: 'Corte', share: 0.2, text: 'Se eligen las tablas y se cortan a medida con la veta a favor.' },
  { id: 'lijado', name: 'Lijado', share: 0.2, text: 'Tres pasadas de lija, de grano 80 a 220, hasta que la madera queda tibia al tacto.' },
  { id: 'armado', name: 'Armado', share: 0.27, text: 'Uniones a caja y espiga, encoladas y prensadas durante la noche.' },
  { id: 'laca', name: 'Laca', share: 0.2, text: 'Dos manos de laca al agua con lijado suave entre una y otra.' },
  { id: 'embalaje', name: 'Control y embalaje', share: 0.13, text: 'Revisión pieza por pieza, cantos protegidos y caja de cartón doble.' },
] as const;

export type StageId = (typeof STAGES)[number]['id'];

/** Integer day boundaries for each stage of a product with `days` total. */
export function stagePlan(days: number): { id: StageId; name: string; text: string; from: number; to: number }[] {
  let cursor = 0;
  return STAGES.map((stage, i) => {
    const span = i === STAGES.length - 1 ? days - cursor : Math.max(1, Math.round(days * stage.share));
    const from = cursor + 1;
    cursor += span;
    return { id: stage.id, name: stage.name, text: stage.text, from, to: cursor };
  });
}

export function relatedProducts(product: Product, count = 4): Product[] {
  const rand = mulberry32(hashString(product.id));
  const sameRoom = PRODUCTS.filter((p) => p.id !== product.id && (p.room === product.room || p.line === product.line));
  return shuffle(rand, sameRoom).slice(0, count);
}
