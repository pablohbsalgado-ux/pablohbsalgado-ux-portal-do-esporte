"use client";

import { useEffect, useState } from "react";
import { brl } from "@/lib/format";
import type { ManualInstructions } from "@/lib/manual-payment";
import type { OrderStatus } from "@/lib/types";
import { IconCheck } from "../icons";

function CopyButton({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn-red flex-none"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          // navegadores sem permissão de área de transferência: seleciona para copiar à mão
          window.prompt("Copie o código:", text);
        }
        setDone(true);
        setTimeout(() => setDone(false), 2000);
      }}
    >
      {done ? "Copiado!" : label}
    </button>
  );
}

export function ManualPaymentPanel({
  orderId,
  initialStatus,
  initialProofAt,
  instructions,
  total,
  isMembership,
}: {
  orderId: string;
  initialStatus: OrderStatus;
  initialProofAt: string;
  instructions: ManualInstructions;
  total: number;
  isMembership: boolean;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [proofAt, setProofAt] = useState(initialProofAt);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // acompanha a confirmação feita pela diretoria no painel
  useEffect(() => {
    if (status !== "pendente") return;
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
        if (res.ok) setStatus((await res.json()).status);
      } catch {}
    }, 15000);
    return () => clearInterval(t);
  }, [orderId, status]);

  if (status === "pago" || status === "entregue") {
    return (
      <div className="card flex flex-col items-center p-8 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
          <IconCheck className="h-9 w-9" />
        </span>
        <h2 className="mt-4 text-3xl text-lobo-navy">Pagamento confirmado</h2>
        <p className="mt-2 text-slate-600">
          {isMembership ? "Sua associação está ativa. Bem-vindo à alcateia! 🐺" : "A diretoria vai avisar sobre a retirada pelo WhatsApp. Valeu, Lobo! 🐺"}
        </p>
      </div>
    );
  }

  if (status === "cancelado") {
    return (
      <div className="card p-8 text-center">
        <h2 className="text-3xl text-red-700">Pedido cancelado</h2>
        <p className="mt-2 text-slate-600">Se você já pagou, fale com a diretoria informando o número do pedido.</p>
      </div>
    );
  }

  async function sendProof(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const file = form.get("proof") as File | null;
    if (!file || file.size === 0) return setError("Escolha o arquivo do comprovante.");
    if (file.size > 4 * 1024 * 1024) return setError("O arquivo deve ter no máximo 4 MB.");
    setBusy(true);
    setError("");
    const res = await fetch(`/api/orders/${orderId}/proof`, { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Não foi possível enviar");
    setProofAt(new Date().toISOString());
  }

  return (
    <div className="space-y-5">
      <div className="card p-6">
        <p className="label">Passo 1</p>
        {instructions.method === "pix" ? (
          <>
            <h2 className="text-2xl text-lobo-navy">Pague com Pix</h2>
            <p className="text-sm text-slate-600">
              Abra o app do seu banco em <strong>Pix &gt; Ler QR Code</strong> ou <strong>Pix copia e cola</strong>. O valor já vem preenchido.
            </p>
            {instructions.pix.map((g) => (
              <div key={g.key} className="mt-5 border-t pt-5 first:mt-4 first:border-t-0 first:pt-0">
                {instructions.pix.length > 1 && <p className="text-xs text-slate-500">{g.items.join(" · ")}</p>}
                <p className="font-display text-3xl text-lobo-navy">{brl(g.amount)}</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.qrDataUrl} alt={`QR Code Pix de ${brl(g.amount)}`} className="mx-auto my-4 h-56 w-56 rounded-lg border p-2" />
                <label className="label" htmlFor={`pix-${g.key}`}>Pix copia e cola</label>
                <div className="flex gap-2">
                  <input id={`pix-${g.key}`} readOnly value={g.copyPaste} className="input font-mono text-xs" onFocus={(e) => e.target.select()} />
                  <CopyButton text={g.copyPaste} />
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  Ou pague direto na chave: <strong className="break-all font-mono">{g.key}</strong>{" "}
                  <button type="button" className="text-xs font-bold uppercase text-lobo-red underline" onClick={() => navigator.clipboard?.writeText(g.key)}>copiar chave</button>
                </p>
              </div>
            ))}
            {instructions.pix.length > 1 && (
              <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Este pedido tem itens de recebedores diferentes: faça um Pix para cada código acima.</p>
            )}
          </>
        ) : (
          <>
            <h2 className="text-2xl text-lobo-navy">Pague no cartão</h2>
            <p className="text-sm text-slate-600">O pagamento é feito no ambiente seguro da InfinitePay (crédito ou débito). Abra o link, pague e volte aqui.</p>
            <ul className="mt-4 space-y-3">
              {instructions.links.map((l, i) => (
                <li key={i} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-lobo-navy/10 p-3">
                  <span className="text-sm">
                    <strong className="block text-lobo-navy">{l.name}</strong>
                    {brl(l.amount)}
                    {l.quantity > 1 && <span className="block text-xs text-amber-700">Se o link for de 1 unidade, pague {l.quantity} vezes ou ajuste a quantidade no link.</span>}
                  </span>
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="btn-red">Pagar com cartão ↗</a>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm">Total do pedido: <strong>{brl(total)}</strong></p>
          </>
        )}
      </div>

      <div className="card p-6">
        <p className="label">Passo 2</p>
        <h2 className="text-2xl text-lobo-navy">Envie o comprovante</h2>
        {proofAt ? (
          <div className="mt-3 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800" role="status">
            <strong>Comprovante recebido</strong> em {new Date(proofAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}. A diretoria vai conferir e
            confirmar o pagamento. Esta página se atualiza sozinha.
            <span className="mt-1 block text-xs">Mandou o arquivo errado? Envie outro abaixo.</span>
          </div>
        ) : (
          <p className="mt-1 text-sm text-slate-600">Depois de pagar, envie o print ou PDF do comprovante para agilizar a confirmação.</p>
        )}
        <form onSubmit={sendProof} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            name="proof"
            type="file"
            required
            accept="application/pdf,image/jpeg,image/png,image/webp"
            aria-label="Comprovante de pagamento"
            className="input file:mr-3 file:rounded file:border-0 file:bg-lobo-navy file:px-3 file:py-1 file:text-white"
          />
          <button disabled={busy} className="btn-navy flex-none">{busy ? "Enviando…" : "Enviar comprovante"}</button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
        <p className="mt-3 text-xs text-slate-500">Guarde o número do pedido: <strong className="font-mono">{orderId}</strong>. Ele também aparece em “Minha conta”.</p>
      </div>
    </div>
  );
}
