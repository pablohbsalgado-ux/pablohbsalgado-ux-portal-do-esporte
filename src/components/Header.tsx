"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAccount } from "./account/AccountProvider";
import { useCart } from "./cart/CartProvider";
import { IconCart, IconClose, IconMenu, IconUser } from "./icons";

const NAV = [
  { href: "/jogos", label: "Jogos" },
  { href: "/escala", label: "Escala" },
  { href: "/eventos", label: "Eventos" },
  { href: "/vendas", label: "Vendas" },
  { href: "/titulos", label: "Títulos" },
];

export function Header({ announcement, siteName }: { announcement?: string; siteName: string }) {
  const pathname = usePathname();
  const cart = useCart();
  const { account } = useAccount();
  const [menu, setMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40">
      {announcement && (
        <div className="bg-grain-red px-4 py-1.5 text-center text-xs font-bold uppercase tracking-wide text-white sm:text-sm">{announcement}</div>
      )}
      <div className="bg-grain-navy border-b-4 border-lobo-red text-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:h-[72px]">
          <Link href="/" className="flex items-center gap-2.5" onClick={() => setMenu(false)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/logo.png" alt="Atlética CEFET-RJ" className="h-11 w-11 sm:h-14 sm:w-14" />
            <span className="leading-none">
              <span className="block font-display text-xl uppercase sm:text-2xl">{siteName}</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.25em] text-white/60">A.A.A. CEFET/RJ</span>
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
                  className={`px-2.5 py-2 font-display text-lg uppercase tracking-wide transition lg:px-4 lg:text-xl ${active ? "text-white" : "text-white/70 hover:text-white"}`}
                >
                  {n.label}
                  <span className={`mx-auto mt-0.5 block h-1 -skew-x-12 bg-lobo-red transition-all ${active ? "w-full" : "w-0"}`} />
                </Link>
              );
            })}
          </nav>

          <Link
            href={account ? "/conta" : "/conta/entrar"}
            onClick={() => setMenu(false)}
            className="ml-auto flex items-center gap-2 rounded-lg p-2 hover:bg-white/10 md:ml-2"
            aria-label={account ? `Minha conta (${account.fullName})` : "Entrar ou criar conta"}
            title={account ? "Minha conta" : "Entrar"}
          >
            <span className={`grid h-8 w-8 place-items-center rounded-full ${account ? "bg-lobo-red font-display text-sm" : "border-2 border-white/70"}`}>
              {account ? account.fullName.trim()[0]?.toUpperCase() : <IconUser className="h-4 w-4" />}
            </span>
            <span className="hidden text-xs font-bold uppercase leading-tight lg:block">
              {account ? <>Olá,<br />{account.fullName.split(" ")[0]}</> : <>Entrar /<br />Cadastrar</>}
            </span>
          </Link>
          <button
            onClick={() => cart.setOpen(true)}
            className="relative rounded-lg p-2 hover:bg-white/10"
            aria-label={`Abrir carrinho (${cart.count} itens)`}
          >
            <IconCart className="h-6 w-6" />
            {cart.count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-lobo-red px-1 text-xs font-bold text-white">
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
                className={`block border-b border-white/10 py-3 font-display text-xl uppercase tracking-wider ${pathname.startsWith(n.href) ? "text-lobo-redLight" : ""}`}
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
