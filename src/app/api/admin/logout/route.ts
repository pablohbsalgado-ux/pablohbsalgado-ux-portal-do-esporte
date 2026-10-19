import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/admin-users";
import { audit } from "@/lib/audit";
import { SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  const admin = await currentAdmin();
  if (admin) await audit(admin, { action: "logout", area: "Acesso ao painel", target: "Saiu do painel" });
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
