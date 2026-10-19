import { NextResponse } from "next/server";
import { ACCOUNT_COOKIE, AccountError, accountCookieOptions, createAccountToken, registerAccount, toPublic } from "@/lib/accounts";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  if (body.acceptPrivacy !== true) {
    return NextResponse.json({ error: "É preciso concordar com o uso dos dados para criar a conta" }, { status: 400 });
  }
  try {
    const account = await registerAccount(body as never);
    const res = NextResponse.json({ account: toPublic(account) }, { status: 201 });
    res.cookies.set(ACCOUNT_COOKIE, await createAccountToken(account.id), accountCookieOptions);
    return res;
  } catch (err) {
    if (err instanceof AccountError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("[conta/cadastro]", err);
    return NextResponse.json({ error: "Não foi possível criar a conta agora" }, { status: 500 });
  }
}
