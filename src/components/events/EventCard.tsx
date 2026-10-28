import Link from "next/link";
import { EVENT_TYPE_LABEL, canBuy, currentLot, formatDeadline, isPastEvent, isSportsEvent } from "@/lib/events";
import { brl, formatDate, weekdayName } from "@/lib/format";
import type { LoboEvent } from "@/lib/types";

export function EventTypeBadge({ event }: { event: LoboEvent }) {
  return (
    <span className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white ${isSportsEvent(event) ? "bg-lobo-blue" : "bg-lobo-red"}`}>
      {EVENT_TYPE_LABEL[event.type]}
    </span>
  );
}

export function EventCard({ event, now }: { event: LoboEvent; now: Date }) {
  const { lot } = currentLot(event, now);
  const past = isPastEvent(event, now);
  const selling = canBuy(event, now);
  return (
    <Link href={`/eventos/${event.id}`} className="card group flex flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[16/10] overflow-hidden bg-lobo-navy">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={event.image || "/img/titulo-1.svg"} alt="" className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${past ? "grayscale" : ""}`} />
        <div className="absolute left-3 top-3"><EventTypeBadge event={event} /></div>
        <div className="stamp absolute bottom-3 right-3 bg-lobo-paper text-center text-lobo-navy">
          <span className="block font-display text-2xl leading-none">{formatDate(event.date, { day: "2-digit" })}</span>
          <span className="text-[10px] font-bold uppercase">{formatDate(event.date, { month: "short" })}</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-2xl leading-tight text-lobo-navy">{event.name}</h3>
        <p className="mt-1 text-sm text-slate-500">
          {weekdayName(event.date)}{event.time ? ` · ${event.time}` : ""} · {event.location}
        </p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          {past ? (
            <span className="text-sm font-semibold text-slate-500">Edição encerrada · ver reprise</span>
          ) : selling && lot ? (
            <span>
              <span className="block text-[11px] font-bold uppercase text-slate-500">{lot.name}</span>
              <span className="font-display text-2xl text-lobo-red">{lot.price === 0 ? "Grátis" : brl(lot.price)}</span>
              {lot.endsAt && <span className="block text-[11px] text-slate-500">vira em {formatDeadline(lot.endsAt)}</span>}
            </span>
          ) : (
            <span className="text-sm font-bold uppercase text-slate-500">{event.lots.length ? "Ingressos esgotados" : "Em breve"}</span>
          )}
          <span className="text-sm font-bold uppercase text-lobo-navy group-hover:text-lobo-red">Ver →</span>
        </div>
      </div>
    </Link>
  );
}
