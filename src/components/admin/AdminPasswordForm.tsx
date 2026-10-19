"use client";

import { useState } from "react";

export function AdminPasswordForm() {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="card space-y-3 p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const f = new FormData(form);
        if (f.get("next") !== f.get("next2")) return setMsg({ ok: false, text: "As senhas novas não conferem" });
        setBusy(true);
        const res = await fetch("/api/admin/me/password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ current: f.get("current"), next: f.get("next") }),
        });
        const data = await res.json().catch(() => ({}));
        setBusy(false);
        if (res.ok) form.reset();
        setMsg(res.ok ? { ok: true, text: "Senha alterada ✓" } : { ok: false, text: (data.errors ?? ["Erro ao alterar"]).join(" · ") });
      }}
    >
      <div>
        <label className="label" htmlFor="ap-cur">Senha atual</label>
        <input id="ap-cur" name="current" type="password" required className="input" autoComplete="current-password" />
      </div>
      <div>
        <label className="label" htmlFor="ap-new">Nova senha</label>
        <input id="ap-new" name="next" type="password" required minLength={10} className="input" autoComplete="new-password" />
        <p className="mt-1 text-xs text-slate-500">Mínimo de 10 caracteres, com letras e números. Não reutilize senhas de outros perfis.</p>
      </div>
      <div>
        <label className="label" htmlFor="ap-new2">Repita a nova senha</label>
        <input id="ap-new2" name="next2" type="password" required minLength={10} className="input" autoComplete="new-password" />
      </div>
      {msg && <p className={`text-sm ${msg.ok ? "text-emerald-700" : "text-red-600"}`} role="status">{msg.text}</p>}
      <button disabled={busy} className="btn-navy w-full">{busy ? "Salvando…" : "Salvar nova senha"}</button>
    </form>
  );
}
