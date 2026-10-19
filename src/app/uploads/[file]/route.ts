import { promises as fs } from "fs";
import path from "path";

// Serve as imagens enviadas pelo painel (modo json). Arquivos adicionados em
// /public depois do build não são servidos pelo Next, por isso esta rota.
const MIME: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" };

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const ext = file.split(".").pop() ?? "";
  if (!/^[a-z0-9]+\.[a-z]+$/.test(file) || !MIME[ext]) return new Response("Not found", { status: 404 });
  try {
    const data = await fs.readFile(path.join(process.cwd(), "data", "uploads", file));
    return new Response(new Uint8Array(data), {
      headers: { "Content-Type": MIME[ext], "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
