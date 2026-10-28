"use client";

import { useMemo, useState } from "react";
import { isPastEvent, isSportsEvent } from "@/lib/events";
import type { LoboEvent } from "@/lib/types";
import { EmptyState, FilterChips } from "../ui";
import { EventCard } from "./EventCard";

const FILTERS = [
  { value: "all", label: "Todos" },
  { value: "festas", label: "Festas" },
  { value: "esportivos", label: "Esportivos" },
] as const;

export function EventsView({ events, nowIso }: { events: LoboEvent[]; nowIso: string }) {
  const now = useMemo(() => new Date(nowIso), [nowIso]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("all");

  const { upcoming, past } = useMemo(() => {
    const list = events.filter((e) => filter === "all" || (filter === "esportivos" ? isSportsEvent(e) : !isSportsEvent(e)));
    return {
      upcoming: list.filter((e) => !isPastEvent(e, now)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
      past: list.filter((e) => isPastEvent(e, now)).sort((a, b) => b.date.localeCompare(a.date)),
    };
  }, [events, filter, now]);

  return (
    <div className="mx-auto max-w-7xl px-4">
      <div className="card relative -mt-8 p-4 sm:p-5">
        <FilterChips label="Tipo de evento" options={FILTERS} value={filter} onChange={setFilter} />
      </div>

      <section className="mt-10" aria-labelledby="ev-proximos">
        <h2 id="ev-proximos" className="section-title"><span className="text-outline-red">Próximos</span> eventos</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.map((e) => <EventCard key={e.id} event={e} now={now} />)}
        </div>
        {upcoming.length === 0 && <EmptyState>Nenhum evento anunciado ainda. Fique de olho no Instagram!</EmptyState>}
      </section>

      {past.length > 0 && (
        <section className="mt-14" aria-labelledby="ev-passados">
          <h2 id="ev-passados" className="section-title"><span className="text-outline-red">Edições</span> anteriores</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((e) => <EventCard key={e.id} event={e} now={now} />)}
          </div>
        </section>
      )}
    </div>
  );
}
