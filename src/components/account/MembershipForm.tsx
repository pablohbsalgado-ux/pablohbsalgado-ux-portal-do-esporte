"use client";

import { useState } from "react";
import { brl } from "@/lib/format";
import type { PublicAccount } from "@/lib/types";
import { maskCpf, maskPhone } from "./AuthForms";

const MAX_MB = 4;

interface Props {
  plan: { id: string; name: string; price: number };
  athlete: boolean;
  modalities: string[];
  account: PublicAccount | null;
  terms: { generalTitle: string; general: string; athleteTitle: string; athlete: string };
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="card p-6">
      <legend className="sr-only">{title}</legend>
      <h2 className="mb-4 flex items-center gap-3 text-2xl text-lobo-navy">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-lobo-red font-display text-base text-white">{n}</span>
        {title}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Field({ label, htmlFor, children, wide, hint }: { label: string; htmlFor: string; children: React.ReactNode; wide?: boolean; hint?: string }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <label className="label" htmlFor={htmlFor}>{label} <span className="text-lobo-red">*</span></label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function tooBig(f: File | null | undefined) {
  return !!f && f.size > MAX_MB * 1024 * 1024;
}

export function MembershipForm({ plan, athlete, modalities, account, terms }: Props) {
  const [cpf, setCpf] = useState(account ? maskCpf(account.cpf) : "");
  const [phone, setPhone] = useState(account ? maskPhone(account.phone) : "");
  const [photoPreview, setPhotoPreview] = useState("");
  const [method, setMethod] = useState<"pix" | "card">("pix");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    form.set("cpf", cpf);
    form.set("phone", phone);
    form.set("method", method);
    form.set("planId", plan.id);
    if (athlete && form.getAll("modalities").length === 0) return setError("Escolha ao menos uma modalidade.");
    if (tooBig(form.get("photo") as File) || tooBig(form.get("enrollmentProof") as File)) return setError(`Os arquivos devem ter no máximo ${MAX_MB} MB.`);

    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/membership", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não foi possível enviar a ficha");
      if (data.payment?.kind === "redirect" && /^https?:/.test(data.payment.url)) window.location.href = data.payment.url;
      else window.location.assign(`/pedido/${data.orderId}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="relative -mt-8 space-y-6">
      {account && (
        <p className="card p-4 text-sm text-lobo-navy">
          Você está logado como <strong>{account.fullName}</strong>: os dados do cadastro já foram preenchidos.
        </p>
      )}

      <Section n={1} title="Dados pessoais">
        <Field label="Nome completo" htmlFor="m-name" wide>
          <input id="m-name" name="fullName" required minLength={5} defaultValue={account?.fullName} className="input" autoComplete="name" />
        </Field>
        <Field label="E-mail" htmlFor="m-email">
          <input id="m-email" name="email" type="email" required defaultValue={account?.email} className="input" autoComplete="email" />
        </Field>
        <Field label="Celular (WhatsApp)" htmlFor="m-phone">
          <input id="m-phone" required value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} className="input" inputMode="tel" placeholder="(21) 99999-0000" />
        </Field>
        <Field label="CPF" htmlFor="m-cpf">
          <input id="m-cpf" required value={cpf} onChange={(e) => setCpf(maskCpf(e.target.value))} className="input" inputMode="numeric" placeholder="000.000.000-00" />
        </Field>
        <Field label="Data de nascimento" htmlFor="m-birth">
          <input id="m-birth" name="birthDate" type="date" required className="input" />
        </Field>
        <Field label="Sexo" htmlFor="m-sex">
          <select id="m-sex" name="sex" required className="input" defaultValue="">
            <option value="" disabled>Selecione…</option>
            <option value="Masculino">Masculino</option>
            <option value="Feminino">Feminino</option>
          </select>
        </Field>
        <Field label="Instagram" htmlFor="m-insta">
          <input id="m-insta" name="instagram" required className="input" placeholder="@seuperfil" />
        </Field>
      </Section>

      <Section n={2} title="Vida acadêmica">
        <Field label="Situação de matrícula" htmlFor="m-enroll">
          <select id="m-enroll" name="enrollmentStatus" required className="input" defaultValue="">
            <option value="" disabled>Selecione…</option>
            <option value="ativo">Aluno ativo</option>
            <option value="formado">Formado</option>
            <option value="nao_aluno">Não aluno</option>
          </select>
        </Field>
        <Field label="Curso" htmlFor="m-course">
          <input id="m-course" name="course" required className="input" placeholder="Ex.: Engenharia Mecânica" />
        </Field>
        {athlete ? (
          <Field label="Comprovante de matrícula" htmlFor="m-proof" wide hint={`PDF ou imagem, até ${MAX_MB} MB. Visível só para a diretoria.`}>
            <input id="m-proof" name="enrollmentProof" type="file" required accept="application/pdf,image/jpeg,image/png,image/webp" className="input file:mr-3 file:rounded file:border-0 file:bg-lobo-navy file:px-3 file:py-1 file:text-white" />
          </Field>
        ) : (
          <div className="sm:col-span-2">
            <label className="label" htmlFor="m-proof">Comprovante de matrícula (se for aluno)</label>
            <input id="m-proof" name="enrollmentProof" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="input file:mr-3 file:rounded file:border-0 file:bg-lobo-navy file:px-3 file:py-1 file:text-white" />
            <p className="mt-1 text-xs text-slate-500">PDF ou imagem, até {MAX_MB} MB. Visível só para a diretoria.</p>
          </div>
        )}
      </Section>

      {athlete && (
        <Section n={3} title="Ficha do atleta">
          <div className="sm:col-span-2">
            <span className="label">Foto de perfil <span className="text-lobo-red">*</span></span>
            <div className="flex items-center gap-4">
              <div className="grid h-24 w-24 flex-none place-items-center overflow-hidden rounded-full border-2 border-dashed border-lobo-navy/30 bg-lobo-paper text-xs text-slate-400">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {photoPreview ? <img src={photoPreview} alt="Prévia da foto" className="h-full w-full object-cover" /> : "Foto"}
              </div>
              <div className="min-w-0 flex-1">
                <input
                  id="m-photo"
                  name="photo"
                  type="file"
                  required
                  accept="image/jpeg,image/png,image/webp"
                  aria-label="Foto de perfil"
                  className="input file:mr-3 file:rounded file:border-0 file:bg-lobo-navy file:px-3 file:py-1 file:text-white"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    setPhotoPreview(f ? URL.createObjectURL(f) : "");
                  }}
                />
                <p className="mt-1 text-xs text-slate-500">Rosto visível, fundo neutro. JPG, PNG ou WEBP até {MAX_MB} MB.</p>
              </div>
            </div>
          </div>
          <div className="sm:col-span-2">
            <span className="label">Modalidades que vai praticar <span className="text-lobo-red">*</span></span>
            <div className="flex flex-wrap gap-2">
              {modalities.map((m) => (
                <label key={m} className="cursor-pointer">
                  <input type="checkbox" name="modalities" value={m} className="peer sr-only" />
                  <span className="chip-off inline-block peer-checked:border-lobo-navy peer-checked:bg-lobo-navy peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-lobo-red">
                    {m}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </Section>
      )}

      <Section n={athlete ? 4 : 3} title="Termos de responsabilidade">
        <div className="sm:col-span-2">
          <p className="label">{terms.generalTitle}</p>
          <div className="max-h-48 overflow-y-auto whitespace-pre-line rounded-md border-2 border-lobo-navy/15 bg-lobo-paper p-4 text-sm text-slate-700">{terms.general}</div>
          <label className="mt-2 flex items-start gap-2 text-sm font-semibold text-lobo-navy">
            <input type="checkbox" name="acceptGeneralTerms" required className="mt-0.5 h-5 w-5 accent-lobo-navy" />
            Li e aceito o termo de responsabilidade do associado.
          </label>
        </div>
        {athlete && (
          <div className="sm:col-span-2">
            <p className="label">{terms.athleteTitle}</p>
            <div className="max-h-48 overflow-y-auto whitespace-pre-line rounded-md border-2 border-lobo-navy/15 bg-lobo-paper p-4 text-sm text-slate-700">{terms.athlete}</div>
            <label className="mt-2 flex items-start gap-2 text-sm font-semibold text-lobo-navy">
              <input type="checkbox" name="acceptAthleteTerms" required className="mt-0.5 h-5 w-5 accent-lobo-navy" />
              Li e aceito o termo de responsabilidade do atleta.
            </label>
          </div>
        )}
      </Section>

      <Section n={athlete ? 5 : 4} title="Pagamento">
        <div className="grid grid-cols-2 gap-3 sm:col-span-2">
          {([
            ["pix", "Pix", "QR Code na hora"],
            ["card", "Cartão de crédito", "Ambiente seguro Mercado Pago"],
          ] as const).map(([value, title, sub]) => (
            <label key={value} className={`cursor-pointer rounded-xl border-2 p-3 transition ${method === value ? "border-lobo-navy bg-lobo-paper" : "border-slate-200"}`}>
              <input type="radio" name="methodChoice" value={value} checked={method === value} onChange={() => setMethod(value)} className="sr-only" />
              <span className="block font-semibold">{title}</span>
              <span className="block text-xs text-slate-500">{sub}</span>
            </label>
          ))}
        </div>
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 sm:col-span-2" role="alert">{error}</p>}
        <button disabled={busy} className="btn-red w-full py-3 text-base sm:col-span-2">
          {busy ? "Enviando ficha…" : `Enviar ficha e pagar ${brl(plan.price)}`}
        </button>
        <p className="text-center text-xs text-slate-500 sm:col-span-2">
          A associação é ativada quando o pagamento é confirmado. Seus dados e documentos são usados só pela diretoria da A.A.A. CEFET/RJ.
        </p>
      </Section>
    </form>
  );
}
