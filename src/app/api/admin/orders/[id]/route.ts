import { NextResponse } from "next/server";
import { bad } from "@/lib/admin";
import { requireAdmin } from "@/lib/admin-users";
import { audit } from "@/lib/audit";
import { getOrder, setOrderStatus } from "@/lib/orders";
import type { OrderStatus } from "@/lib/types";

const STATUSES: OrderStatus[] = ["pendente", "pago", "cancelado", "entregue"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;
  const { status } = (await req.json().catch(() => ({}))) as { status?: OrderStatus };
  if (!status || !STATUSES.includes(status)) return bad("Status inválido");
  const before = await getOrder(id);
  if (!before) return bad("Pedido não encontrado", 404);
  await setOrderStatus(id, status); // marcar como "pago" baixa o estoque uma única vez
  if (before.status !== status) {
    await audit(admin, {
      action: "status",
      area: "Pedidos",
      target: `${id} · ${before.customer.name}`,
      changes: [{ field: "Status", before: before.status, after: status }],
    });
  }
  return NextResponse.json(await getOrder(id));
}
