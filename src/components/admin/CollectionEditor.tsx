"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { brl } from "@/lib/format";
import { SPECS, type FieldSpec } from "@/lib/schema";
import type { CollectionName } from "@/lib/types";
import { RecordForm, emptyRecord } from "./RecordForm";

type Row = Record<string, unknown> & { id: string };

function display(f: FieldSpec | undefined, v: unknown) {
  if (!f) return String(v ?? "");
  if (v === null || v === undefined || v === "") return "—";
  if (f.type === "money") return brl(Number(v));
  if (f.type === "boolean") return v ? "✓" : "—";
  if (f.type === "date") return String(v).split("-").reverse().join("/");
  if (f.type === "select") return f.options?.find((o) => o.value === v)?.label ?? String(v);
  if (Array.isArray(v)) return `${v.length} itens`;
  return String(v);
}

export function CollectionEditor({ name, initial, modalities }: { name: CollectionName; initial: Record<string, unknown>[]; modalities: string[] }) {
  const spec = SPECS[name];
  const [rows, setRows] = useState<Row[]>(initial as Row[]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<{ id: string | null; values: Record<string, unknown> } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const params = useSearchParams();

  useEffect(() => {
    const id = params.get("edit");
    const row = id && rows.find((r) => r.id === id);
    if (row) setEditing({ id: row.id, values: row });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const fieldMap = useMemo(() => Object.fromEntries(spec.fields.map((f) => [f.key, f])), [spec]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q)) : rows;
    if (!spec.sortBy) return list;
    const { key, dir } = spec.sortBy;
    return [...list].sort((a, b) => String(a[key]).localeCompare(String(b[key]), "pt-BR", { numeric: true }) * (dir === "asc" ? 1 : -1));
  }, [rows, query, spec.sortBy]);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    setErrors([]);
    const url = editing.id ? `/api/admin/collections/${name}/${editing.id}` : `/api/admin/collections/${name}`;
    const res = await fetch(url, { method: editing.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing.values) });
    const data = await res.json().catch(() => ({ errors: ["Resposta inválida do servidor"] }));
    setSaving(false);
    if (res.status === 401) return (window.location.href = "/admin/login");
    if (!res.ok) return setErrors(data.errors ?? ["Erro ao salvar"]);
    setRows((prev) => (editing.id ? prev.map((r) => (r.id === editing.id ? data : r)) : [...prev, data]));
    setEditing(null);
    flash("Salvo e publicado no site ✓");
  }

  async function remove(row: Row) {
    if (!confirm(`Excluir este ${spec.singular}? Esta ação não pode ser desfeita.`)) return;
    const res = await fetch(`/api/admin/collections/${name}/${row.id}`, { method: "DELETE" });
    if (!res.ok) return alert("Erro ao excluir");
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    flash("Excluído ✓");
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input className="input sm:max-w-xs" placeholder="Buscar…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar" />
        <button className="btn-red" onClick={() => { setErrors([]); setEditing({ id: null, values: emptyRecord(spec.fields) }); }}>
          + Novo {spec.singular}
        </button>
      </div>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {spec.columns.map((c) => <th key={c} className="whitespace-nowrap px-4 py-3">{fieldMap[c]?.label ?? c}</th>)}
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {visible.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                {spec.columns.map((c) => (
                  <td key={c} className={`whitespace-nowrap px-4 py-2.5 ${c === "stock" && Number(r[c]) <= 5 ? "font-bold text-red-600" : ""}`}>
                    {display(fieldMap[c], r[c])}
                  </td>
                ))}
                <td className="whitespace-nowrap px-4 py-2.5 text-right">
                  <button className="font-semibold text-lobo-navy hover:underline" onClick={() => { setErrors([]); setEditing({ id: r.id, values: r }); }}>Editar</button>
                  <button
                    className="ml-3 text-slate-500 hover:underline"
                    onClick={() => { setErrors([]); const { id: _id, ...copy } = r; setEditing({ id: null, values: copy }); }}
                    title="Criar uma cópia"
                  >
                    Duplicar
                  </button>
                  <button className="ml-3 text-red-600 hover:underline" onClick={() => remove(r)}>Excluir</button>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr><td colSpan={spec.columns.length + 1} className="px-4 py-8 text-center text-slate-500">Nada por aqui ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <button className="absolute inset-0 bg-black/50" aria-label="Fechar" onClick={() => setEditing(null)} />
          <form
            className="absolute right-0 top-0 flex h-full w-full max-w-xl animate-slidein flex-col bg-white shadow-2xl"
            onSubmit={(e) => { e.preventDefault(); save(); }}
          >
            <header className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-2xl text-lobo-navy">{editing.id ? `Editar ${spec.singular}` : `Novo ${spec.singular}`}</h2>
              <button type="button" onClick={() => setEditing(null)} className="text-slate-500">✕</button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <RecordForm fields={spec.fields} values={editing.values} onChange={(values) => setEditing({ ...editing, values })} modalities={modalities} />
            </div>
            <footer className="border-t px-6 py-4">
              {errors.length > 0 && (
                <ul className="mb-3 list-disc rounded-lg bg-red-50 py-2 pl-8 pr-3 text-sm text-red-700">
                  {errors.map((e) => <li key={e}>{e}</li>)}
                </ul>
              )}
              <div className="flex justify-end gap-2">
                <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>Cancelar</button>
                <button className="btn-navy" disabled={saving}>{saving ? "Salvando…" : "Salvar e publicar"}</button>
              </div>
            </footer>
          </form>
        </div>
      )}

      {toast && <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-lobo-navy px-4 py-2.5 text-sm text-white shadow-lg">{toast}</div>}
    </>
  );
}
