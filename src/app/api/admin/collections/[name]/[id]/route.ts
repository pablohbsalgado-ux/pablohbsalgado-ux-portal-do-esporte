import { NextResponse } from "next/server";
import { bad, publish, specFor, validate } from "@/lib/admin";
import { requireAdmin } from "@/lib/admin-users";
import { areaLabel, audit, describeItem, diffRecords } from "@/lib/audit";
import { updateCollection } from "@/lib/store";
import type { Collections } from "@/lib/types";

type Ctx = { params: Promise<{ name: string; id: string }> };
type ListName = Exclude<keyof Collections, "settings" | "orders" | "accounts" | "members" | "adminUsers">;
type Row = Record<string, unknown> & { id: string };

function listSpec(name: string) {
  const spec = specFor(name);
  return spec && !spec.singleton && !spec.readOnly ? spec : null;
}

export async function PUT(req: Request, { params }: Ctx) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const { name, id } = await params;
  const spec = listSpec(name);
  if (!spec) return bad("Coleção desconhecida", 404);
  const result = await validate(spec.name, await req.json().catch(() => null));
  if (!result.ok) return bad(result.errors);

  let before: Row | undefined;
  const item = { ...result.value, id };
  await updateCollection(spec.name as ListName, (list) =>
    (list as unknown as Row[]).map((x) => (x.id === id ? ((before = x), item) : x)) as never,
  );
  if (!before) return bad("Item não encontrado", 404);
  publish();
  const changes = diffRecords(spec.name, before, item);
  if (changes.length) {
    await audit(admin, { action: "editar", area: areaLabel(spec.name), target: describeItem(spec.name, item), changes });
  }
  return NextResponse.json(item);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const { name, id } = await params;
  const spec = listSpec(name);
  if (!spec) return bad("Coleção desconhecida", 404);
  let removed: Row | undefined;
  await updateCollection(spec.name as ListName, (list) =>
    (list as unknown as Row[]).filter((x) => (x.id === id ? ((removed = x), false) : true)) as never,
  );
  publish();
  if (removed) {
    // guarda o conteúdo excluído no histórico, para dar para recuperar se preciso
    await audit(admin, { action: "excluir", area: areaLabel(spec.name), target: describeItem(spec.name, removed), changes: diffRecords(spec.name, removed, undefined) });
  }
  return NextResponse.json({ ok: true });
}
