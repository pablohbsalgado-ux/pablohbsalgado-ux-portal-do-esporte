"use client";

import { useMemo, useState } from "react";
import { brl } from "@/lib/format";
import type { Plan, Product } from "@/lib/types";
import { useCart } from "../cart/CartProvider";
import { EmptyState, FilterChips } from "../ui";
import { IconCheck } from "../icons";

const PERIOD: Record<Plan["period"], string> = { mensal: "/mês", semestral: "/semestre", anual: "/ano" };

export function PlansSection({ plans }: { plans: Plan[] }) {
  const cart = useCart();
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {plans.map((p) => (
        <article
          key={p.id}
          className={`relative flex flex-col overflow-hidden rounded-2xl p-7 shadow-sm ${p.highlight ? "bg-grain-navy text-white ring-4 ring-lobo-red" : "card"}`}
        >
          {p.highlight && (
            <span className="absolute right-5 top-5 rotate-3 bg-lobo-red px-3 py-1 font-display text-sm uppercase tracking-wider text-white">Recomendado</span>
          )}
          <h3 className={`text-3xl ${p.highlight ? "text-lobo-redLight" : "text-lobo-navy"}`}>{p.name}</h3>
          <p className={`mt-1 text-sm ${p.highlight ? "text-white/70" : "text-slate-500"}`}>{p.tagline}</p>
          <p className="mt-5 font-display text-5xl">
            {brl(p.price)}
            <span className={`ml-1 font-sans text-base ${p.highlight ? "text-white/60" : "text-slate-500"}`}>{PERIOD[p.period]}</span>
          </p>
          <ul className="mt-6 flex-1 space-y-2.5">
            {p.benefits.map((b) => (
              <li key={b} className="flex gap-2.5 text-sm">
                <IconCheck className={`mt-0.5 h-4 w-4 flex-none ${p.highlight ? "text-lobo-redLight" : "text-lobo-red"}`} />
                {b}
              </li>
            ))}
          </ul>
          <button
            className={`${p.highlight ? "btn-red" : "btn-navy"} mt-7 w-full py-3 text-base`}
            onClick={() => {
              cart.add({ kind: "plan", id: p.id, name: `Sócio-Lobo: ${p.name}`, image: "/img/logo.png", price: p.price });
              cart.setOpen(false);
              cart.setCheckoutOpen(true);
            }}
          >
            Assinar agora
          </button>
        </article>
      ))}
      {plans.length === 0 && <EmptyState>Adesões abertas em breve.</EmptyState>}
    </div>
  );
}

const CATS = [
  { value: "all", label: "Tudo" },
  { value: "Roupas", label: "Roupas" },
  { value: "Acessórios", label: "Acessórios" },
  { value: "Uniformes", label: "Uniformes" },
] as const;

export function ProductGrid({ products }: { products: Product[] }) {
  const [cat, setCat] = useState<(typeof CATS)[number]["value"]>("all");
  const list = useMemo(() => products.filter((p) => cat === "all" || p.category === cat), [products, cat]);
  return (
    <>
      <FilterChips label="Categoria" options={CATS} value={cat} onChange={setCat} />
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {list.length === 0 && <EmptyState>Nenhum produto nesta categoria.</EmptyState>}
    </>
  );
}

