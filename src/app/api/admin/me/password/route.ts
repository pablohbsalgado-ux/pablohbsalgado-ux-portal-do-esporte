import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/accounts";
import { checkAdminPasswordRules, getAdminUsers, requireAdmin, setAdminPassword } from "@/lib/admin-users";
import { audit } from "@/lib/audit";
import { SESSION_COOKIE, SESSION_HOURS, createSessionToken } from "@/lib/auth";

// Cada perfil troca a própria senha. As outras sessões abertas desse perfil caem.
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const { current, next } = (await req.json().catch(() => ({}))) as { current?: string; next?: string };

  const user = (await getAdminUsers()).find((u) => u.id === admin.id);
  if (!user) return NextResponse.json({ errors: ["Os perfis ainda não foram cadastrados. Fale com o Data Owner."] }, { status: 400 });
  if (!(await verifyPassword(String(current ?? ""), user.passwordHash))) return NextResponse.json({ errors: ["Senha atual incorreta"] }, { status: 400 });
  const rule = checkAdminPasswordRules(String(next ?? ""));
  if (rule) return NextResponse.json({ errors: [rule] }, { status: 400 });

  await setAdminPassword(admin.id, String(next));
  await audit(admin, { action: "senha", area: "Perfis de acesso", target: `${admin.name} trocou a própria senha` });
  // renova o cookie desta sessão com a nova versão
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSessionToken(admin.id, user.sessionVersion + 1), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
  return res;
}
