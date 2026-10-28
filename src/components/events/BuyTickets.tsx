"use client";

import { useState } from "react";
import { brl } from "@/lib/format";
import { useCart } from "../cart/CartProvider";

export function BuyTickets({
  event,
  lot,
}: {
  event: { id: string; name: string; image: string; dateLabel: string };
  lot: { name: string; price: number };
}) {
  const cart = useCart();
  const [qty, setQty] = useState(1);
  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-lg border-2 border-lobo-navy bg-white">
          <button type="button" className="px-3 py-2 text-lg font-bold" aria-label="Menos ingressos" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
          <span className="w-8 text-center font-display text-xl" aria-live="polite">{qty}</span>
          <button type="button" className="px-3 py-2 text-lg font-bold" aria-label="Mais ingressos" onClick={() => setQty((q) => Math.min(10, q + 1))}>+</button>
        </div>
        <span className="text-sm text-slate-600">
          Total <strong className="font-display text-2xl text-lobo-navy">{brl(lot.price * qty)}</strong>
        </span>
      </div>
      <button
        className="btn-red mt-4 w-full py-3 text-base"
        onClick={() =>
          cart.add(
            { kind: "event", id: event.id, name: `Ingresso: ${event.name}`, image: event.image || "/img/logo.png", price: lot.price, subtitle: `${lot.name} · ${event.dateLabel}` },
            qty,
          )
        }
      >
        Comprar ingresso{qty > 1 ? "s" : ""}
      </button>
      <p className="mt-2 text-center text-xs text-slate-500">Pagamento por Pix ou cartão. O valor cobrado é o do lote vigente no momento da compra.</p>
    </div>
  );
}
