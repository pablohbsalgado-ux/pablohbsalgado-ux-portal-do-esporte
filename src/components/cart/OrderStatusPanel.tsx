"use client";

import { useEffect, useState } from "react";
import type { Order, OrderStatus } from "@/lib/types";
import { IconCheck } from "../icons";

export function OrderStatusPanel({
  orderId,
  initialStatus,
  method,
  pix,
  demo,
}: {
  orderId: string;
  initialStatus: OrderStatus;
  method: Order["method"];
  pix?: Order["pix"];
  demo: boolean;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status !== "pendente") return;
    const qs = typeof window !== "undefined" ? window.location.search : "";
    const check = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}${qs}`, { cache: "no-store" });
        if (res.ok) setStatus((await res.json()).status);
      } catch {}
    };
    check();
    const t = setInterval(check, 5000);
    return () => clearInterval(t);
  }, [orderId, status]);

  if (status === "pago" || status === "entregue") {
    return (
      <div className="card flex flex-col items-center p-8 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
          <IconCheck className="h-9 w-9" />
        </span>
        <h2 className="mt-4 text-3xl text-lobo-navy">Pagamento confirmado</h2>
        <p className="mt-2 text-slate-600">Você receberá as instruções de retirada/adesão por e-mail. Bem-vindo à alcateia! 🐺</p>
      </div>
    );
  }

  if (status === "cancelado") {
    return (
      <div className="card p-8 text-center">
        <h2 className="text-3xl text-red-700">Pagamento não aprovado</h2>
        <p className="mt-2 text-slate-600">Nenhum valor foi cobrado. Você pode tentar novamente pela loja.</p>
        <a href="/vendas" className="btn-navy mt-5">Voltar para a loja</a>
      </div>
    );
  }

  return (
    <div className="card p-6">
      {demo && (
        <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          <strong>Modo demonstração:</strong> o Mercado Pago ainda não foi configurado, nada será cobrado.
        </p>
      )}
      {method === "pix" && pix ? (
        <>
          <h2 className="text-2xl text-lobo-navy">Pague com Pix</h2>
          <p className="text-sm text-slate-600">Abra o app do seu banco, escolha Pix &gt; Ler QR Code. A confirmação aparece aqui automaticamente.</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`data:image/png;base64,${pix.qrCodeBase64}`} alt="QR Code Pix" className="mx-auto my-5 h-60 w-60 rounded-lg border p-2" />
          <label className="label" htmlFor="pix-code">Pix copia e cola</label>
          <div className="flex gap-2">
            <input id="pix-code" readOnly value={pix.copyPaste} className="input font-mono text-xs" onFocus={(e) => e.target.select()} />
            <button
              className="btn-gold flex-none"
              onClick={async () => {
                await navigator.clipboard.writeText(pix.copyPaste);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? "Copiado!" : "Copiar"}
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-500">Válido até {new Date(pix.expiresAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.</p>
        </>
      ) : (
        <>
          <h2 className="text-2xl text-lobo-navy">Aguardando confirmação</h2>
          <p className="text-sm text-slate-600">Estamos aguardando a confirmação do pagamento com cartão. Esta página se atualiza sozinha.</p>
        </>
      )}
      <p className="mt-4 flex items-center gap-2 text-sm text-slate-500">
        <span className="h-2 w-2 animate-ping rounded-full bg-lobo-gold" /> Aguardando pagamento…
      </p>
      {demo && (
        <button
          className="btn-ghost mt-4"
          onClick={async () => {
            await fetch(`/api/orders/${orderId}/simulate`, { method: "POST" });
            setStatus("pago");
          }}
        >
          Simular pagamento aprovado
        </button>
      )}
    </div>
  );
}
