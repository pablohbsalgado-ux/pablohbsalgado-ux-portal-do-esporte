// Camada de armazenamento do conteúdo dinâmico.
//
// Todo o site lê e grava o conteúdo apenas por aqui, então trocar o "banco"
// não exige mudar nenhuma página:
//   CONTENT_STORE=json      → arquivos em ./data (padrão; servidor com disco gravável)
//   CONTENT_STORE=supabase  → tabela "collections" no Supabase (Render/Vercel etc.)
// Os arquivos de ./data também servem de conteúdo inicial (seed) para o Supabase.

import { promises as fs } from "fs";
import path from "path";
import type { CollectionName, Collections } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

interface Adapter {
  read(name: CollectionName): Promise<unknown | undefined>;
  write(name: CollectionName, value: unknown): Promise<void>;
}

async function readSeed(name: CollectionName): Promise<unknown | undefined> {
  try {
    return JSON.parse(await fs.readFile(path.join(DATA_DIR, `${name}.json`), "utf8"));
  } catch {
    return undefined;
  }
}

const jsonAdapter: Adapter = {
  read: readSeed,
  async write(name, value) {
    const file = path.join(DATA_DIR, `${name}.json`);
    const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(tmp, JSON.stringify(value, null, 2) + "\n", "utf8");
    await fs.rename(tmp, file); // troca atômica: nunca deixa um arquivo pela metade
  },
};

/**
 * Chamada às funções do banco (supabase/schema.sql). As tabelas ficam fechadas
 * por RLS; leitura e gravação só passam pelas funções, que exigem o token
 * secreto SUPABASE_PORTAL_TOKEN. Funciona com a chave pública do projeto.
 */
export async function supabaseRpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const url = process.env.SUPABASE_URL!.replace(/\/$/, "");
  const key = process.env.SUPABASE_KEY!;
  const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Supabase: falha em ${fn} (${res.status}) ${await res.text()}`);
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

function supabaseAdapter(): Adapter {
  const p_token = process.env.SUPABASE_PORTAL_TOKEN;
  return {
    async read(name) {
      const data = await supabaseRpc<unknown>("portal_get", { p_token, p_name: name });
      return data ?? (await readSeed(name));
    },
    async write(name, value) {
      await supabaseRpc("portal_set", { p_token, p_name: name, p_data: value });
    },
  };
}

export function usingSupabase() {
  return process.env.CONTENT_STORE === "supabase";
}

function adapter(): Adapter {
  if (usingSupabase()) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY || !process.env.SUPABASE_PORTAL_TOKEN) {
      throw new Error("CONTENT_STORE=supabase exige SUPABASE_URL, SUPABASE_KEY e SUPABASE_PORTAL_TOKEN");
    }
    return supabaseAdapter();
  }
  return jsonAdapter;
}

const EMPTY: { [K in CollectionName]: () => Collections[K] } = {
  games: () => [],
  trainings: () => [],
  products: () => [],
  plans: () => [],
  titles: () => [],
  orders: () => [],
  accounts: () => [],
  members: () => [],
  adminUsers: () => [],
  settings: () => ({
    siteName: "Portal do Esporte",
    tagline: "",
    modalities: [],
    customizationPrice: 0,
    memberDiscountPercent: 0,
    instagram: "",
    whatsapp: "",
    email: "",
    announcement: "",
    schedulePeriod: "",
    scheduleNotice: "",
  }),
};

export async function getCollection<K extends CollectionName>(name: K): Promise<Collections[K]> {
  const value = await adapter().read(name);
  return (value ?? EMPTY[name]()) as Collections[K];
}

// Fila por coleção: leituras-modificações-gravações dentro do mesmo processo
// não se atropelam (ex.: dois pedidos baixando o mesmo estoque).
const queues = new Map<string, Promise<unknown>>();

export function updateCollection<K extends CollectionName>(
  name: K,
  fn: (current: Collections[K]) => Collections[K] | Promise<Collections[K]>,
): Promise<Collections[K]> {
  const prev = queues.get(name) ?? Promise.resolve();
  const next = prev.catch(() => undefined).then(async () => {
    const updated = await fn(await getCollection(name));
    await adapter().write(name, updated);
    return updated;
  });
  queues.set(name, next);
  return next;
}

export function setCollection<K extends CollectionName>(name: K, value: Collections[K]) {
  return updateCollection(name, () => value);
}

export function newId(prefix = "") {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
