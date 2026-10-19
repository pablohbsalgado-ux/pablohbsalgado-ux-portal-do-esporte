"use client";

import { Fragment, useState } from "react";
import { brl } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";

const STATUS: { value: OrderStatus; label: string; cls: string }[] = [
  { value: "pendente", label: "Pendente", cls: "bg-amber-100 text-amber-800" },
  { value: "pago", label: "Pago", cls: "bg-emerald-100 text-emerald-800" },
  { value: "entregue", label: "Entregue", cls: "bg-sky-100 text-sky-800" },
  { value: "cancelado", label: "Cancelado", cls: "bg-slate-200 text-slate-600" },
];

export function OrdersTable({ initial }: { initial: Order[] }) {
  const [orders, setOrders] = useState(initial);
  const [filter, setFilter] = useState<OrderStatus | "all" | "conferir">("all");
  const [open, setOpen] = useState<string | null>(null);

  // "A conferir": pendentes com comprovante enviado — a fila de trabalho da diretoria
  const toCheck = (o: Order) => o.status === "pendente" && !!o.paymentProof;
  const list = orders.filter((o) => filter === "all" || (filter === "conferir" ? toCheck(o) : o.status === filter));

  async function change(o: Order, status: OrderStatus) {
    if (status === "pago") {
      const what = o.memberId ? "ativar a associação" : "baixar o estoque dos produtos";
      const proof = o.paymentProof ? "" : "\n\nAtenção: o cliente ainda não enviou comprovante.";
      if (!confirm(`Confirmou o recebimento de ${brl(o.total)} na InfinitePay/banco? Marcar como pago vai ${what}.${proof}`)) return;
    }
    const res = await fetch(`/api/admin/orders/${o.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (!res.ok) return alert("Erro ao atualizar");
    const updated: Order = await res.json();
    setOrders((prev) => prev.map((x) => (x.id === o.id ? updated : x)));
  }

  function exportCsv() {
    const rows = [["pedido", "data", "status", "metodo", "total", "nome", "email", "telefone", "cpf", "tipo", "comprovante_enviado_em", "itens"]];
    for (const o of list) {
      rows.push([o.id, o.createdAt, o.status, o.method, o.total.toFixed(2), o.customer.name, o.customer.email, o.customer.phone, o.customer.cpf, o.memberId ? "adesão" : o.accountId ? "loja (conta)" : "loja", o.proofSubmittedAt ?? "",
        o.items.map((i) => `${i.quantity}x ${i.name}${i.size ? ` ${i.size}` : ""}${i.customization ? ` [${i.customization.name} ${i.customization.number}]` : ""}`).join(" | ")]);
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = `pedidos-lobo-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setFilter("conferir")} className={filter === "conferir" ? "chip-on" : "chip-off !border-lobo-red !text-lobo-red"}>
          A conferir ({orders.filter(toCheck).length})
        </button>
        {[{ value: "all" as const, label: "Todos" }, ...STATUS].map((s) => (
          <button key={s.value} onClick={() => setFilter(s.value)} className={filter === s.value ? "chip-on" : "chip-off"}>
            {s.label} ({s.value === "all" ? orders.length : orders.filter((o) => o.status === s.value).length})
          </button>
        ))}
        <button className="btn-ghost ml-auto" onClick={exportCsv}>Exportar planilha (CSV)</button>
      </div>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Pagamento</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {list.map((o) => (
              <Fragment key={o.id}>
                <tr className="cursor-pointer hover:bg-slate-50" onClick={() => setOpen(open === o.id ? null : o.id)}>
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs">{o.id}{o.demo && <span className="ml-1 rounded bg-amber-100 px-1 text-[10px] text-amber-800">demo</span>}</td>
                  <td className="whitespace-nowrap px-4 py-2.5">{new Date(o.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</td>
                  <td className="px-4 py-2.5">
                    {o.customer.name}
                    {o.memberId ? (
                      <span className="ml-2 rounded bg-lobo-red px-1.5 text-[10px] font-bold uppercase text-white">Adesão</span>
                    ) : o.accountId ? (
                      <span className="ml-2 rounded bg-lobo-navy px-1.5 text-[10px] font-bold uppercase text-white">Conta</span>
                    ) : null}
                    <span className="block text-xs text-slate-500">{o.customer.email}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-semibold">{brl(o.total)}</td>
                  <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs font-bold uppercase">{o.method === "pix" ? "Pix" : "Cartão"}</span>
                    {o.paymentProof ? (
                      <a href={`/api/admin/private/${o.paymentProof}`} target="_blank" rel="noreferrer" className="block whitespace-nowrap text-xs font-semibold text-lobo-red hover:underline">
                        Ver comprovante ↗
                      </a>
                    ) : o.status === "pendente" ? (
                      <span className="block whitespace-nowrap text-xs text-slate-400">sem comprovante</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={o.status}
                      onChange={(e) => change(o, e.target.value as OrderStatus)}
                      className={`rounded-full border-0 px-2 py-1 text-xs font-bold ${STATUS.find((s) => s.value === o.status)?.cls}`}
                      aria-label="Status do pedido"
                    >
                      {STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </td>
                </tr>
                {open === o.id && (
                  <tr className="bg-slate-50">
                    <td colSpan={6} className="px-4 py-3">
                      <ul className="space-y-1">
                        {o.items.map((i, idx) => (
                          <li key={idx}>
                            {i.quantity}× {i.name}
                            {i.size && ` · Tam. ${i.size}`}
                            {i.customization && ` · Personalização: ${i.customization.name} #${i.customization.number}`}
                            {" — "}{brl(i.unitPrice * i.quantity)}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs text-slate-500">
                        Tel.: {o.customer.phone || "—"} · CPF: {o.customer.cpf || "—"} · Estoque baixado: {o.stockApplied ? "sim" : "não"}
                        {o.proofSubmittedAt && ` · Comprovante enviado em ${new Date(o.proofSubmittedAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}`}
                        {o.method === "pix" && o.provider === "manual" && ` · No extrato, procure a identificação ${o.id.replace(/[^A-Za-z0-9]/g, "")}`}
                      </p>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {list.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Nenhum pedido.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
