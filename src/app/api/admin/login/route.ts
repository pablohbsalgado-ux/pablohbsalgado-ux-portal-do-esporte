import { NextResponse } from "next/server";
import { ADMIN_PROFILES, authenticateAdmin, profileName, touchLastLogin } from "@/lib/admin-users";
import { audit } from "@/lib/audit";
import { SESSION_COOKIE, SESSION_HOURS, createSessionToken } from "@/lib/auth";

const attempts = new Map<string, { n: number; until: number }>();

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  const { profile, password } = (await req.json().catch(() => ({}))) as { profile?: string; password?: string };
  const key = `${ip}|${profile}`;
  const a = attempts.get(key);
  if (a && a.n >= 5 && a.until > Date.now()) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 });
  }
  if (!profile || !ADMIN_PROFILES.some((p) => p.id === profile)) {
    return NextResponse.json({ error: "Escolha o seu perfil" }, { status: 400 });
  }

  const user = password ? await authenticateAdmin(profile, password) : null;
  if (!user) {
    attempts.set(key, { n: (a && a.until > Date.now() ? a.n : 0) + 1, until: Date.now() + 10 * 60_000 });
    await audit({ id: profile, name: profileName(profile) }, { action: "login_falhou", area: "Acesso ao painel", target: "Senha incorreta" });
    return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
  }

  attempts.delete(key);
  if (user.sessionVersion > 0) await touchLastLogin(user.id);
  await audit(user, { action: "login", area: "Acesso ao painel", target: "Entrou no painel" });
  const res = NextResponse.json({ ok: true, name: user.name });
  res.cookies.set(SESSION_COOKIE, await createSessionToken(user.id, user.sessionVersion), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
  return res;
}
