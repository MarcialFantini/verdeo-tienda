/**
 * Simplified map of Argentina for the shipping scene.
 * Coarse hand-made outline (lon, lat) and the capital of each province. Illustrative only.
 */

const MAINLAND: readonly [number, number][] = [
  [-65.7, -22.1], [-64.3, -22.8], [-62.8, -22.0], [-61.6, -23.3], [-59.9, -24.1], [-58.3, -24.9],
  [-57.6, -25.4], [-56.2, -27.4], [-55.4, -27.3], [-54.6, -25.6], [-53.7, -26.2], [-53.8, -27.3],
  [-55.6, -28.2], [-57.6, -30.2], [-58.2, -32.4], [-58.4, -33.9], [-57.4, -35.2], [-56.7, -36.4],
  [-57.5, -38.1], [-60.0, -38.8], [-62.2, -38.9], [-62.3, -40.5], [-65.0, -40.8], [-64.2, -42.2],
  [-65.0, -42.9], [-64.9, -44.9], [-67.5, -46.0], [-65.8, -47.8], [-67.7, -49.3], [-69.2, -51.6],
  [-68.4, -52.4], [-71.9, -52.0], [-72.3, -51.0], [-73.2, -49.5], [-72.0, -48.0], [-71.7, -46.0],
  [-71.8, -44.0], [-71.5, -42.0], [-71.6, -40.0], [-71.0, -38.0], [-70.4, -36.2], [-70.0, -34.0],
  [-70.0, -32.6], [-69.8, -30.0], [-68.8, -27.0], [-68.4, -25.0], [-67.0, -23.0], [-66.7, -22.4],
];

const FUEGO: readonly [number, number][] = [
  [-68.6, -52.6], [-66.4, -54.0], [-65.1, -54.9], [-68.6, -54.9],
];

export interface Province {
  readonly id: string;
  readonly name: string;
  readonly capital: string;
  readonly lon: number;
  readonly lat: number;
}

export const PROVINCES: readonly Province[] = [
  { id: 'tucuman', name: 'Tucumán', capital: 'San Miguel de Tucumán', lon: -65.2, lat: -26.8 },
  { id: 'salta', name: 'Salta', capital: 'Salta', lon: -65.4, lat: -24.8 },
  { id: 'jujuy', name: 'Jujuy', capital: 'San Salvador de Jujuy', lon: -65.3, lat: -24.2 },
  { id: 'catamarca', name: 'Catamarca', capital: 'San Fernando del Valle', lon: -65.8, lat: -28.5 },
  { id: 'santiago', name: 'Santiago del Estero', capital: 'Santiago del Estero', lon: -64.3, lat: -27.8 },
  { id: 'larioja', name: 'La Rioja', capital: 'La Rioja', lon: -66.85, lat: -29.4 },
  { id: 'sanjuan', name: 'San Juan', capital: 'San Juan', lon: -68.5, lat: -31.5 },
  { id: 'mendoza', name: 'Mendoza', capital: 'Mendoza', lon: -68.8, lat: -32.9 },
  { id: 'sanluis', name: 'San Luis', capital: 'San Luis', lon: -66.3, lat: -33.3 },
  { id: 'cordoba', name: 'Córdoba', capital: 'Córdoba', lon: -64.2, lat: -31.4 },
  { id: 'santafe', name: 'Santa Fe', capital: 'Santa Fe', lon: -60.7, lat: -31.6 },
  { id: 'entrerios', name: 'Entre Ríos', capital: 'Paraná', lon: -60.1, lat: -32.2 },
  { id: 'corrientes', name: 'Corrientes', capital: 'Corrientes', lon: -58.3, lat: -28.6 },
  { id: 'chaco', name: 'Chaco', capital: 'Resistencia', lon: -60.2, lat: -26.9 },
  { id: 'formosa', name: 'Formosa', capital: 'Formosa', lon: -59.2, lat: -25.3 },
  { id: 'misiones', name: 'Misiones', capital: 'Posadas', lon: -55.2, lat: -26.9 },
  { id: 'caba', name: 'Ciudad de Buenos Aires', capital: 'CABA', lon: -58.4, lat: -34.6 },
  { id: 'buenosaires', name: 'Buenos Aires', capital: 'La Plata', lon: -60.2, lat: -36.4 },
  { id: 'lapampa', name: 'La Pampa', capital: 'Santa Rosa', lon: -65.0, lat: -37.0 },
  { id: 'neuquen', name: 'Neuquén', capital: 'Neuquén', lon: -69.6, lat: -38.6 },
  { id: 'rionegro', name: 'Río Negro', capital: 'Viedma', lon: -66.8, lat: -40.2 },
  { id: 'chubut', name: 'Chubut', capital: 'Rawson', lon: -68.5, lat: -43.8 },
  { id: 'santacruz', name: 'Santa Cruz', capital: 'Río Gallegos', lon: -69.6, lat: -48.6 },
  { id: 'tierradelfuego', name: 'Tierra del Fuego', capital: 'Ushuaia', lon: -67.4, lat: -54.2 },
];

export const ORIGIN = PROVINCES[0] as Province;

export const MAP_W = 370;
export const MAP_H = 760;
const LON0 = -74.5;
const LAT0 = -21.2;
const K = 21.5;
const COS = Math.cos((38 * Math.PI) / 180);

export function projectGeo(lon: number, lat: number): [number, number] {
  return [Math.round((lon - LON0) * K * COS * 10) / 10 + 6, Math.round((LAT0 - lat) * K * 10) / 10 + 14];
}

const toPath = (points: readonly [number, number][]): string =>
  points.map(([lon, lat], i) => `${i ? 'L' : 'M'}${projectGeo(lon, lat).join(' ')}`).join(' ') + ' Z';

export const OUTLINE_PATH = `${toPath(MAINLAND)} ${toPath(FUEGO)}`;

function km(a: Province, b: Province): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export interface ShippingQuote {
  province: Province;
  km: number;
  days: number;
  cost: number;
}

export function shippingQuote(provinceId: string): ShippingQuote {
  const province = PROVINCES.find((p) => p.id === provinceId) ?? ORIGIN;
  const distance = Math.round(km(ORIGIN, province) * 1.25);
  const days = province.id === ORIGIN.id ? 1 : 2 + Math.round(distance / 420);
  const cost = province.id === ORIGIN.id ? 0 : Math.round((22000 + distance * 48) / 500) * 500;
  return { province, km: distance, days, cost };
}

/** Curved road path from the workshop to a province, in map coordinates. */
export function routePath(provinceId: string): string {
  const province = PROVINCES.find((p) => p.id === provinceId) ?? ORIGIN;
  const [x0, y0] = projectGeo(ORIGIN.lon, ORIGIN.lat);
  const [x1, y1] = projectGeo(province.lon, province.lat);
  const mx = (x0 + x1) / 2 + (y1 - y0) * 0.18;
  const my = (y0 + y1) / 2 - (x1 - x0) * 0.18;
  return `M${x0} ${y0} Q${Math.round(mx)} ${Math.round(my)} ${x1} ${y1}`;
}
