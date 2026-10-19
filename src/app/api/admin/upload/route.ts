import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { bad } from "@/lib/admin";
import { requireAdmin } from "@/lib/admin-users";
import { audit } from "@/lib/audit";
import { newId, supabaseRpc, usingSupabase } from "@/lib/store";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
const MAX = 5 * 1024 * 1024;

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return bad("Envie um arquivo");
  const ext = TYPES[file.type];
  if (!ext) return bad("Use JPG, PNG, WEBP ou GIF");
  if (file.size > MAX) return bad("Imagem maior que 5 MB");

  const name = `${newId()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  if (usingSupabase()) {
    try {
      await supabaseRpc("portal_upload_put", {
        p_token: process.env.SUPABASE_PORTAL_TOKEN,
        p_name: name,
        p_mime: file.type,
        p_b64: bytes.toString("base64"),
      });
    } catch (err) {
      console.error("[upload]", err);
      return bad("Falha ao salvar a imagem", 502);
    }
    await audit(admin, { action: "upload", area: "Imagens", target: `/uploads/${name} (${file.name})` });
    return NextResponse.json({ url: `/uploads/${name}` });
  }

  const dir = path.join(process.cwd(), "data", "uploads");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), bytes);
  await audit(admin, { action: "upload", area: "Imagens", target: `/uploads/${name} (${file.name})` });
  return NextResponse.json({ url: `/uploads/${name}` });
}
