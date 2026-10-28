"use client";

import { useEffect } from "react";
import { brl } from "@/lib/format";
import { useCart } from "./CartProvider";
import { IconClose, IconTrash } from "../icons";

export function CartDrawer() {
  const cart = useCart();

  useEffect(() => {
    if (!cart.open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && cart.setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [cart.open, cart]);

  if (!cart.open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Carrinho">
      <button className="absolute inset-0 bg-black/50" aria-label="Fechar carrinho" onClick={() => cart.setOpen(false)} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md animate-slidein flex-col bg-white shadow-2xl">
        <header className="bg-grain-navy flex items-center justify-between border-b-4 border-lobo-red px-5 py-4 text-white">
          <h2 className="text-2xl">Seu carrinho</h2>
          <button onClick={() => cart.setOpen(false)} aria-label="Fechar" className="rounded p-1 hover:bg-white/10">
            <IconClose />
          </button>
        </header>

        {cart.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-slate-500">
            <p>Seu carrinho está vazio.</p>
            <a href="/vendas" className="btn-red" onClick={() => cart.setOpen(false)}>Ir para a loja</a>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y overflow-y-auto px-5">
              {cart.items.map((item) => (
                <li key={item.key} className="flex gap-3 py-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image || "/img/logo.png"} alt="" className="h-20 w-20 flex-none rounded-lg bg-lobo-paper object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-tight">{item.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {[item.subtitle, item.size && `Tam. ${item.size}`, item.customization && `${item.customization.name} #${item.customization.number}`]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      {item.kind !== "plan" ? (
                        <div className="flex items-center rounded-lg border">
                          <button className="px-2.5 py-1" aria-label="Diminuir" onClick={() => cart.setQuantity(item.key, item.quantity - 1)}>−</button>
                          <span className="w-6 text-center text-sm">{item.quantity}</span>
                          <button className="px-2.5 py-1" aria-label="Aumentar" onClick={() => cart.setQuantity(item.key, item.quantity + 1)}>+</button>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold uppercase text-lobo-redDark">Adesão de sócio</span>
                      )}
                      <span className="font-semibold">{brl(item.price * item.quantity)}</span>
                    </div>
                  </div>
                  <button onClick={() => cart.remove(item.key)} className="self-start p-1 text-slate-400 hover:text-red-600" aria-label="Remover item">
                    <IconTrash />
                  </button>
                </li>
              ))}
            </ul>
            <footer className="border-t p-5">
              <div className="mb-4 flex items-center justify-between text-lg">
                <span>Subtotal</span>
                <strong>{brl(cart.subtotal)}</strong>
              </div>
              <button
                className="btn-red w-full py-3 text-base"
                onClick={() => {
                  cart.setOpen(false);
                  cart.setCheckoutOpen(true);
                }}
              >
                Finalizar compra
              </button>
              <p className="mt-2 text-center text-xs text-slate-500">Pagamento via Pix ou cartão de crédito</p>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
