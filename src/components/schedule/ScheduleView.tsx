"use client";

import { useMemo, useState } from "react";
import { mapsUrl, minutes } from "@/lib/format";
import { WEEK_DAYS } from "@/lib/schema";
import type { Training, WeekDay } from "@/lib/types";
import { EmptyState, FilterChips } from "../ui";
import { IconChevron, IconPin } from "../icons";

const SLOT = 30; // minutos por linha
const SLOT_PX = 44;
const DEFAULT_RANGE = { start: 17 * 60, end: 22 * 60 };

const PALETTE = [
  "border-l-lobo-red bg-red-50",
  "border-l-lobo-navy bg-indigo-50",
  "border-l-emerald-500 bg-emerald-50",
  "border-l-rose-500 bg-rose-50",
  "border-l-violet-500 bg-violet-50",
  "border-l-orange-500 bg-orange-50",
];

// Cores da legenda da escala oficial: vermelho = quadra interna, azul = quadra externa.
const COURT_STYLE = {
  interna: { box: "border-l-lobo-red bg-red-50", dot: "bg-lobo-red", label: "Quadra interna" },
  externa: { box: "border-l-lobo-blue bg-blue-50", dot: "bg-lobo-blue", label: "Quadra externa" },
};

function courtKind(court: string): keyof typeof COURT_STYLE | null {
  const c = court.toLowerCase();
  if (c.includes("intern")) return "interna";
  if (c.includes("extern")) return "externa";
  return null;
}

/** Rótulo curto para a grade: "Interna" / "Externa" (o nome completo fica no título e no celular). */
function courtShort(court: string) {
  const kind = courtKind(court);
  return kind ? COURT_STYLE[kind].label.replace("Quadra ", "Q. ") : court;
}

/** Faixa de horário (hora cheia) que cobre os treinos; vazia → 17h–22h. */
function rangeOf(items: Training[]) {
  if (!items.length) return DEFAULT_RANGE;
  const start = Math.min(...items.map((t) => minutes(t.start)));
  const end = Math.max(...items.map((t) => minutes(t.end)));
  return { start: Math.floor(start / 60) * 60, end: Math.ceil(end / 60) * 60 };
}

/**
 * Distribui treinos sobrepostos do mesmo dia em "faixas" lado a lado. As faixas são
 * contadas por grupo de treinos que se sobrepõem, então um treino sozinho no horário
 * ocupa a largura toda da coluna.
 */
