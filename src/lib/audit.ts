// Histórico de alterações do painel (somente inclusão).
//   modo supabase → tabela audit_log; as funções do banco só permitem inserir e ler,
//                   então nenhum perfil (nem o Data Owner) consegue apagar ou editar registros
//   modo json     → data/audit.jsonl, uma linha por registro, sempre acrescentada no fim

import { promises as fs } from "fs";
import path from "path";
import { clientIp, type PublicAdminUser } from "./admin-users";
import { SPECS } from "./schema";
import { newId, supabaseRpc, usingSupabase } from "./store";
import type { AuditChange, AuditEntry, CollectionName } from "./types";

const FILE = path.join(process.cwd(), "data", "audit.jsonl");
const MAX_VALUE = 300;

function show(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Sim" : "Não";
  const s = Array.isArray(v) ? v.join(" · ") : typeof v === "object" ? JSON.stringify(v) : String(v);
  return s.length > MAX_VALUE ? `${s.slice(0, MAX_VALUE)}…` : s;
}

/** Diferença campo a campo entre duas versões de um registro, com os rótulos do painel. */
export function diffRecords(collection: CollectionName, before: Record<string, unknown> | undefined, after: Record<string, unknown> | undefined): AuditChange[] {
  const labels = Object.fromEntries(SPECS[collection].fields.map((f) => [f.key, f.label]));
  const keys = [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])].filter((k) => k !== "id");
  const changes: AuditChange[] = [];
  for (const k of keys) {
    const a = show(before?.[k]);
    const b = show(after?.[k]);
    if (a !== b) changes.push({ field: labels[k] ?? k, before: a, after: b });
  }
  return changes;
}

/** Descrição curta do item alterado, para a coluna "Item" do histórico. */
export function describeItem(collection: CollectionName, item: Record<string, unknown> | undefined) {
  if (!item) return "";
  const v = (k: string) => String(item[k] ?? "");
  switch (collection) {
    case "games":
      return `${v("modality")} ${v("category")} × ${v("opponent")} (${v("date").split("-").reverse().join("/")})`;
    case "trainings":
      return `${v("modality")} ${v("category")} · ${v("day")} ${v("start")}–${v("end")}`;
    case "titles":
      return `${v("championship")} ${v("year")}`;
    case "settings":
      return "Configurações gerais";
    default:
      return v("name") || v("fullName") || v("id");
  }
}

export function areaLabel(collection: CollectionName) {
  return SPECS[collection].label;
}

export async function audit(
  actor: Pick<PublicAdminUser, "id" | "name"> | { id: string; name: string },
  entry: Pick<AuditEntry, "action" | "area" | "target"> & { changes?: AuditChange[] },
) {
  const record: AuditEntry = {
    id: newId("a_"),
    at: new Date().toISOString(),
    actorId: actor.id,
    actorName: actor.name,
    action: entry.action,
    area: entry.area,
    target: entry.target,
    changes: entry.changes ?? [],
    ip: await clientIp().catch(() => ""),
  };
  try {
    if (usingSupabase()) {
      await supabaseRpc("portal_audit_add", { p_token: process.env.SUPABASE_PORTAL_TOKEN, p_entry: record });
    } else {
      await fs.mkdir(path.dirname(FILE), { recursive: true });
      await fs.appendFile(FILE, JSON.stringify(record) + "\n", "utf8");
    }
  } catch (err) {
    // o histórico nunca pode derrubar a ação em si, mas a falha fica no log do servidor
    console.error("[audit] falha ao registrar", record, err);
  }
}

/** Registros mais recentes primeiro. */
export async function listAudit(limit = 2000): Promise<AuditEntry[]> {
  if (usingSupabase()) {
    return (await supabaseRpc<AuditEntry[]>("portal_audit_list", { p_token: process.env.SUPABASE_PORTAL_TOKEN, p_limit: limit })) ?? [];
  }
  try {
    const lines = (await fs.readFile(FILE, "utf8")).trim().split("\n").filter(Boolean);
    return lines.slice(-limit).reverse().map((l) => JSON.parse(l) as AuditEntry);
  } catch {
    return [];
  }
}
