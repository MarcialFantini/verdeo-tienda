const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
const plain = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });

export const formatPrice = (value: number): string => money.format(value).replace(/\s/g, '\u00a0');
export const formatNumber = (value: number): string => plain.format(value);
export const formatCm = (value: number): string => `${plain.format(Math.round(value))} cm`;

export function normalize(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function relativeMinutes(minutes: number): string {
  if (minutes < 1) return 'recién';
  if (minutes < 60) return `hace ${Math.round(minutes)} min`;
  const h = Math.round(minutes / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} d`;
}
