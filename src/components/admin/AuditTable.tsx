"use client";

import { Fragment, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { AuditEntry } from "@/lib/types";

const ACTIONS: Record<AuditEntry["action"], { label: string; cls: string }> = {
  criar: { label: "Criou", cls: "bg-emerald-100 text-emerald-800" },
  editar: { label: "Editou", cls: "bg-sky-100 text-sky-800" },
  excluir: { label: "Excluiu", cls: "bg-red-100 text-red-700" },
  status: { label: "Mudou status", cls: "bg-violet-100 text-violet-800" },
  senha: { label: "Senha", cls: "bg-amber-100 text-amber-800" },
  upload: { label: "Enviou imagem", cls: "bg-slate-100 text-slate-700" },
  login: { label: "Entrou", cls: "bg-slate-100 text-slate-600" },
  logout: { label: "Saiu", cls: "bg-slate-100 text-slate-600" },
  login_falhou: { label: "Senha errada", cls: "bg-red-600 text-white" },
};

const fmt = (iso: string) => new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "medium", timeZone: "America/Sao_Paulo" });

export function AuditTable({ entries, profiles }: { entries: AuditEntry[]; profiles: { id: string; name: string }[] }) {
  const params = useSearchParams();
  const [profile, setProfile] = useState(params.get("perfil") ?? "all");
  const [area, setArea] = useState("all");
  const [action, setAction] = useState("all");
  const [showAccess, setShowAccess] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const areas = useMemo(() => [...new Set(entries.map((e) => e.area))].sort(), [entries]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      const isAccess = e.action === "login" || e.action === "logout";
      if (!showAccess && isAccess) return false;
      if (profile !== "all" && e.actorId !== profile) return false;
      if (area !== "all" && e.area !== area) return false;
      if (action !== "all" && e.action !== action) return false;
      const day = e.at.slice(0, 10);
      if (from && day < from) return false;
      if (to && day > to) return false;
      if (q && !`${e.target} ${e.area} ${e.actorName} ${e.changes.map((c) => `${c.field} ${c.before} ${c.after}`).join(" ")}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [entries, profile, area, action, showAccess, from, to, query]);

  function exportCsv() {
    const header = ["data_hora", "perfil", "acao", "area", "item", "campo", "antes", "depois", "ip"];
    const lines: (string | number)[][] = [];
    for (const e of rows) {
      const base = [fmt(e.at), e.actorName, ACTIONS[e.action]?.label ?? e.action, e.area, e.target];
      if (e.changes.length === 0) lines.push([...base, "", "", "", e.ip]);
      for (const c of e.changes) lines.push([...base, c.field, c.before, c.after, e.ip]);
    }
    const csv = [header, ...lines].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    link.download = `historico-painel-lobo-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  }

  return (
    <>
      <div className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label" htmlFor="au-p">Perfil</label>
          <select id="au-p" className="input" value={profile} onChange={(e) => setProfile(e.target.value)}>
            <option value="all">Todos os perfis</option>
            {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="au-a">Área</label>
          <select id="au-a" className="input" value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="all">Todas as áreas</option>
            {areas.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="au-t">Ação</label>
          <select id="au-t" className="input" value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="all">Todas as ações</option>
            {Object.entries(ACTIONS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="au-q">Buscar</label>
          <input id="au-q" className="input" placeholder="Item, campo, valor…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="au-from">De</label>
          <input id="au-from" type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="au-to">Até</label>
          <input id="au-to" type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm text-lobo-navy">
          <input type="checkbox" className="h-4 w-4 accent-lobo-navy" checked={showAccess} onChange={(e) => setShowAccess(e.target.checked)} />
          Mostrar entradas e saídas do painel
        </label>
        <div className="flex items-end">
          <button className="btn-ghost w-full" onClick={exportCsv}>Exportar planilha (CSV)</button>
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-500">{rows.length} registro(s)</p>
      <div className="card mt-2 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Data e hora</th>
              <th className="px-4 py-3">Perfil</th>
              <th className="px-4 py-3">Ação</th>
              <th className="px-4 py-3">Área</th>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Campos</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((e) => (
              <Fragment key={e.id}>
                <tr className={`${e.changes.length ? "cursor-pointer" : ""} hover:bg-slate-50`} onClick={() => e.changes.length && setOpen(open === e.id ? null : e.id)}>
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs">{fmt(e.at)}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-semibold">{e.actorName}</td>
                  <td className="px-4 py-2.5">
                    <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold ${ACTIONS[e.action]?.cls ?? ""}`}>{ACTIONS[e.action]?.label ?? e.action}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5">{e.area}</td>
                  <td className="px-4 py-2.5">{e.target}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-lobo-navy">
                    {e.changes.length ? <span className="font-semibold underline">{e.changes.length} campo(s) {open === e.id ? "▲" : "▼"}</span> : "—"}
                  </td>
                </tr>
                {open === e.id && (
                  <tr className="bg-slate-50">
                    <td colSpan={6} className="px-4 py-3">
                      <table className="w-full text-xs">
                        <thead className="text-left uppercase text-slate-500">
                          <tr>
                            <th className="py-1 pr-4">Campo</th>
                            <th className="py-1 pr-4">Antes</th>
                            <th className="py-1">Depois</th>
                          </tr>
                        </thead>
                        <tbody>
                          {e.changes.map((c, i) => (
                            <tr key={i} className="border-t align-top">
                              <td className="py-1.5 pr-4 font-semibold">{c.field}</td>
                              <td className="py-1.5 pr-4 text-red-700 line-through decoration-red-300">{c.before}</td>
                              <td className="py-1.5 text-emerald-800">{c.after}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {e.ip && <p className="mt-2 text-[11px] text-slate-400">IP: {e.ip}</p>}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Nenhum registro para estes filtros.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
