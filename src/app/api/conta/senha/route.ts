import { NextResponse } from "next/server";
import { checkPasswordRules, currentAccount, setAccountPassword, verifyPassword } from "@/lib/accounts";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Entre na sua conta" }, { status: 401 });
  const { current, next } = (await req.json().catch(() => ({}))) as { current?: string; next?: string };
  if (!(await verifyPassword(String(current ?? ""), account.passwordHash))) {
    return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 });
  }
  const rule = checkPasswordRules(String(next ?? ""));
  if (rule) return NextResponse.json({ error: rule }, { status: 400 });
  await setAccountPassword(account.id, String(next));
  return NextResponse.json({ ok: true });
}
