"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { brl } from "@/lib/format";
import { useCart } from "./CartProvider";
import { IconClose } from "../icons";

export function CheckoutModal() {
  const cart = useCart();
  const router = useRouter();
  const [method, setMethod] = useState<"pix" | "card">("pix");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!cart.checkoutOpen) return null;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          customer: {
            name: form.get("name"),
            email: form.get("email"),
            phone: form.get("phone"),
            cpf: form.get("cpf"),
          },
          items: cart.items.map((i) => ({ kind: i.kind, id: i.id, quantity: i.quantity, size: i.size, customization: i.customization })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não foi possível iniciar o pagamento");
      cart.clear();
      cart.setCheckoutOpen(false);
      if (data.payment.kind === "redirect" && /^https?:/.test(data.payment.url)) {
        window.location.href = data.payment.url;
      } else {
        router.push(`/pedido/${data.orderId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="Finalizar compra">
      <button className="absolute inset-0 bg-black/60" aria-label="Fechar" onClick={() => cart.setCheckoutOpen(false)} />
      <form onSubmit={submit} className="relative max-h-[92vh] w-full max-w-lg animate-rise overflow-y-auto rounded-t-2xl bg-white p-6 sm:rounded-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-2xl text-lobo-navy">Finalizar compra</h2>
            <p className="text-sm text-slate-500">{cart.count} item(ns) · {brl(cart.subtotal)}</p>
          </div>
          <button type="button" onClick={() => cart.setCheckoutOpen(false)} aria-label="Fechar"><IconClose /></button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="co-name">Nome completo</label>
            <input id="co-name" name="name" required minLength={3} className="input" autoComplete="name" />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="co-email">E-mail</label>
            <input id="co-email" name="email" type="email" required className="input" autoComplete="email" />
          </div>
          <div>
            <label className="label" htmlFor="co-phone">WhatsApp</label>
            <input id="co-phone" name="phone" className="input" inputMode="tel" autoComplete="tel" placeholder="(21) 99999-0000" />
          </div>
          <div>
            <label className="label" htmlFor="co-cpf">CPF</label>
            <input id="co-cpf" name="cpf" className="input" inputMode="numeric" placeholder="Somente números" pattern="\d{11}|\d{3}\.\d{3}\.\d{3}-\d{2}" />
          </div>
        </div>

        <fieldset className="mt-5">
          <legend className="label">Forma de pagamento</legend>
          <div className="grid grid-cols-2 gap-3">
            {([
              ["pix", "Pix", "QR Code na hora, aprovação imediata"],
              ["card", "Cartão de crédito", "Até 6x, ambiente seguro Mercado Pago"],
            ] as const).map(([value, title, sub]) => (
              <label key={value} className={`cursor-pointer rounded-xl border-2 p-3 transition ${method === value ? "border-lobo-navy bg-lobo-ice" : "border-slate-200"}`}>
                <input type="radio" name="method" value={value} checked={method === value} onChange={() => setMethod(value)} className="sr-only" />
                <span className="block font-semibold">{title}</span>
                <span className="block text-xs text-slate-500">{sub}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <button disabled={busy} className="btn-gold mt-6 w-full py-3 text-base">
          {busy ? "Processando…" : method === "pix" ? `Gerar Pix de ${brl(cart.subtotal)}` : `Pagar ${brl(cart.subtotal)} com cartão`}
        </button>
        <p className="mt-2 text-center text-xs text-slate-500">O valor final é confirmado pelo servidor com os preços atuais da loja.</p>
      </form>
    </div>
  );
}