function withLanes(items: Training[]) {
  const sorted = [...items].sort((a, b) => a.start.localeCompare(b.start));
  const placed: { t: Training; lane: number; lanes: number }[] = [];
  let cluster: { t: Training; lane: number; lanes: number }[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -1;
  const close = () => cluster.forEach((p) => (p.lanes = Math.max(1, laneEnds.length)));
  for (const t of sorted) {
    if (minutes(t.start) >= clusterEnd) {
      close();
      cluster = [];
      laneEnds = [];
    }
    let lane = laneEnds.findIndex((end) => end <= minutes(t.start));
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = minutes(t.end);
    clusterEnd = Math.max(clusterEnd, minutes(t.end));
    const item = { t, lane, lanes: 1 };
    cluster.push(item);
    placed.push(item);
  }
  close();
  return placed;
}

export function ScheduleView({
  trainings,
  modalities,
  todayDay,
  notice,
  period,
}: {
  trainings: Training[];
  modalities: string[];
  todayDay: WeekDay | null;
  notice: string;
  period: string;
}) {
  const [modality, setModality] = useState("all");
  const color = (t: Training) => {
    const kind = courtKind(t.court);
    return kind ? COURT_STYLE[kind].box : PALETTE[Math.max(0, modalities.indexOf(t.modality)) % PALETTE.length];
  };

  const byDay = useMemo(() => {
    const filtered = trainings.filter((t) => modality === "all" || t.modality === modality);
    return Object.fromEntries(WEEK_DAYS.map((d) => [d.value, filtered.filter((t) => t.day === d.value).sort((a, b) => a.start.localeCompare(b.start))])) as Record<WeekDay, Training[]>;
  }, [trainings, modality]);

  const total = Object.values(byDay).reduce((s, l) => s + l.length, 0);

  const blocks = useMemo(() => {
    const weekdays = WEEK_DAYS.filter((d) => d.value !== "sab");
    const saturday = WEEK_DAYS.filter((d) => d.value === "sab");
    const all = trainings.filter((t) => modality === "all" || t.modality === modality);
    const weekRange = rangeOf(all.filter((t) => t.day !== "sab"));
    const satItems = all.filter((t) => t.day === "sab");
    const satRange = rangeOf(satItems);
    const fits = !satItems.length || (satRange.start >= weekRange.start && satRange.end <= weekRange.end);
    return fits
      ? [{ days: [...WEEK_DAYS], range: weekRange }]
      : [{ days: weekdays, range: weekRange }, { days: saturday, range: satRange }];
  }, [trainings, modality]);

  const courts = (Object.keys(COURT_STYLE) as (keyof typeof COURT_STYLE)[]).filter((k) => trainings.some((t) => courtKind(t.court) === k));

  return (
    <div className="mx-auto max-w-7xl px-4">
      <div className="card relative -mt-8 space-y-4 p-4 sm:p-5">
        <FilterChips label="Modalidade" value={modality} onChange={setModality} options={[{ value: "all", label: "Todas" }, ...modalities.map((m) => ({ value: m, label: m }))]} />
        {(courts.length > 0 || period) && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t pt-3 text-sm">
            {period && <span className="font-bold uppercase text-lobo-navy">{period}</span>}
            {courts.map((k) => (
              <span key={k} className="inline-flex items-center gap-2 font-semibold text-lobo-navy">
                <span className={`h-3.5 w-3.5 rounded-full ${COURT_STYLE[k].dot}`} /> {COURT_STYLE[k].label}
              </span>
            ))}
          </div>
        )}
      </div>

      {notice && (
        <p role="note" className="stamp mt-6 bg-white text-center text-sm font-bold uppercase tracking-wide text-lobo-red">
          ⚠️ {notice}
        </p>
      )}

      {total === 0 && <div className="mt-8"><EmptyState>Nenhum treino cadastrado para esta modalidade.</EmptyState></div>}

      {/* Desktop: matriz dias × horários. Se o sábado tiver treinos fora da faixa da semana
          (ex.: de manhã), ele ganha um painel próprio com a sua régua de horários. */}
      {total > 0 && (
        <div className="mt-8 hidden gap-4 md:flex">
          {blocks.map((b) => (
            <ScheduleGrid key={b.days.map((d) => d.value).join()} days={b.days} range={b.range} byDay={byDay} todayDay={todayDay} color={color} grow={b.days.length} />
          ))}
        </div>
      )}

      {/* Mobile: sanfona por dia */}
      {total > 0 && (
        <div className="mt-6 space-y-3 md:hidden">
          {WEEK_DAYS.map((d) => {
            const list = byDay[d.value];
            return (
              <details key={d.value} open={todayDay === d.value} className="card group overflow-hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5">
                  <span className="font-display text-lg uppercase tracking-wider text-lobo-navy">
                    {d.label}
                    {todayDay === d.value && <span className="ml-2 rounded bg-lobo-red px-1.5 py-0.5 align-middle font-sans text-[10px] font-bold text-white">HOJE</span>}
                  </span>
                  <span className="flex items-center gap-2 text-sm text-slate-500">
                    {list.length} {list.length === 1 ? "treino" : "treinos"}
                    <IconChevron className="h-5 w-5 transition group-open:rotate-180" />
                  </span>
                </summary>
                <ul className="space-y-2 border-t px-4 py-3">
                  {list.length === 0 && <li className="text-sm text-slate-500">Sem treinos neste dia.</li>}
                  {list.map((t) => (
                    <li key={t.id} className={`rounded-lg border-l-4 p-3 ${color(t)}`}>
                      <div className="flex items-baseline justify-between">
                        <p className="font-bold text-lobo-navy">{t.modality} · {t.category}</p>
                        <p className="text-sm font-semibold tabular-nums">{t.start}–{t.end}</p>
                      </div>
                      <a href={mapsUrl(t.address || t.court)} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm text-slate-600">
                        <IconPin className="h-4 w-4" /> {t.court}
                      </a>
                      {t.coach && <p className="text-xs text-slate-500">Responsável: {t.coach}</p>}
                    </li>
                  ))}
                </ul>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ScheduleGrid({
  days,
  range,
  byDay,
  todayDay,
  color,
  grow,
}: {
  days: readonly { value: WeekDay; label: string }[];
  range: { start: number; end: number };
  byDay: Record<WeekDay, Training[]>;
  todayDay: WeekDay | null;
  color: (t: Training) => string;
  grow: number;
}) {
  const rows = (range.end - range.start) / SLOT;
  const cols = `56px repeat(${days.length}, minmax(0, 1fr))`;
  return (
    <div className="card h-fit min-w-0 overflow-hidden" style={{ flex: `${grow} 1 0` }}>
      <div className="grid border-b-4 border-lobo-red bg-grain-navy text-white" style={{ gridTemplateColumns: cols }}>
        <div className="grid place-items-center text-[10px] font-bold uppercase tracking-wider text-white/60">Hora</div>
        {days.map((d) => (
          <div key={d.value} className={`px-2 py-3 text-center font-display uppercase tracking-wider ${todayDay === d.value ? "bg-lobo-red text-white" : ""}`}>
            {d.label}
          </div>
        ))}
      </div>
      <div className="grid" style={{ gridTemplateColumns: cols }}>
        <div className="relative" style={{ height: rows * SLOT_PX }}>
          {Array.from({ length: rows + 1 }, (_, i) => range.start + i * SLOT)
            .filter((m) => m % 60 === 0)
            .map((m) => (
              <span key={m} className="absolute right-2 -translate-y-1/2 text-xs font-semibold text-slate-500" style={{ top: Math.min(rows * SLOT_PX - 8, Math.max(8, ((m - range.start) / SLOT) * SLOT_PX)) }}>
                {String(m / 60).padStart(2, "0")}:00
              </span>
            ))}
        </div>
        {days.map((d) => {
          const placed = withLanes(byDay[d.value]);
          return (
            <div
              key={d.value}
              className={`relative border-l ${todayDay === d.value ? "bg-red-50/50" : ""}`}
              style={{
                height: rows * SLOT_PX,
                backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 ${SLOT_PX * 2 - 1}px, #e2e8f0 ${SLOT_PX * 2 - 1}px ${SLOT_PX * 2}px)`,
              }}
            >
              {placed.map(({ t, lane, lanes }) => {
                const start = Math.max(range.start, minutes(t.start));
                const end = Math.min(range.end, minutes(t.end));
                if (end <= start) return null;
                return (
                  <div
                    key={t.id}
                    className={`absolute overflow-hidden rounded-md border-l-4 p-1.5 text-xs shadow-sm ${color(t)}`}
                    style={{
                      top: ((start - range.start) / SLOT) * SLOT_PX + 2,
                      height: ((end - start) / SLOT) * SLOT_PX - 4,
                      left: `calc(${(lane / lanes) * 100}% + 3px)`,
                      width: `calc(${100 / lanes}% - 6px)`,
                    }}
                    title={`${t.modality} ${t.category} · ${t.start}–${t.end} · ${t.court}`}
                  >
                    <p className="font-bold leading-tight text-lobo-navy">{t.modality}</p>
                    <p className="text-slate-600">{t.category}</p>
                    <p className="mt-0.5 text-slate-500">{t.start}–{t.end}</p>
                    <a href={mapsUrl(t.address || t.court)} target="_blank" rel="noreferrer" className="mt-0.5 block truncate font-semibold text-slate-600 underline-offset-2 hover:underline">
                      {courtShort(t.court)}
                    </a>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
