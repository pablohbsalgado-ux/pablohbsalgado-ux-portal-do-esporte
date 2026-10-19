import { NextResponse } from "next/server";
import { bad } from "@/lib/admin";
import { requireAdmin } from "@/lib/admin-users";
import { audit } from "@/lib/audit";
import { getMembers, setMemberStatus } from "@/lib/members";
import type { MemberStatus } from "@/lib/types";

const STATUSES: MemberStatus[] = ["pendente", "ativo", "cancelado"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;
  const { status } = (await req.json().catch(() => ({}))) as { status?: MemberStatus };
  if (!status || !STATUSES.includes(status)) return bad("Status inválido");
  const before = (await getMembers()).find((m) => m.id === id);
  const member = await setMemberStatus(id, status);
  if (!member) return bad("Sócio não encontrado", 404);
  if (before && before.status !== status) {
    await audit(admin, {
      action: "status",
      area: "Sócios",
      target: `${member.fullName} · ${member.planName}`,
      changes: [{ field: "Status", before: before.status, after: status }],
    });
  }
  return NextResponse.json(member);
}
