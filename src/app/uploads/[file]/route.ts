import { promises as fs } from "fs";
import path from "path";
import { supabaseRpc, usingSupabase } from "@/lib/store";

// Serve as imagens enviadas pelo painel: do disco (modo json) ou do banco (modo supabase).
// Arquivos adicionados em /public depois do build não são servidos pelo Next, por isso esta rota.
const MIME: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" };

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const ext = file.split(".").pop() ?? "";
  if (!/^[a-z0-9]+\.[a-z]+$/.test(file) || !MIME[ext]) return new Response("Not found", { status: 404 });
  try {
    let data: Buffer;
    if (usingSupabase()) {
      const rows = await supabaseRpc<{ mime: string; b64: string }[]>("portal_upload_get", { p_name: file });
      if (!rows?.length) return new Response("Not found", { status: 404 });
      data = Buffer.from(rows[0].b64, "base64");
    } else {
      data = await fs.readFile(path.join(process.cwd(), "data", "uploads", file));
    }
    return new Response(new Uint8Array(data), {
      headers: { "Content-Type": MIME[ext], "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
