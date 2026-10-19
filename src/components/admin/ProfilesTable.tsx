"use client";

import Link from "next/link";
import { useState } from "react";

export interface ProfileRow {
  id: string;
  name: string;
  configured: boolean;
  lastLoginAt: string;
  passwordChangedAt: string;
  lastChangeAt: string;
  changes: number;
  failedLogins: number;
}

const when = (iso: string) => (iso ? new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—");

export function ProfilesTable({ rows: initial }: { rows: ProfileRow[] }) {
  const [rows, setRows] = useState(initial);
  const [shown, setShown] = useState<{ name: string; password: string } | null>(null);

  async function generate(r: ProfileRow) {
    const own = r.id === "data_owner";
    const msg = own
      ? "Gerar uma nova senha para o próprio Data Owner? Você será desconectado e precisará entrar com a senha nova."
      : `Gerar uma nova senha para ${r.name}? A senha atual deixa de funcionar e o perfil é desconectado.`;
    if (!confirm(msg)) return;
    const res = await fetch(`/api/admin/profiles/${r.id}/password`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return alert((data.errors ?? ["Erro"]).join(" · "));
    setShown({ name: r.name, password: data.password });
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, configured: true, passwordChangedAt: new Date().toISOString() } : x)));
  }

  return (
    <>
      {shown && (
        <div className="mb-4 rounded-lg border-2 border-emerald-600 bg-emerald-50 p-4 text-sm" role="status">
          Nova senha de <strong>{shown.name}</strong>:{" "}
          <code className="select-all rounded bg-white px-2 py-1 font-mono text-base font-bold">{shown.password}</code>
          <span className="mt-1 block text-xs text-emerald-800">
            Entregue pessoalmente ou por mensagem privada. Ela não será mostrada de novo e não fica guardada em texto em nenhum lugar.
          </span>
          <button className="mt-2 text-xs font-bold uppercase text-emerald-800 underline" onClick={() => setShown(null)}>Já anotei, fechar</button>
        </div>
      )}
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Perfil</th>
              <th className="px-4 py-3">Último acesso</th>
              <th className="px-4 py-3">Última alteração</th>
              <th className="px-4 py-3">Alterações</th>
              <th className="px-4 py-3">Senha trocada em</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3">
                  <span className="font-semibold">{r.name}</span>
                  {r.id === "data_owner" && <span className="ml-2 rounded bg-lobo-red px-1.5 text-[10px] font-bold uppercase text-white">Histórico</span>}
                  {!r.configured && <span className="block text-xs text-amber-700">Sem senha cadastrada</span>}
                  {r.failedLogins > 0 && <span className="block text-xs text-red-600">{r.failedLogins} tentativa(s) com senha errada</span>}
                </td>
                <td className="whitespace-nowrap px-4 py-3">{when(r.lastLoginAt)}</td>
                <td className="whitespace-nowrap px-4 py-3">{when(r.lastChangeAt)}</td>
                <td className="px-4 py-3">
                  {r.changes > 0 ? <Link href={`/admin/historico?perfil=${r.id}`} className="font-semibold text-lobo-navy hover:underline">{r.changes} ver</Link> : "0"}
                </td>
                <td className="whitespace-nowrap px-4 py-3">{when(r.passwordChangedAt)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <button className="text-xs font-bold uppercase text-lobo-navy hover:underline" onClick={() => generate(r)}>Gerar nova senha</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
