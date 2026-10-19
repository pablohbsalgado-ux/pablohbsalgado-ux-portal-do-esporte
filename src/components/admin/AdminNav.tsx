"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/games", label: "Jogos e placares" },
  { href: "/admin/trainings", label: "Escala de treinos" },
  { href: "/admin/products", label: "Produtos e estoque" },
  { href: "/admin/plans", label: "Planos de sócio" },
  { href: "/admin/titles", label: "Títulos" },
  { href: "/admin/orders", label: "Pedidos" },
  { href: "/admin/accounts", label: "Clientes" },
  { href: "/admin/members", label: "Sócios" },
  { href: "/admin/settings", label: "Configurações" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible" aria-label="Painel">
      {LINKS.map((l) => {
        const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${active ? "bg-lobo-red text-white" : "text-white/80 hover:bg-white/10"}`}>
            {l.label}
          </Link>
        );
      })}
      <button
        className="whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm text-white/60 hover:bg-white/10 md:mt-4"
        onClick={async () => {
          await fetch("/api/admin/logout", { method: "POST" });
          window.location.href = "/admin/login";
        }}
      >
        Sair
      </button>
    </nav>
  );
}
