import { NextResponse } from "next/server";
import { getOrder, setOrderStatus } from "@/lib/orders";
import { fetchPayment, paymentsDemoMode } from "@/lib/payments";

export const dynamic = "force-dynamic";

// Consulta pública do status (o ID do pedido é aleatório e só o comprador o conhece).
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let order = await getOrder(id);
  if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

  // Se o webhook ainda não chegou, confere direto no Mercado Pago.
  // Pix: pelo ID do pagamento salvo. Cartão: pelo payment_id que o Checkout Pro devolve na URL de retorno.
  const paymentId = order.method === "pix" ? order.paymentId : new URL(req.url).searchParams.get("payment_id");
  if (order.status === "pendente" && order.provider === "mercadopago" && !paymentsDemoMode() && paymentId) {
    try {
      const p = await fetchPayment(paymentId);
      if (p.external_reference === order.id && p.status === "approved" && Math.abs(p.transaction_amount - order.total) < 0.01) {
        await setOrderStatus(order.id, "pago");
        order = (await getOrder(id))!;
      }
    } catch (err) {
      console.error("[orders] consulta MP", err);
    }
  }
  return NextResponse.json({ id: order.id, status: order.status, proofSubmittedAt: order.proofSubmittedAt ?? "" });
}
