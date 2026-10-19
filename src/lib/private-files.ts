// Arquivos privados dos sócios (foto de perfil, comprovante de matrícula).
// Diferente de /uploads (fotos públicas do site), estes só saem pelo painel da diretoria.
//   modo json     → data/private/<nome>
//   modo supabase → tabela private_files, via funções que exigem o token secreto

import { promises as fs } from "fs";
import path from "path";
import { newId, supabaseRpc, usingSupabase } from "./store";

const DIR = path.join(process.cwd(), "data", "private");

export const PRIVATE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};
const MIME_BY_EXT = Object.fromEntries(Object.entries(PRIVATE_TYPES).map(([m, e]) => [e, m]));
export const PRIVATE_MAX_BYTES = 4 * 1024 * 1024;

export class FileError extends Error {}

type FileRules = { label: string; imagesOnly?: boolean };

/** Confere tipo e tamanho sem gravar nada (para validar todos os arquivos antes de salvar). */
export function checkPrivateFile(file: File, { label, imagesOnly = false }: FileRules) {
  const ext = PRIVATE_TYPES[file.type];
  if (!ext || (imagesOnly && ext === "pdf")) {
    throw new FileError(`${label}: envie ${imagesOnly ? "uma imagem JPG, PNG ou WEBP" : "PDF ou imagem (JPG, PNG, WEBP)"}`);
  }
  if (file.size > PRIVATE_MAX_BYTES) throw new FileError(`${label}: arquivo maior que 4 MB`);
  if (file.size === 0) throw new FileError(`${label}: arquivo vazio`);
  return ext;
}

/** Valida e guarda o arquivo; devolve o nome interno (ex.: "p_abc.pdf"). */
export async function savePrivateFile(file: File, rules: FileRules) {
  const ext = checkPrivateFile(file, rules);

  const name = `${newId("p_")}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  if (usingSupabase()) {
    await supabaseRpc("portal_private_put", {
      p_token: process.env.SUPABASE_PORTAL_TOKEN,
      p_name: name,
      p_mime: file.type,
      p_b64: bytes.toString("base64"),
    });
  } else {
    await fs.mkdir(DIR, { recursive: true });
    await fs.writeFile(path.join(DIR, name), bytes);
  }
  return name;
}

export async function readPrivateFile(name: string): Promise<{ mime: string; data: Buffer } | null> {
  if (!/^p_[a-z0-9]+\.(jpg|png|webp|pdf)$/.test(name)) return null;
  if (usingSupabase()) {
    const rows = await supabaseRpc<{ mime: string; b64: string }[]>("portal_private_get", {
      p_token: process.env.SUPABASE_PORTAL_TOKEN,
      p_name: name,
    });
    return rows?.length ? { mime: rows[0].mime, data: Buffer.from(rows[0].b64, "base64") } : null;
  }
  try {
    return { mime: MIME_BY_EXT[name.split(".").pop()!], data: await fs.readFile(path.join(DIR, name)) };
  } catch {
    return null;
  }
}
