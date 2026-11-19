/** Order creation and cart helpers for the simulated checkout. */
import { getProduct, describeSelection, type Selection } from '../data/catalog';
import { shippingQuote } from '../data/argentina';
import { announceOwnPurchase } from './sim';
import { cartSubtotal, getState, update, type CartLine, type Customer, type Order } from './store';

export const DEMO_CUSTOMER: Customer = {
  name: 'Martina Herrera',
  email: 'martina.herrera@ejemplo.com.ar',
  phone: '381 555-0142',
  dni: '30.123.456',
  address: 'Av. Aconquija 1820',
  city: 'Yerba Buena',
};

export function lineSelection(line: CartLine): Selection {
  return { wood: line.wood, fabric: line.fabric, size: line.size };
}

export function lineLabel(line: CartLine): string {
  const product = getProduct(line.productId);
  return product ? describeSelection(product, lineSelection(line)) : '';
}

export function productionDaysFor(lines: CartLine[]): number {
  return Math.max(10, ...lines.map((l) => getProduct(l.productId)?.days ?? 15));
}

export function newOrderId(): string {
  const n = 1000 + Math.floor(Math.random() * 9000);
  return `RL-${n}`;
}

export interface PlaceOrderInput {
  customer: Customer;
  province: string;
  pickup: boolean;
  payment: Order['payment'];
}

export function placeOrder(input: PlaceOrderInput): Order {
  const s = getState();
  const quote = shippingQuote(input.province);
  const subtotal = cartSubtotal(s);
  const shippingCost = input.pickup ? 0 : quote.cost;
  const order: Order = {
    id: newOrderId(),
    lines: structuredClone(s.cart),
    subtotal,
    shippingCost,
    total: subtotal + shippingCost,
    province: input.pickup ? 'tucuman' : input.province,
    shippingDays: input.pickup ? 1 : quote.days,
    productionDays: productionDaysFor(s.cart),
    customer: input.customer,
    payment: input.payment,
    placedAt: s.sim.clock,
    createdAt: Date.now(),
  };
  update((d) => {
    d.orders.unshift(order);
    d.cart = [];
    d.province = input.province;
    d.sim.stages[order.id] = 'corte';
    d.notices.unshift({
      id: `o-${order.id}`,
      kind: 'order',
      title: `Pedido ${order.id} confirmado`,
      body: `Entró al taller. Día 1 de ${order.productionDays}: corte.`,
      href: `/pedido?id=${order.id}`,
      read: false,
      at: d.sim.clock,
    });
  });
  announceOwnPurchase(order);
  return order;
}

/** A finished-looking sample order so the tracker can be explored without buying. */
export function sampleOrder(): Order {
  const s = getState();
  const line: CartLine = {
    key: 'rl-004|cedro|-|m',
    productId: 'rl-004',
    wood: 'cedro',
    fabric: null,
    size: 'm',
    qty: 1,
    unitPrice: 0,
  };
  const product = getProduct('rl-004');
  if (product) {
    const factor = 1.14;
    line.unitPrice = Math.round((product.basePrice * factor) / 500) * 500;
  }
  const quote = shippingQuote('cordoba');
  const order: Order = {
    id: newOrderId(),
    lines: [line],
    subtotal: line.unitPrice,
    shippingCost: quote.cost,
    total: line.unitPrice + quote.cost,
    province: 'cordoba',
    shippingDays: quote.days,
    productionDays: product?.days ?? 15,
    customer: DEMO_CUSTOMER,
    payment: 'tarjeta',
    placedAt: s.sim.clock - 24 * 4,
    createdAt: Date.now(),
  };
  update((d) => {
    d.orders.unshift(order);
  });
  return order;
}
