import { revalidatePath } from "next/cache";
import { getCollection, newId, updateCollection } from "./store";
import type { Order, OrderItem, OrderStatus } from "./types";

export interface CartLine {
  kind: "product" | "plan";
  id: string;
  quantity: number;
  size?: string;
  customization?: { name: string; number: string };
}

export class CheckoutError extends Error {}

/**
 * Monta os itens do pedido com preços e estoque lidos do CMS — nunca confia
 * no valor enviado pelo navegador.
 */
export async function priceCart(lines: CartLine[]): Promise<{ items: OrderItem[]; total: number }> {
  if (!Array.isArray(lines) || lines.length === 0 || lines.length > 30) throw new CheckoutError("Carrinho vazio ou inválido");
  const [products, plans, settings] = await Promise.all([
    getCollection("products"),
    getCollection("plans"),
    getCollection("settings"),
  ]);

  const items: OrderItem[] = [];
  const wanted = new Map<string, number>();

  for (const line of lines) {
    const quantity = Math.floor(Number(line.quantity));
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 20) throw new CheckoutError("Quantidade inválida");

    if (line.kind === "plan") {
      const plan = plans.find((p) => p.id === line.id && p.active);
      if (!plan) throw new CheckoutError("Plano indisponível");
      items.push({ kind: "plan", refId: plan.id, name: `Sócio-Lobo: ${plan.name} (${plan.period})`, unitPrice: plan.price, quantity: 1 });
      continue;
    }

    const product = products.find((p) => p.id === line.id && p.active);
    if (!product) throw new CheckoutError("Produto indisponível");
    if (product.sizes.length && !product.sizes.includes(line.size ?? "")) throw new CheckoutError(`Escolha um tamanho para ${product.name}`);

    let unitPrice = product.price;
    let customization: OrderItem["customization"];
    if (line.customization) {
      if (!product.customizable) throw new CheckoutError(`${product.name} não aceita personalização`);
      const name = String(line.customization.name ?? "").trim().toUpperCase().slice(0, 14);
      const number = String(line.customization.number ?? "").replace(/\D/g, "").slice(0, 2);
      if (!name && !number) throw new CheckoutError("Personalização vazia");
      customization = { name, number };
      unitPrice += settings.customizationPrice;
    }

    const total = (wanted.get(product.id) ?? 0) + quantity;
    if (total > product.stock) throw new CheckoutError(`Estoque insuficiente para ${product.name} (restam ${product.stock})`);
    wanted.set(product.id, total);

    items.push({ kind: "product", refId: product.id, name: product.name, unitPrice, quantity, size: line.size || undefined, customization });
  }

  const total = Math.round(items.reduce((s, i) => s + i.unitPrice * i.quantity, 0) * 100) / 100;
  return { items, total };
}

export async function createOrder(data: Omit<Order, "id" | "createdAt" | "status" | "paymentId" | "stockApplied">) {
  const order: Order = { ...data, id: newId("LB-").toUpperCase(), createdAt: new Date().toISOString(), status: "pendente", paymentId: "", stockApplied: false };
  await updateCollection("orders", (orders) => [order, ...orders]);
  return order;
}

export async function patchOrder(id: string, patch: Partial<Order>) {
  let found: Order | undefined;
  await updateCollection("orders", (orders) =>
    orders.map((o) => (o.id === id ? (found = { ...o, ...patch }) : o)),
  );
  return found;
}

/** Atualiza o status e, na primeira vez que o pedido fica pago, baixa o estoque. */
export async function setOrderStatus(id: string, status: OrderStatus) {
  let toApply: Order | undefined;
  await updateCollection("orders", (orders) =>
    orders.map((o) => {
      if (o.id !== id) return o;
      const next = { ...o, status };
      if (status === "pago" && !o.stockApplied) {
        next.stockApplied = true;
        toApply = next;
      }
      return next;
    }),
  );
  if (toApply) {
    const qty = new Map<string, number>();
    for (const i of toApply.items) if (i.kind === "product") qty.set(i.refId, (qty.get(i.refId) ?? 0) + i.quantity);
    await updateCollection("products", (products) =>
      products.map((p) => (qty.has(p.id) ? { ...p, stock: Math.max(0, p.stock - qty.get(p.id)!) } : p)),
    );
    revalidatePath("/vendas");
  }
}

export async function getOrder(id: string) {
  return (await getCollection("orders")).find((o) => o.id === id);
}
