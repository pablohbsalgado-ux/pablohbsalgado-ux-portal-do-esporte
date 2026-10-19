// Integração com o Mercado Pago.
//  - Pix: pagamento criado direto pela API (/v1/payments) → QR Code exibido no próprio site.
//  - Cartão: Checkout Pro (/checkout/preferences) → o cliente paga no ambiente seguro do MP
//    e volta para /pedido/[id]. Nenhum dado de cartão passa pelo nosso servidor.
// Sem MP_ACCESS_TOKEN tudo roda em modo demonstração (nada é cobrado).

import QRCode from "qrcode";
import type { Order } from "./types";

const API = "https://api.mercadopago.com";

export function paymentsDemoMode() {
  return !process.env.MP_ACCESS_TOKEN;
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

async function mp<T>(path: string, init: RequestInit & { idempotencyKey?: string } = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      ...(init.idempotencyKey ? { "X-Idempotency-Key": init.idempotencyKey } : {}),
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Mercado Pago ${path}: ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

export type CheckoutResult =
  | { kind: "pix"; paymentId: string; qrCodeBase64: string; copyPaste: string; expiresAt: string }
  | { kind: "redirect"; paymentId: string; url: string };

export async function startPayment(order: Order): Promise<CheckoutResult> {
  const description = `Atlética Lobo — pedido ${order.id}`;
  const expiresAt = new Date(Date.now() + 30 * 60_000).toISOString();

  if (paymentsDemoMode()) {
    if (order.method === "card") {
      return { kind: "redirect", paymentId: `demo-${order.id}`, url: `/pedido/${order.id}` };
    }
    const copyPaste = `00020126DEMONSTRACAO-LOBO-${order.id}5204000053039865406${order.total.toFixed(2)}5802BR6304DEMO`;
    const dataUrl = await QRCode.toDataURL(copyPaste, { margin: 1, width: 280 });
    return { kind: "pix", paymentId: `demo-${order.id}`, qrCodeBase64: dataUrl.split(",")[1], copyPaste, expiresAt };
  }

  const [firstName, ...rest] = order.customer.name.split(" ");
  const notificationUrl = `${siteUrl()}/api/webhooks/mercadopago`;

  if (order.method === "pix") {
    const payment = await mp<{
      id: number;
      point_of_interaction: { transaction_data: { qr_code: string; qr_code_base64: string } };
    }>("/v1/payments", {
      method: "POST",
      idempotencyKey: order.id,
      body: JSON.stringify({
        transaction_amount: order.total,
        description,
        payment_method_id: "pix",
        external_reference: order.id,
        notification_url: notificationUrl,
        date_of_expiration: expiresAt.replace("Z", "+00:00"),
        payer: {
          email: order.customer.email,
          first_name: firstName,
          last_name: rest.join(" ") || firstName,
          ...(order.customer.cpf ? { identification: { type: "CPF", number: order.customer.cpf } } : {}),
        },
      }),
    });
    const tx = payment.point_of_interaction.transaction_data;
    return { kind: "pix", paymentId: String(payment.id), qrCodeBase64: tx.qr_code_base64, copyPaste: tx.qr_code, expiresAt };
  }

  const pref = await mp<{ id: string; init_point: string }>("/checkout/preferences", {
    method: "POST",
    idempotencyKey: order.id,
    body: JSON.stringify({
      external_reference: order.id,
      notification_url: notificationUrl,
      statement_descriptor: "ATLETICA LOBO",
      payer: { name: firstName, surname: rest.join(" "), email: order.customer.email },
      items: order.items.map((i) => ({
        id: i.refId,
        title: i.name + (i.size ? ` (${i.size})` : ""),
        quantity: i.quantity,
        unit_price: i.unitPrice,
        currency_id: "BRL",
      })),
      payment_methods: { excluded_payment_types: [{ id: "ticket" }], installments: 6 },
      back_urls: {
        success: `${siteUrl()}/pedido/${order.id}`,
        pending: `${siteUrl()}/pedido/${order.id}`,
        failure: `${siteUrl()}/pedido/${order.id}`,
      },
      auto_return: "approved",
    }),
  });
  return { kind: "redirect", paymentId: pref.id, url: pref.init_point };
}

export interface MpPayment {
  id: number;
  status: "pending" | "approved" | "authorized" | "in_process" | "in_mediation" | "rejected" | "cancelled" | "refunded" | "charged_back";
  external_reference: string;
  transaction_amount: number;
}

export function fetchPayment(id: string) {
  return mp<MpPayment>(`/v1/payments/${encodeURIComponent(id)}`);
}

/** Valida o cabeçalho x-signature do webhook (quando MP_WEBHOOK_SECRET estiver configurado). */
export async function verifyWebhookSignature(headers: Headers, dataId: string) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true;
  const sig = headers.get("x-signature") ?? "";
  const requestId = headers.get("x-request-id") ?? "";
  const parts = Object.fromEntries(sig.split(",").map((p) => p.trim().split("=") as [string, string]));
  if (!parts.ts || !parts.v1) return false;
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${parts.ts};`;
  const { createHmac, timingSafeEqual } = await import("crypto");
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  return expected.length === parts.v1.length && timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
}
