import { NextResponse } from "next/server";
import { currentAccount, toPublic } from "@/lib/accounts";

export const dynamic = "force-dynamic";

export async function GET() {
  const account = await currentAccount();
  return NextResponse.json({ account: account ? toPublic(account) : null }, { headers: { "Cache-Control": "no-store" } });
}
