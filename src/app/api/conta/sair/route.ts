import { NextResponse } from "next/server";
import { ACCOUNT_COOKIE } from "@/lib/accounts";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(ACCOUNT_COOKIE);
  return res;
}
