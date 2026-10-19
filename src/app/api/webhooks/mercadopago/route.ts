import { NextResponse } from "next/server";
import { getOrder, setOrderStatus } from "@/lib/orders";
import { fetchPayment, paymentsDemoMode, verifyWebhookSignature } from "@/lib/payments";

export const dynamic = "force-dynamic";

// Notificações do Mercado Pago. O status é sempre reconsultado na API do MP,
// então o corpo da notificação nunca é tomado como verdade.
export async function POST(req: Request) {
  if (paymentsDemoMode()) return NextResponse.json({ ok: true });

  const url = new URL(req.url);
  const body = (await req.json().catch(() => ({}))) as { type?: string; data?: { id?: string | number } };
  const type = body.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
  const id = String(body.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "");
  if (type !== "payment" || !id) return NextResponse.json({ ignored: true });

  if (!(await verifyWebhookSignature(req.headers, id))) {
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
  }

  try {
    const payment = await fetchPayment(id);
    const order = await getOrder(payment.external_reference);
    if (!order) return NextResponse.json({ ignored: true });
    if (payment.status === "approved" && Math.abs(payment.transaction_amount - order.total) < 0.01) {
      await setOrderStatus(order.id, "pago");
    } else if (["rejected", "cancelled", "refunded", "charged_back"].includes(payment.status) && order.status === "pendente") {
      await setOrderStatus(order.id, "cancelado");
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhook mp]", err);
    return NextResponse.json({ error: "erro" }, { status: 500 }); // MP tenta novamente
  }
}
