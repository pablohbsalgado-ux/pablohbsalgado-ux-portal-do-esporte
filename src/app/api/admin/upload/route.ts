import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { bad } from "@/lib/admin";
import { newId, usingSupabase } from "@/lib/store";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
const MAX = 5 * 1024 * 1024;

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return bad("Envie um arquivo");
  const ext = TYPES[file.type];
  if (!ext) return bad("Use JPG, PNG, WEBP ou GIF");
  if (file.size > MAX) return bad("Imagem maior que 5 MB");

  const name = `${newId()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  if (usingSupabase()) {
    const base = process.env.SUPABASE_URL!.replace(/\/$/, "");
    const bucket = process.env.SUPABASE_BUCKET || "portal";
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const res = await fetch(`${base}/storage/v1/object/${bucket}/uploads/${name}`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": file.type },
      body: bytes,
    });
    if (!res.ok) return bad(`Falha no upload (${res.status})`, 502);
    return NextResponse.json({ url: `${base}/storage/v1/object/public/${bucket}/uploads/${name}` });
  }

  const dir = path.join(process.cwd(), "data", "uploads");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), bytes);
  return NextResponse.json({ url: `/uploads/${name}` });
}
