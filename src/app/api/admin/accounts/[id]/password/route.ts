import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { bad } from "@/lib/admin";
import { setAccountPassword } from "@/lib/accounts";

// Gera uma senha provisória para o cliente que esqueceu a dele.
// A diretoria repassa pelo WhatsApp; a senha não fica guardada em texto em lugar nenhum.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(10);
  const temp = "Lobo" + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("").slice(0, 6) + (bytes[0] % 10);
  if (!(await setAccountPassword(id, temp))) return bad("Conta não encontrada", 404);
  return NextResponse.json({ password: temp });
}
