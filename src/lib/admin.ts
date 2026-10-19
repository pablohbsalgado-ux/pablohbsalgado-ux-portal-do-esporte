import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { SPECS, validateRecord } from "./schema";
import { getCollection } from "./store";
import type { CollectionName } from "./types";

export function specFor(name: string) {
  return (Object.keys(SPECS) as CollectionName[]).includes(name as CollectionName) ? SPECS[name as CollectionName] : null;
}

export async function validate(name: CollectionName, raw: unknown) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false as const, errors: ["Dados inválidos"] };
  const modalities = name === "settings" ? [] : (await getCollection("settings")).modalities;
  return validateRecord(SPECS[name], raw as Record<string, unknown>, { modalities });
}

/** Republica todo o site público após qualquer alteração no painel. */
export function publish() {
  revalidatePath("/", "layout");
}

export function bad(errors: string[] | string, status = 400) {
  return NextResponse.json({ errors: Array.isArray(errors) ? errors : [errors] }, { status });
}
