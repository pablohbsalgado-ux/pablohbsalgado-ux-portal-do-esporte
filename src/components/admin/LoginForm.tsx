"use client";

import { useState } from "react";

export function LoginForm({ profiles }: { profiles: { id: string; name: string }[] }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const f = new FormData(e.currentTarget);
        const res = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile: f.get("profile"), password: f.get("password") }),
        });
        setBusy(false);
        if (!res.ok) return setError((await res.json().catch(() => ({}))).error ?? "Erro ao entrar");
        const next = new URLSearchParams(window.location.search).get("next");
        window.location.href = next?.startsWith("/admin") ? next : "/admin";
      }}
      className="space-y-4"
    >
      <div>
        <label className="label" htmlFor="profile">Perfil</label>
        <select id="profile" name="profile" required className="input" defaultValue="">
          <option value="" disabled>Selecione o seu perfil…</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="pw">Senha</label>
        <input id="pw" name="password" type="password" required className="input" autoComplete="current-password" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={busy} className="btn-navy w-full py-3">{busy ? "Entrando…" : "Entrar"}</button>
      <p className="text-center text-xs text-slate-500">Cada acesso fica registrado no histórico do painel.</p>
    </form>
  );
}
