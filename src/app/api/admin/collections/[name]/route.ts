import { NextResponse } from "next/server";
import { bad, publish, specFor, validate } from "@/lib/admin";
import { toPublic } from "@/lib/accounts";
import { getCollection, newId, setCollection, updateCollection } from "@/lib/store";
import type { Collections, Settings } from "@/lib/types";

type Ctx = { params: Promise<{ name: string }> };
type ListName = Exclude<keyof Collections, "settings" | "orders">;

export async function GET(_req: Request, { params }: Ctx) {
  const spec = specFor((await params).name);
  if (!spec) return bad("Coleção desconhecida", 404);
  // senhas (mesmo criptografadas) nunca saem do servidor
  if (spec.name === "accounts") return NextResponse.json((await getCollection("accounts")).map(toPublic));
  return NextResponse.json(await getCollection(spec.name));
}

/** Cria um item (listas) ou salva as Configurações (singleton). */
export async function POST(req: Request, { params }: Ctx) {
  const spec = specFor((await params).name);
  if (!spec || spec.readOnly) return bad("Coleção desconhecida", 404);
  const result = await validate(spec.name, await req.json().catch(() => null));
  if (!result.ok) return bad(result.errors);

  if (spec.singleton) {
    const saved = await setCollection("settings", result.value as unknown as Settings);
    publish();
    return NextResponse.json(saved);
  }

  const item = { ...result.value, id: newId() };
  await updateCollection(spec.name as ListName, (list) => [...list, item] as never);
  publish();
  return NextResponse.json(item, { status: 201 });
}
