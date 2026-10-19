import { NextResponse } from "next/server";
import { getOrder, setOrderStatus } from "@/lib/orders";
import { paymentsDemoMode } from "@/lib/payments";

// Só existe em modo demonstração: simula a confirmação do pagamento.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!paymentsDemoMode()) return NextResponse.json({ error: "Indisponível" }, { status: 404 });
  const { id } = await params;
  const order = await getOrder(id);
  if (!order?.demo) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  await setOrderStatus(id, "pago");
  return NextResponse.json({ ok: true });
}
