// Instruções de pagamento manual (chave Pix / link InfinitePay) exibidas na página do pedido.

import QRCode from "qrcode";
import { pixCopyPaste } from "./pix";
import type { Order, Settings } from "./types";

export interface PixGroup {
  key: string;
  amount: number;
  items: string[];
  copyPaste: string;
  qrDataUrl: string;
}

export interface LinkLine {
  name: string;
  quantity: number;
  amount: number;
  url: string;
}

export interface ManualInstructions {
  method: Order["method"];
  pix: PixGroup[];
  links: LinkLine[];
}

const itemLabel = (i: Order["items"][number]) => `${i.quantity}× ${i.name}${i.size ? ` (${i.size})` : ""}`;

/**
 * Pix: um código por chave (normalmente uma só, com o valor total do pedido).
 * Cartão: um botão por item, com o link cadastrado no produto/plano.
 */
export async function buildInstructions(order: Order, settings: Settings): Promise<ManualInstructions> {
  if (order.method === "card") {
    return {
      method: "card",
      pix: [],
      links: order.items.map((i) => ({ name: itemLabel(i), quantity: i.quantity, amount: i.unitPrice * i.quantity, url: i.paymentLink ?? "" })),
    };
  }
  const groups = new Map<string, { amount: number; items: string[] }>();
  for (const i of order.items) {
    const key = i.pixKey ?? "";
    const g = groups.get(key) ?? { amount: 0, items: [] };
    g.amount += i.unitPrice * i.quantity;
    g.items.push(itemLabel(i));
    groups.set(key, g);
  }
  const pix = await Promise.all(
    [...groups.entries()].map(async ([key, g], idx) => {
      const amount = Math.round(g.amount * 100) / 100;
      const copyPaste = pixCopyPaste({
        key,
        amount,
        name: settings.pixReceiverName || "AAA CEFET RJ",
        city: settings.pixCity || "Rio de Janeiro",
        // o número do pedido vai no Pix: aparece no extrato e ajuda a conferir o pagamento
        txid: groups.size > 1 ? `${order.id}${idx + 1}` : order.id,
      });
      return { key, amount, items: g.items, copyPaste, qrDataUrl: await QRCode.toDataURL(copyPaste, { margin: 1, width: 280 }) };
    }),
  );
  return { method: "pix", pix, links: [] };
}
