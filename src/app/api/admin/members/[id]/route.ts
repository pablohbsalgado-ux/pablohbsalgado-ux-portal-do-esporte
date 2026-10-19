import { NextResponse } from "next/server";
import { bad } from "@/lib/admin";
import { setMemberStatus } from "@/lib/members";
import type { MemberStatus } from "@/lib/types";

const STATUSES: MemberStatus[] = ["pendente", "ativo", "cancelado"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status } = (await req.json().catch(() => ({}))) as { status?: MemberStatus };
  if (!status || !STATUSES.includes(status)) return bad("Status inválido");
  const member = await setMemberStatus(id, status);
  if (!member) return bad("Sócio não encontrado", 404);
  return NextResponse.json(member);
}
