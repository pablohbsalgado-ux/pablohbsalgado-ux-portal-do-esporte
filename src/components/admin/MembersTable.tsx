"use client";

import { Fragment, useMemo, useState } from "react";
import { ENROLLMENT_LABEL } from "@/lib/terms";
import type { Member, MemberStatus } from "@/lib/types";
import { formatCpfClient, formatPhoneClient } from "../account/format";

const STATUS: { value: MemberStatus; label: string; cls: string }[] = [
  { value: "pendente", label: "Pendente", cls: "bg-amber-100 text-amber-800" },
  { value: "ativo", label: "Ativo", cls: "bg-emerald-100 text-emerald-800" },
  { value: "cancelado", label: "Cancelado", cls: "bg-slate-200 text-slate-600" },
];

const fileUrl = (name: string) => `/api/admin/private/${name}`;

function age(birth: string) {
  const b = new Date(`${birth}T12:00:00Z`);
  const now = new Date();
  let a = now.getUTCFullYear() - b.getUTCFullYear();
  if (now.getUTCMonth() < b.getUTCMonth() || (now.getUTCMonth() === b.getUTCMonth() && now.getUTCDate() < b.getUTCDate())) a--;
  return a;
}

export function MembersTable({ initial }: { initial: Member[] }) {
  const [members, setMembers] = useState(initial);
  const [status, setStatus] = useState<MemberStatus | "all">("all");
  const [plan, setPlan] = useState("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const plans = [...new Set(members.map((m) => m.planName))];
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    return members
      .filter((m) => (status === "all" || m.status === status) && (plan === "all" || m.planName === plan))
      .filter((m) => !q || m.fullName.toLowerCase().includes(q) || m.email.includes(q) || m.course.toLowerCase().includes(q) || (digits.length >= 3 && m.cpf.includes(digits)))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [members, status, plan, query]);

  async function change(m: Member, next: MemberStatus) {
    const res = await fetch(`/api/admin/members/${m.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
    if (!res.ok) return alert("Erro ao atualizar");
    const updated: Member = await res.json();
    setMembers((prev) => prev.map((x) => (x.id === m.id ? updated : x)));
  }

  function exportCsv() {
    const header = ["plano", "status", "nome", "cpf", "nascimento", "idade", "sexo", "email", "celular", "instagram", "situacao_matricula", "curso", "modalidades", "termo_associado", "termo_atleta", "pedido", "ficha_enviada_em"];
    const lines = rows.map((m) => [
      m.planName, m.status, m.fullName, formatCpfClient(m.cpf), m.birthDate, age(m.birthDate), m.sex, m.email, formatPhoneClient(m.phone), `@${m.instagram}`,
      ENROLLMENT_LABEL[m.enrollmentStatus], m.course, m.modalities.join(", "), m.generalTermsAcceptedAt, m.athleteTermsAcceptedAt, m.orderId, m.createdAt,
    ]);
    const csv = [header, ...lines].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    link.download = `socios-lobo-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {[{ value: "all" as const, label: "Todos" }, ...STATUS].map((s) => (
          <button key={s.value} onClick={() => setStatus(s.value)} className={status === s.value ? "chip-on" : "chip-off"}>
            {s.label} ({s.value === "all" ? members.length : members.filter((m) => m.status === s.value).length})
          </button>
        ))}
        <select className="input w-auto" value={plan} onChange={(e) => setPlan(e.target.value)} aria-label="Filtrar por plano">
          <option value="all">Todos os planos</option>
          {plans.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <input className="input sm:max-w-xs" placeholder="Buscar nome, CPF, curso…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar sócios" />
        <button className="btn-ghost ml-auto" onClick={exportCsv}>Exportar planilha (CSV)</button>
      </div>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Sócio</th>
              <th className="px-4 py-3">Plano</th>
              <th className="px-4 py-3">Matrícula</th>
              <th className="px-4 py-3">Documentos</th>
              <th className="px-4 py-3">Enviada em</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((m) => (
              <Fragment key={m.id}>
                <tr className="cursor-pointer hover:bg-slate-50" onClick={() => setOpen(open === m.id ? null : m.id)}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      {m.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={fileUrl(m.photo)} alt="" className="h-10 w-10 flex-none rounded-full object-cover" />
                      ) : (
                        <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-lobo-paper font-display text-lobo-navy">{m.fullName[0]}</span>
                      )}
                      <span>
                        <span className="font-semibold">{m.fullName}</span>
                        <span className="block text-xs text-slate-500">{formatCpfClient(m.cpf)} · {m.email}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    {m.planName}
                    {m.athlete && m.modalities.length > 0 && <span className="block text-xs text-slate-500">{m.modalities.join(", ")}</span>}
                  </td>
                  <td className="px-4 py-2.5">{ENROLLMENT_LABEL[m.enrollmentStatus]}<span className="block text-xs text-slate-500">{m.course}</span></td>
                  <td className="whitespace-nowrap px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                    {m.enrollmentProof ? <a href={fileUrl(m.enrollmentProof)} target="_blank" rel="noreferrer" className="font-semibold text-lobo-navy hover:underline">Comprovante</a> : <span className="text-slate-400">—</span>}
                    {m.photo && <a href={fileUrl(m.photo)} target="_blank" rel="noreferrer" className="ml-3 font-semibold text-lobo-navy hover:underline">Foto</a>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5">{new Date(m.createdAt).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <select value={m.status} onChange={(e) => change(m, e.target.value as MemberStatus)} className={`rounded-full border-0 px-2 py-1 text-xs font-bold ${STATUS.find((s) => s.value === m.status)?.cls}`} aria-label="Status do sócio">
                      {STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </td>
                </tr>
                {open === m.id && (
                  <tr className="bg-slate-50">
                    <td colSpan={6} className="px-4 py-4">
                      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                        {[
                          ["Nascimento", `${new Date(`${m.birthDate}T12:00:00Z`).toLocaleDateString("pt-BR", { timeZone: "UTC" })} (${age(m.birthDate)} anos)`],
                          ["Sexo", m.sex],
                          ["Celular", formatPhoneClient(m.phone)],
                          ["Instagram", `@${m.instagram}`],
                          ["Termo do associado", m.generalTermsAcceptedAt ? `Aceito em ${new Date(m.generalTermsAcceptedAt).toLocaleString("pt-BR")}` : "—"],
                          ["Termo do atleta", m.athlete ? (m.athleteTermsAcceptedAt ? `Aceito em ${new Date(m.athleteTermsAcceptedAt).toLocaleString("pt-BR")}` : "Não aceito") : "Não se aplica"],
                          ["Pedido de pagamento", m.orderId || "—"],
                          ["Conta no site", m.accountId ? "Sim (logado ao enviar)" : "Não"],
                        ].map(([k, v]) => (
                          <div key={k}>
                            <dt className="label !mb-0">{k}</dt>
                            <dd className="break-words">
                              {k === "Instagram" ? <a href={`https://instagram.com/${m.instagram}`} target="_blank" rel="noreferrer" className="text-lobo-navy hover:underline">{v}</a> : k === "Celular" ? <a href={`https://wa.me/55${m.phone}`} target="_blank" rel="noreferrer" className="text-lobo-navy hover:underline">{v}</a> : v}
                            </dd>
                          </div>
                        ))}
                      </dl>
                      <p className="mt-3 text-xs text-slate-500">
                        O status muda sozinho quando o pagamento é aprovado (Ativo) ou cancelado. Ajuste manual aqui só quando necessário (ex.: pagamento em dinheiro).
                      </p>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Nenhuma ficha encontrada.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
