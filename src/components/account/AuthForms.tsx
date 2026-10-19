"use client";

import { useState } from "react";
import type { PublicAccount } from "@/lib/types";
import { useAccount } from "./AccountProvider";

function maskCpf(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export { maskCpf, maskPhone };

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Algo deu errado. Tente de novo.");
  return data as { account: PublicAccount };
}

/** Abas Entrar / Criar conta. Chama onDone quando a pessoa estiver logada. */
export function AuthForms({ onDone, initialTab = "login", intro }: { onDone?: (a: PublicAccount) => void; initialTab?: "login" | "register"; intro?: string }) {
  const [tab, setTab] = useState(initialTab);
  return (
    <div>
      {intro && <p className="mb-4 rounded-lg bg-lobo-paper p-3 text-sm text-lobo-navy">{intro}</p>}
      <div className="mb-5 grid grid-cols-2 rounded-lg border-2 border-lobo-navy p-1" role="tablist">
        {([
          ["login", "Entrar"],
          ["register", "Criar conta"],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`rounded-md py-2 text-sm font-bold uppercase ${tab === k ? "bg-lobo-navy text-white" : "text-lobo-navy"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "login" ? <LoginForm onDone={onDone} /> : <RegisterForm onDone={onDone} />}
    </div>
  );
}

function LoginForm({ onDone }: { onDone?: (a: PublicAccount) => void }) {
  const { setAccount } = useAccount();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setBusy(true);
        setError("");
        try {
          const { account } = await post("/api/conta/login", { login: f.get("login"), password: f.get("password") });
          setAccount(account);
          onDone?.(account);
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div>
        <label className="label" htmlFor="li-login">E-mail ou CPF</label>
        <input id="li-login" name="login" required className="input" autoComplete="username" />
      </div>
      <div>
        <label className="label" htmlFor="li-pw">Senha</label>
        <input id="li-pw" name="password" type="password" required className="input" autoComplete="current-password" />
      </div>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button disabled={busy} className="btn-navy w-full py-3">{busy ? "Entrando…" : "Entrar"}</button>
      <p className="text-center text-xs text-slate-500">Esqueceu a senha? Fale com a diretoria pelo WhatsApp ou Instagram para redefinir.</p>
    </form>
  );
}

function RegisterForm({ onDone }: { onDone?: (a: PublicAccount) => void }) {
  const { setAccount } = useAccount();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        if (f.get("password") !== f.get("password2")) return setError("As senhas não conferem");
        setBusy(true);
        setError("");
        try {
          const { account } = await post("/api/conta/cadastro", {
            fullName: f.get("fullName"),
            cpf,
            phone,
            email: f.get("email"),
            password: f.get("password"),
            acceptPrivacy: f.get("acceptPrivacy") === "on",
          });
          setAccount(account);
          onDone?.(account);
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="sm:col-span-2">
        <label className="label" htmlFor="rg-name">Nome completo</label>
        <input id="rg-name" name="fullName" required minLength={5} className="input" autoComplete="name" />
      </div>
      <div>
        <label className="label" htmlFor="rg-cpf">CPF</label>
        <input id="rg-cpf" required className="input" inputMode="numeric" value={cpf} onChange={(e) => setCpf(maskCpf(e.target.value))} placeholder="000.000.000-00" />
      </div>
      <div>
        <label className="label" htmlFor="rg-phone">Telefone (WhatsApp)</label>
        <input id="rg-phone" required className="input" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} placeholder="(21) 99999-0000" />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="rg-email">E-mail</label>
        <input id="rg-email" name="email" type="email" required className="input" autoComplete="email" />
      </div>
      <div>
        <label className="label" htmlFor="rg-pw">Senha</label>
        <input id="rg-pw" name="password" type="password" required minLength={8} className="input" autoComplete="new-password" />
      </div>
      <div>
        <label className="label" htmlFor="rg-pw2">Confirme a senha</label>
        <input id="rg-pw2" name="password2" type="password" required minLength={8} className="input" autoComplete="new-password" />
      </div>
      <p className="-mt-1 text-xs text-slate-500 sm:col-span-2">Mínimo de 8 caracteres, com letras e números.</p>
      <label className="flex items-start gap-2 text-xs text-slate-600 sm:col-span-2">
        <input type="checkbox" name="acceptPrivacy" required className="mt-0.5 h-4 w-4 accent-lobo-navy" />
        <span>Autorizo a A.A.A. CEFET/RJ a usar estes dados para processar minhas compras e entrar em contato sobre elas (LGPD).</span>
      </label>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">{error}</p>}
      <button disabled={busy} className="btn-red w-full py-3 sm:col-span-2">{busy ? "Criando conta…" : "Criar conta"}</button>
    </form>
  );
}
