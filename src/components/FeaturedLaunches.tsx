import Link from "next/link";
import { EVENT_TYPE_LABEL, canBuy, currentLot, formatDeadline, isSportsEvent } from "@/lib/events";
import { brl, formatDate } from "@/lib/format";
import type { LoboEvent, Product } from "@/lib/types";
import { Star } from "./ui";

type Launch =
  | { kind: "event"; event: LoboEvent }
  | { kind: "product"; product: Product };

/**
 * Vitrine "Lançamentos" da página inicial: produtos, festas e jogos marcados como
 * "Destaque na página inicial" no painel. O primeiro aparece grande.
 */
export function FeaturedLaunches({ events, products, now }: { events: LoboEvent[]; products: Product[]; now: Date }) {
  const launches: Launch[] = [
    ...events.filter((e) => e.featured && canBuy(e, now)).sort((a, b) => a.date.localeCompare(b.date)).map((event) => ({ kind: "event" as const, event })),
    ...products.filter((p) => p.featured && p.active && p.stock > 0).map((product) => ({ kind: "product" as const, product })),
  ];
  if (launches.length === 0) return null;

  return (
    <section className="mt-14" aria-labelledby="lancamentos">
      <div className="flex items-end justify-between">
        <h2 id="lancamentos" className="section-title"><span className="text-outline-red">Lança</span>mentos</h2>
        <span className="hidden -rotate-2 bg-lobo-red px-3 py-1 font-display text-sm uppercase tracking-wider text-white sm:inline-block">À venda agora</span>
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {launches.map((l, i) => (
          <LaunchCard key={l.kind === "event" ? `e${l.event.id}` : `p${l.product.id}`} launch={l} big={i === 0 && launches.length > 1} now={now} />
        ))}
      </div>
    </section>
  );
}

function LaunchCard({ launch, big, now }: { launch: Launch; big: boolean; now: Date }) {
  const isEvent = launch.kind === "event";
  const href = isEvent ? `/eventos/${launch.event.id}` : "/vendas#produtos";
  const image = isEvent ? launch.event.image : launch.product.image;
  const name = isEvent ? launch.event.name : launch.product.name;
  const badge = isEvent ? EVENT_TYPE_LABEL[launch.event.type] : launch.product.badge || "Produto";
  const badgeColor = isEvent && isSportsEvent(launch.event) ? "bg-lobo-blue" : isEvent ? "bg-lobo-red" : "bg-lobo-navy";
  const lot = isEvent ? currentLot(launch.event, now).lot : null;
  const price = isEvent ? lot?.price ?? 0 : launch.product.price;

  return (
    <Link
      href={href}
      className={`group relative flex overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-lobo-navy/10 transition hover:-translate-y-1 hover:shadow-2xl ${big ? "flex-col md:col-span-2 md:flex-row lg:row-span-2 lg:flex-col" : "flex-col"}`}
    >
      <div className={`relative overflow-hidden bg-lobo-navy ${big ? "aspect-[16/10] md:w-1/2 lg:w-auto" : "aspect-[16/10]"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image || "/img/logo.png"} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <span className={`absolute left-3 top-3 rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white ${badgeColor}`}>{badge}</span>
        {big && <Star className="absolute -bottom-6 -right-6 h-24 w-24 text-lobo-red" />}
      </div>
      <div className={`flex flex-1 flex-col p-5 ${big ? "md:justify-center" : ""}`}>
        {isEvent && (
          <p className="text-xs font-bold uppercase tracking-wider text-lobo-red">
            {formatDate(launch.event.date, { day: "2-digit", month: "long" })}{launch.event.time ? ` · ${launch.event.time}` : ""} · {launch.event.location}
          </p>
        )}
        <h3 className={`mt-1 leading-tight text-lobo-navy ${big ? "text-4xl sm:text-5xl" : "text-2xl"}`}>{name}</h3>
        {big && isEvent && launch.event.description && <p className="mt-2 line-clamp-3 text-slate-600">{launch.event.description}</p>}
        {big && !isEvent && launch.product.description && <p className="mt-2 line-clamp-3 text-slate-600">{launch.product.description}</p>}
        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <span>
            {isEvent && lot && <span className="block text-[11px] font-bold uppercase text-slate-500">{lot.name}</span>}
            <span className={`font-display text-lobo-red ${big ? "text-4xl" : "text-3xl"}`}>{price === 0 ? "Grátis" : brl(price)}</span>
            {isEvent && lot?.endsAt && <span className="block text-[11px] text-slate-500">vira em {formatDeadline(lot.endsAt)}</span>}
          </span>
          <span className="btn-red">{isEvent ? "Comprar ingresso" : "Comprar"}</span>
        </div>
      </div>
    </Link>
  );
}
