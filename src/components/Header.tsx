"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "./cart/CartProvider";
import { IconCart, IconClose, IconMenu } from "./icons";

const NAV = [
  { href: "/jogos", label: "Jogos" },
  { href: "/escala", label: "Escala" },
  { href: "/vendas", label: "Vendas" },
  { href: "/titulos", label: "Títulos" },
];

export function Header({ announcement }: { announcement?: string }) {
  const pathname = usePathname();
  const cart = useCart();
  const [menu, setMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40">
      {announcement && (
        <div className="bg-lobo-gold px-4 py-1.5 text-center text-xs font-semibold text-lobo-navy sm:text-sm">{announcement}</div>
      )}
      <div className="border-b border-white/10 bg-lobo-navy/95 text-white backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
          <Link href="/" className="flex items-center gap-2.5" onClick={() => setMenu(false)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/lobo.svg" alt="" className="h-10 w-10" />
            <span className="font-display text-xl uppercase leading-none tracking-wider">
              Portal do <span className="text-lobo-gold">Esporte</span>
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="Principal">
            {NAV.map((n) => {
              const active = pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-md px-4 py-2 font-display text-lg uppercase tracking-wider transition ${active ? "text-lobo-gold" : "text-white/85 hover:text-white"}`}
                >
                  {n.label}
                  <span className={`mx-auto mt-0.5 block h-0.5 rounded bg-lobo-gold transition-all ${active ? "w-full" : "w-0"}`} />
                </Link>
              );
            })}
          </nav>

          <button
            onClick={() => cart.setOpen(true)}
            className="relative ml-auto rounded-lg p-2 hover:bg-white/10 md:ml-2"
            aria-label={`Abrir carrinho (${cart.count} itens)`}
          >
            <IconCart className="h-6 w-6" />
            {cart.count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-lobo-gold px-1 text-xs font-bold text-lobo-navy">
                {cart.count}
              </span>
            )}
          </button>
          <button className="rounded-lg p-2 hover:bg-white/10 md:hidden" onClick={() => setMenu((m) => !m)} aria-label="Menu" aria-expanded={menu}>
            {menu ? <IconClose className="h-6 w-6" /> : <IconMenu className="h-6 w-6" />}
          </button>
        </div>

        {menu && (
          <nav className="border-t border-white/10 px-4 pb-4 md:hidden" aria-label="Principal (celular)">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setMenu(false)}
                className={`block border-b border-white/10 py-3 font-display text-xl uppercase tracking-wider ${pathname.startsWith(n.href) ? "text-lobo-gold" : ""}`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
