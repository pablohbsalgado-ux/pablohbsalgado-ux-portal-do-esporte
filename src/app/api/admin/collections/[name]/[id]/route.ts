import { NextResponse } from "next/server";
import { bad, publish, specFor, validate } from "@/lib/admin";
import { updateCollection } from "@/lib/store";
import type { Collections } from "@/lib/types";

type Ctx = { params: Promise<{ name: string; id: string }> };
type ListName = Exclude<keyof Collections, "settings" | "orders">;

function listSpec(name: string) {
  const spec = specFor(name);
  return spec && !spec.singleton && !spec.readOnly ? spec : null;
}

export async function PUT(req: Request, { params }: Ctx) {
  const { name, id } = await params;
  const spec = listSpec(name);
  if (!spec) return bad("Coleção desconhecida", 404);
  const result = await validate(spec.name, await req.json().catch(() => null));
  if (!result.ok) return bad(result.errors);

  let found = false;
  const item = { ...result.value, id };
  await updateCollection(spec.name as ListName, (list) =>
    (list as { id: string }[]).map((x) => (x.id === id ? ((found = true), item) : x)) as never,
  );
  if (!found) return bad("Item não encontrado", 404);
  publish();
  return NextResponse.json(item);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { name, id } = await params;
  const spec = listSpec(name);
  if (!spec) return bad("Coleção desconhecida", 404);
  await updateCollection(spec.name as ListName, (list) => (list as { id: string }[]).filter((x) => x.id !== id) as never);
  publish();
  return NextResponse.json({ ok: true });
}
