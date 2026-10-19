import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-users";
import { readPrivateFile } from "@/lib/private-files";

// Documentos privados dos sócios. Protegido pelo middleware do /api/admin (só a diretoria).
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const { file } = await params;
  const found = await readPrivateFile(file).catch(() => null);
  if (!found) return new Response("Arquivo não encontrado", { status: 404 });
  return new Response(new Uint8Array(found.data), {
    headers: {
      "Content-Type": found.mime,
      "Content-Disposition": `inline; filename="${file}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
