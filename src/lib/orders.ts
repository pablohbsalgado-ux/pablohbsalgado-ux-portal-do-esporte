import { revalidatePath } from "next/cache";
import { getCollection, newId, updateCollection } from "./store";
import { mercadoPagoEnabled, startPayment } from "./payments";
import { canBuy, currentLot } from "./events";
import { setMemberStatus } from "./members";
import type { MemberStatus, Order, OrderItem, OrderStatus } from "./types";

export interface CartLine {
  kind: "product" | "plan" | "event";
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
  const [products, events, settings] = await Promise.all([getCollection("products"), getCollection("events"), getCollection("settings")]);

  const items: OrderItem[] = [];
  const wanted = new Map<string, number>();

  for (const line of lines) {
    const quantity = Math.floor(Number(line.quantity));
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 20) throw new CheckoutError("Quantidade inválida");

    if (line.kind === "plan") {
      // A adesão de sócio tem ficha própria (/socio/[plano]) e não passa pelo carrinho.
      throw new CheckoutError("A associação é feita pela ficha de adesão do Sócio-Lobo");
    }

    if (line.kind === "event") {
      // ingresso: o preço é sempre o do lote vigente agora (a virada pode ter acontecido
      // depois que o ingresso foi para o carrinho)
      const event = events.find((e) => e.id === line.id);
      if (!event || !canBuy(event)) throw new CheckoutError(`Ingressos indisponíveis para ${event?.name ?? "este evento"}`);
      if (quantity > 10) throw new CheckoutError("Máximo de 10 ingressos por pedido");
      const { lot } = currentLot(event);
      items.push({
        kind: "event",
        refId: event.id,
        name: `Ingresso: ${event.name}`,
        unitPrice: lot!.price,
        quantity,
        lot: lot!.name,
        eventDate: event.date,
        paymentLink: event.paymentLink || settings.paymentLink || "",
        pixKey: event.pixKey || settings.pixKey || "",
      });
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

    items.push({
      kind: "product",
      refId: product.id,
      name: product.name,
      unitPrice,
      quantity,
      size: line.size || undefined,
      customization,
      paymentLink: product.paymentLink || settings.paymentLink || "",
      pixKey: product.pixKey || settings.pixKey || "",
    });
  }

  const total = Math.round(items.reduce((s, i) => s + i.unitPrice * i.quantity, 0) * 100) / 100;
  return { items, total };
}

export async function createOrder(data: Omit<Order, "id" | "createdAt" | "status" | "paymentId" | "stockApplied">) {
  const order: Order = { ...data, id: newId("LB-").toUpperCase(), createdAt: new Date().toISOString(), status: "pendente", paymentId: "", stockApplied: false };
  await updateCollection("orders", (orders) => [order, ...orders]);
  return order;
}

/**
 * Cria o pedido e prepara o pagamento.
 *  - padrão (manual): o cliente paga pela chave Pix / link InfinitePay de cada item e envia o
 *    comprovante; a diretoria confere e marca "pago" no painel.
 *  - com MP_ACCESS_TOKEN: pagamento automático pelo Mercado Pago (Pix com QR e Checkout Pro).
 */
export async function placeOrder(data: Omit<Order, "id" | "createdAt" | "status" | "paymentId" | "stockApplied" | "demo" | "provider">) {
  if (!mercadoPagoEnabled()) {
    const missing = data.items.filter((i) => (data.method === "pix" ? !i.pixKey : !i.paymentLink));
    if (missing.length) {
      throw new CheckoutError(
        data.method === "pix"
          ? `Pagamento por Pix indisponível para: ${missing.map((i) => i.name).join(", ")}. Escolha cartão ou fale com a diretoria.`
          : `Pagamento por cartão indisponível para: ${missing.map((i) => i.name).join(", ")}. Escolha Pix ou fale com a diretoria.`,
      );
    }
    const order = await createOrder({ ...data, demo: false, provider: "manual" });
    return { orderId: order.id, total: order.total, payment: { kind: "manual" as const } };
  }
  const order = await createOrder({ ...data, demo: false, provider: "mercadopago" });
  const payment = await startPayment(order);
  await patchOrder(order.id, {
    paymentId: payment.paymentId,
    ...(payment.kind === "pix" ? { pix: { qrCodeBase64: payment.qrCodeBase64, copyPaste: payment.copyPaste, expiresAt: payment.expiresAt } } : {}),
  });
  return {
    orderId: order.id,
    total: order.total,
    payment: payment.kind === "redirect" ? { kind: "redirect" as const, url: payment.url } : { kind: "pix" as const },
  };
}

export async function patchOrder(id: string, patch: Partial<Order>) {
  let found: Order | undefined;
  await updateCollection("orders", (orders) =>
    orders.map((o) => (o.id === id ? (found = { ...o, ...patch }) : o)),
  );
  return found;
}

const MEMBER_STATUS_BY_ORDER: Record<OrderStatus, MemberStatus> = {
  pendente: "pendente",
  pago: "ativo",
  entregue: "ativo",
  cancelado: "cancelado",
};

/**
 * Atualiza o status e, na primeira vez que o pedido fica pago, baixa o estoque.
 * Pedidos de adesão também atualizam a ficha do sócio (pago → sócio ativo).
 */
export async function setOrderStatus(id: string, status: OrderStatus) {
  let toApply: Order | undefined;
  let memberId: string | undefined;
  await updateCollection("orders", (orders) =>
    orders.map((o) => {
      if (o.id !== id) return o;
      memberId = o.memberId;
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
  if (memberId) await setMemberStatus(memberId, MEMBER_STATUS_BY_ORDER[status]);
}

export async function getOrder(id: string) {
  return (await getCollection("orders")).find((o) => o.id === id);
}
