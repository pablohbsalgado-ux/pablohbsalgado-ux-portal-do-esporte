"use client";

import { useState } from "react";

export function ChangePassword() {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <button className="mt-3 w-full text-xs font-bold uppercase text-lobo-navy hover:underline" onClick={() => setOpen(true)}>
        Alterar senha
      </button>
    );
  }
  return (
    <form
      className="mt-4 space-y-2 border-t pt-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        if (f.get("next") !== f.get("next2")) return setMsg({ ok: false, text: "As senhas novas não conferem" });
        setBusy(true);
        const res = await fetch("/api/conta/senha", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ current: f.get("current"), next: f.get("next") }) });
        const data = await res.json().catch(() => ({}));
        setBusy(false);
        setMsg(res.ok ? { ok: true, text: "Senha alterada ✓" } : { ok: false, text: data.error ?? "Erro ao alterar" });
        if (res.ok) e.currentTarget.reset();
      }}
    >
      <label className="label" htmlFor="pw-cur">Senha atual</label>
      <input id="pw-cur" name="current" type="password" required className="input" autoComplete="current-password" />
      <label className="label" htmlFor="pw-new">Nova senha</label>
      <input id="pw-new" name="next" type="password" required minLength={8} className="input" autoComplete="new-password" />
      <label className="label" htmlFor="pw-new2">Repita a nova senha</label>
      <input id="pw-new2" name="next2" type="password" required minLength={8} className="input" autoComplete="new-password" />
      {msg && <p className={`text-sm ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>{msg.text}</p>}
      <button disabled={busy} className="btn-navy w-full">{busy ? "Salvando…" : "Salvar nova senha"}</button>
    </form>
  );
}