function ProductCard({ product: p }: { product: Product }) {
  const cart = useCart();
  const [size, setSize] = useState("");
  const [warn, setWarn] = useState(false);
  const soldOut = p.stock <= 0;

  return (
    <article className="card group flex flex-col overflow-hidden">
      <div className="relative aspect-square overflow-hidden bg-lobo-paper">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.image || "/img/logo.png"} alt={p.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        {p.badge && !soldOut && <span className="absolute left-3 top-3 rounded-full bg-lobo-red px-2.5 py-1 text-xs font-bold uppercase text-white">{p.badge}</span>}
        {soldOut && <span className="absolute inset-0 grid place-items-center bg-white/70 font-display text-2xl uppercase text-slate-700">Esgotado</span>}
        {!soldOut && p.stock <= 5 && <span className="absolute bottom-3 left-3 rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">Últimas {p.stock} un.</span>}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{p.category}</p>
        <h3 className="mt-0.5 font-sans text-base font-bold normal-case tracking-normal">{p.name}</h3>
        {p.description && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{p.description}</p>}
        <p className="mt-3">
          {p.compareAtPrice && p.compareAtPrice > p.price && <span className="mr-2 text-sm text-slate-400 line-through">{brl(p.compareAtPrice)}</span>}
          <span className="text-xl font-bold text-lobo-navy">{brl(p.price)}</span>
        </p>
        {p.sizes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Tamanho">
            {p.sizes.map((s) => (
              <button
                key={s}
                type="button"
                disabled={soldOut}
                aria-pressed={size === s}
                onClick={() => { setSize(s); setWarn(false); }}
                className={`h-9 min-w-9 rounded-md border px-2 text-sm font-semibold ${size === s ? "border-lobo-navy bg-lobo-navy text-white" : "border-slate-300 hover:border-lobo-navy"}`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {warn && <p className="mt-1 text-xs text-red-600">Escolha um tamanho.</p>}
        <button
          disabled={soldOut}
          className="btn-navy mt-4 w-full"
          onClick={() => {
            if (p.sizes.length && !size) return setWarn(true);
            cart.add({ kind: "product", id: p.id, name: p.name, image: p.image, price: p.price, size: size || undefined });
          }}
        >
          {soldOut ? "Indisponível" : "Adicionar ao carrinho"}
        </button>
      </div>
    </article>
  );
}

export function CustomizationForm({ models, extraPrice }: { models: Product[]; extraPrice: number }) {
  const cart = useCart();
  const [modelId, setModelId] = useState(models[0]?.id ?? "");
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [size, setSize] = useState("");
  const [error, setError] = useState("");
  const model = models.find((m) => m.id === modelId);

  if (!model) return <EmptyState>Nenhum modelo disponível para personalização no momento.</EmptyState>;

  const price = model.price + extraPrice;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl bg-lobo-paper">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/camisa-costas.svg" alt={`${model.name} — costas`} className="h-full w-full object-cover" />
        <div className="absolute inset-x-0 top-[27%] text-center font-display uppercase text-white" style={{ textShadow: "0 0 3px #0B1F3A, 0 2px 6px rgba(0,0,0,.5)" }}>
          <p className="text-2xl tracking-widest">{name || "SEU NOME"}</p>
          <p className="text-7xl leading-none">{number || "10"}</p>
        </div>
        <p className="absolute bottom-2 inset-x-0 text-center text-[11px] text-slate-500">Prévia ilustrativa (costas)</p>
      </div>

      <form
        className="card space-y-4 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (!size) return setError("Escolha o tamanho.");
          if (!name.trim() && !number) return setError("Informe o nome e/ou o número.");
          if (model.stock <= 0) return setError("Modelo esgotado.");
          setError("");
          cart.add({ kind: "product", id: model.id, name: `${model.name} (personalizada)`, image: model.image, price, size, customization: { name: name.trim().toUpperCase(), number } });
          setName("");
          setNumber("");
        }}
      >
        <div>
          <label className="label" htmlFor="cz-model">Modelo</label>
          <select id="cz-model" className="input" value={modelId} onChange={(e) => setModelId(e.target.value)}>
            {models.map((m) => (
              <option key={m.id} value={m.id} disabled={m.stock <= 0}>
                {m.name} — {brl(m.price)}{m.stock <= 0 ? " (esgotado)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-[1fr_96px] gap-3">
          <div>
            <label className="label" htmlFor="cz-name">Nome para as costas</label>
            <input id="cz-name" className="input uppercase" maxLength={14} value={name} onChange={(e) => setName(e.target.value)} placeholder="Máx. 14 letras" />
          </div>
          <div>
            <label className="label" htmlFor="cz-number">Número</label>
            <input id="cz-number" className="input" inputMode="numeric" maxLength={2} value={number} onChange={(e) => setNumber(e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="00" />
          </div>
        </div>
        <div>
          <span className="label">Tamanho</span>
          <div className="flex gap-2" role="group" aria-label="Tamanho">
            {(model.sizes.length ? model.sizes : ["P", "M", "G", "GG"]).map((s) => (
              <button key={s} type="button" aria-pressed={size === s} onClick={() => setSize(s)} className={`h-11 flex-1 rounded-lg border font-semibold ${size === s ? "border-lobo-navy bg-lobo-navy text-white" : "border-slate-300"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-lobo-paper p-3 text-sm">
          <span>Camisa {brl(model.price)} + personalização {brl(extraPrice)}</span>
          <strong className="text-lg text-lobo-navy">{brl(price)}</strong>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-red w-full py-3 text-base">Adicionar uniforme personalizado</button>
      </form>
    </div>
  );
}
