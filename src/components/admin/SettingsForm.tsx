"use client";

import { useState } from "react";
import { SPECS } from "@/lib/schema";
import { RecordForm } from "./RecordForm";

export function SettingsForm({ initial }: { initial: Record<string, unknown> }) {
  const [values, setValues] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="card max-w-3xl p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        const res = await fetch("/api/admin/collections/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
        const data = await res.json().catch(() => ({}));
        setSaving(false);
        if (res.ok) setValues(data);
        setMsg(res.ok ? { ok: true, text: "Configurações salvas e publicadas ✓" } : { ok: false, text: (data.errors ?? ["Erro ao salvar"]).join(" · ") });
      }}
    >
      <RecordForm fields={SPECS.settings.fields} values={values} onChange={setValues} modalities={[]} />
      <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
        Atenção: ao renomear ou remover uma modalidade, jogos, treinos e títulos que usam o nome antigo precisam ser atualizados.
      </p>
      {msg && <p className={`mt-4 text-sm ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>{msg.text}</p>}
      <button className="btn-navy mt-5" disabled={saving}>{saving ? "Salvando…" : "Salvar e publicar"}</button>
    </form>
  );
}
