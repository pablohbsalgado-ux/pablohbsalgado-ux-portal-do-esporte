"use client";

import { useState } from "react";

export function LoginForm() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const password = new FormData(e.currentTarget).get("password");
        const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
        setBusy(false);
        if (!res.ok) return setError((await res.json().catch(() => ({}))).error ?? "Erro ao entrar");
        const next = new URLSearchParams(window.location.search).get("next");
        window.location.href = next?.startsWith("/admin") ? next : "/admin";
      }}
      className="space-y-4"
    >
      <div>
        <label className="label" htmlFor="pw">Senha</label>
        <input id="pw" name="password" type="password" required autoFocus className="input" autoComplete="current-password" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={busy} className="btn-navy w-full py-3">{busy ? "Entrando…" : "Entrar"}</button>
    </form>
  );
}
