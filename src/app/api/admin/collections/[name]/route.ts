import { NextResponse } from "next/server";
import { bad, publish, specFor, validate } from "@/lib/admin";
import { toPublic } from "@/lib/accounts";
import { requireAdmin } from "@/lib/admin-users";
import { areaLabel, audit, describeItem, diffRecords } from "@/lib/audit";
import { getCollection, newId, updateCollection } from "@/lib/store";
import type { Collections, Settings } from "@/lib/types";

type Ctx = { params: Promise<{ name: string }> };
type ListName = Exclude<keyof Collections, "settings" | "orders" | "accounts" | "members" | "adminUsers">;

export async function GET(_req: Request, { params }: Ctx) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const spec = specFor((await params).name);
  // perfis do painel nunca são listados por aqui (têm tela própria do Data Owner)
  if (!spec || spec.name === "adminUsers") return bad("Coleção desconhecida", 404);
  // senhas (mesmo criptografadas) nunca saem do servidor
  if (spec.name === "accounts") return NextResponse.json((await getCollection("accounts")).map(toPublic));
  return NextResponse.json(await getCollection(spec.name));
}

/** Cria um item (listas) ou salva as Configurações (singleton). */
export async function POST(req: Request, { params }: Ctx) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const spec = specFor((await params).name);
  if (!spec || spec.readOnly) return bad("Coleção desconhecida", 404);
  const result = await validate(spec.name, await req.json().catch(() => null));
  if (!result.ok) return bad(result.errors);

  if (spec.singleton) {
    let before: Settings | undefined;
    const saved = await updateCollection("settings", (current) => {
      before = current;
      return result.value as unknown as Settings;
    });
    publish();
    const changes = diffRecords("settings", before as never, saved as never);
    if (changes.length) await audit(admin, { action: "editar", area: areaLabel("settings"), target: "Configurações gerais", changes });
    return NextResponse.json(saved);
  }

  const item = { ...result.value, id: newId() };
  await updateCollection(spec.name as ListName, (list) => [...list, item] as never);
  publish();
  await audit(admin, {
    action: "criar",
    area: areaLabel(spec.name),
    target: describeItem(spec.name, item),
    changes: diffRecords(spec.name, undefined, item),
  });
  return NextResponse.json(item, { status: 201 });
}
