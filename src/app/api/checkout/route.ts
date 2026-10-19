import { NextResponse } from "next/server";
import { CheckoutError, createOrder, patchOrder, priceCart, type CartLine } from "@/lib/orders";
import { paymentsDemoMode, startPayment } from "@/lib/payments";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: { method?: string; items?: CartLine[]; customer?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const method = body.method === "card" ? "card" : "pix";
  const c = body.customer ?? {};
  const customer = {
    name: String(c.name ?? "").trim().slice(0, 120),
    email: String(c.email ?? "").trim().toLowerCase().slice(0, 160),
    phone: String(c.phone ?? "").replace(/\D/g, "").slice(0, 13),
    cpf: String(c.cpf ?? "").replace(/\D/g, ""),
  };
  if (customer.name.length < 3) return NextResponse.json({ error: "Informe seu nome completo" }, { status: 400 });
  if (!EMAIL_RE.test(customer.email)) return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
  if (customer.cpf && customer.cpf.length !== 11) return NextResponse.json({ error: "CPF deve ter 11 dígitos" }, { status: 400 });

  try {
    const { items, total } = await priceCart(body.items ?? []);
    const order = await createOrder({ method, total, items, customer, demo: paymentsDemoMode() });
    const payment = await startPayment(order);
    await patchOrder(order.id, {
      paymentId: payment.paymentId,
      ...(payment.kind === "pix" ? { pix: { qrCodeBase64: payment.qrCodeBase64, copyPaste: payment.copyPaste, expiresAt: payment.expiresAt } } : {}),
    });
    return NextResponse.json({
      orderId: order.id,
      total,
      payment: payment.kind === "redirect" ? { kind: "redirect", url: payment.url } : { kind: "pix" },
    });
  } catch (err) {
    if (err instanceof CheckoutError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("[checkout]", err);
    return NextResponse.json({ error: "Falha ao iniciar o pagamento. Tente novamente em instantes." }, { status: 502 });
  }
}
