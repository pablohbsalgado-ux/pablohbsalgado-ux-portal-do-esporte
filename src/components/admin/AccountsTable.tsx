"use client";

import { Fragment, useMemo, useState } from "react";
import { brl } from "@/lib/format";
import type { Order, PublicAccount } from "@/lib/types";
import { formatCpfClient, formatPhoneClient } from "../account/format";

export interface AccountRow extends PublicAccount {
  orders: Pick<Order, "id" | "createdAt" | "status" | "total" | "method" | "items">[];
  isMember: boolean;
}

const STATUS_CLS: Record<Order["status"], string> = {
  pendente: "bg-amber-100 text-amber-800",
  pago: "bg-emerald-100 text-emerald-800",
  entregue: "bg-sky-100 text-sky-800",
  cancelado: "bg-slate-200 text-slate-600",
};

export function AccountsTable({ initial }: { initial: AccountRow[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [temp, setTemp] = useState<{ id: string; password: string } | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    return initial
      .filter((a) => !q || a.fullName.toLowerCase().includes(q) || a.email.includes(q) || (digits.length >= 3 && (a.cpf.includes(digits) || a.phone.includes(digits))))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [initial, query]);

  const paidTotal = (a: AccountRow) => a.orders.filter((o) => o.status === "pago" || o.status === "entregue").reduce((s, o) => s + o.total, 0);

  async function resetPassword(a: AccountRow) {
    if (!confirm(`Gerar uma senha provisória para ${a.fullName}? A senha atual deixa de funcionar.`)) return;
    const res = await fetch(`/api/admin/accounts/${a.id}/password`, { method: "POST" });
    if (!res.ok) return alert("Não foi possível gerar a senha");
    setTemp({ id: a.id, password: (await res.json()).password });
  }

  function exportCsv() {
    const header = ["nome", "cpf", "telefone", "email", "cadastro", "pedidos", "total_pago", "socio"];
    const lines = rows.map((a) => [a.fullName, formatCpfClient(a.cpf), formatPhoneClient(a.phone), a.email, a.createdAt.slice(0, 10), a.orders.length, paidTotal(a).toFixed(2), a.isMember ? "sim" : "não"]);
    const csv = [header, ...lines].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    link.download = `clientes-lobo-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input className="input sm:max-w-sm" placeholder="Buscar por nome, e-mail, CPF ou telefone…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar clientes" />
        <span className="text-sm text-slate-500">{rows.length} de {initial.length} contas</span>
        <button className="btn-ghost sm:ml-auto" onClick={exportCsv}>Exportar planilha (CSV)</button>
      </div>

      {temp && (
        <div className="mt-4 rounded-lg border-2 border-emerald-600 bg-emerald-50 p-4 text-sm" role="status">
          Senha provisória gerada: <code className="rounded bg-white px-2 py-1 font-mono text-base font-bold">{temp.password}</code>
          <span className="block text-xs text-emerald-800">Envie para o cliente por WhatsApp. Ela não será mostrada de novo.</span>
          <button className="mt-2 text-xs font-bold uppercase text-emerald-800 underline" onClick={() => setTemp(null)}>Fechar</button>
        </div>
      )}

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">CPF</th>
              <th className="px-4 py-3">Telefone</th>
              <th className="px-4 py-3">Pedidos</th>
              <th className="px-4 py-3">Total pago</th>
              <th className="px-4 py-3">Cadastro</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((a) => (
              <Fragment key={a.id}>
                <tr className="cursor-pointer hover:bg-slate-50" onClick={() => setOpen(open === a.id ? null : a.id)}>
                  <td className="px-4 py-2.5">
                    <span className="font-semibold">{a.fullName}</span>
                    {a.isMember && <span className="ml-2 rounded bg-lobo-red px-1.5 text-[10px] font-bold uppercase text-white">Sócio</span>}
                    <span className="block text-xs text-slate-500">{a.email}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs">{formatCpfClient(a.cpf)}</td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <a href={`https://wa.me/55${a.phone}`} target="_blank" rel="noreferrer" className="text-lobo-navy hover:underline" onClick={(e) => e.stopPropagation()}>
                      {formatPhoneClient(a.phone)}
                    </a>
                  </td>
                  <td className="px-4 py-2.5">{a.orders.length}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-semibold">{brl(paidTotal(a))}</td>
                  <td className="whitespace-nowrap px-4 py-2.5">{new Date(a.createdAt).toLocaleDateString("pt-BR")}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right">
                    <button className="text-xs font-bold uppercase text-lobo-navy hover:underline" onClick={(e) => { e.stopPropagation(); resetPassword(a); }}>
                      Senha provisória
                    </button>
                  </td>
                </tr>
                {open === a.id && (
                  <tr className="bg-slate-50">
                    <td colSpan={7} className="px-4 py-3">
                      {a.orders.length === 0 ? (
                        <p className="text-slate-500">Nenhum pedido feito por esta conta.</p>
                      ) : (
                        <ul className="space-y-2">
                          {a.orders.map((o) => (
                            <li key={o.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span className="font-mono text-xs">{o.id}</span>
                              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_CLS[o.status]}`}>{o.status}</span>
                              <span className="text-xs text-slate-500">{new Date(o.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span>
                              <span className="text-slate-700">
                                {o.items.map((i) => `${i.quantity}× ${i.name}${i.lot ? ` — ${i.lot}` : ""}${i.size ? ` (${i.size})` : ""}${i.customization ? ` [${i.customization.name} ${i.customization.number}]` : ""}`).join(" · ")}
                              </span>
                              <strong>{brl(o.total)}</strong>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Nenhuma conta encontrada.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
