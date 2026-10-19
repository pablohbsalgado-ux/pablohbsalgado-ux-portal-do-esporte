import { NextResponse } from "next/server";
import {
  ACCOUNT_COOKIE,
  accountCookieOptions,
  authenticate,
  clearFailures,
  createAccountToken,
  recordFailure,
  toPublic,
  tooManyAttempts,
} from "@/lib/accounts";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  if (tooManyAttempts(ip)) return NextResponse.json({ error: "Muitas tentativas. Aguarde 15 minutos." }, { status: 429 });

  const { login, password } = (await req.json().catch(() => ({}))) as { login?: string; password?: string };
  const account = await authenticate(login, password);
  if (!account) {
    recordFailure(ip);
    return NextResponse.json({ error: "E-mail/CPF ou senha incorretos" }, { status: 401 });
  }
  clearFailures(ip);
  const res = NextResponse.json({ account: toPublic(account) });
  res.cookies.set(ACCOUNT_COOKIE, await createAccountToken(account.id), accountCookieOptions);
  return res;
}
