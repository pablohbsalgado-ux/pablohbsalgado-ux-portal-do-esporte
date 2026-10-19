import { NextResponse } from "next/server";
import { bad } from "@/lib/admin";
import { getOrder, setOrderStatus } from "@/lib/orders";
import type { OrderStatus } from "@/lib/types";

const STATUSES: OrderStatus[] = ["pendente", "pago", "cancelado", "entregue"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status } = (await req.json().catch(() => ({}))) as { status?: OrderStatus };
  if (!status || !STATUSES.includes(status)) return bad("Status inválido");
  if (!(await getOrder(id))) return bad("Pedido não encontrado", 404);
  await setOrderStatus(id, status); // marcar como "pago" baixa o estoque uma única vez
  return NextResponse.json(await getOrder(id));
}
