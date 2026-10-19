"use client";

import { useMemo, useState } from "react";
import { mapsUrl, minutes } from "@/lib/format";
import { WEEK_DAYS } from "@/lib/schema";
import type { Training, WeekDay } from "@/lib/types";
import { EmptyState, FilterChips } from "../ui";
import { IconChevron, IconPin } from "../icons";

const GRID_START = 17 * 60;
const GRID_END = 22 * 60;
const SLOT = 30; // minutos por linha
const SLOT_PX = 44;

const PALETTE = [
  "border-l-lobo-red bg-red-50",
  "border-l-lobo-navy bg-indigo-50",
  "border-l-emerald-500 bg-emerald-50",
  "border-l-rose-500 bg-rose-50",
  "border-l-violet-500 bg-violet-50",
  "border-l-orange-500 bg-orange-50",
];

/** Distribui treinos sobrepostos do mesmo dia em "faixas" lado a lado. */
function withLanes(items: Training[]) {
  const sorted = [...items].sort((a, b) => a.start.localeCompare(b.start));
  const laneEnds: number[] = [];
  const placed = sorted.map((t) => {
    let lane = laneEnds.findIndex((end) => end <= minutes(t.start));
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = minutes(t.end);
    return { t, lane };
  });
  return { placed, lanes: Math.max(1, laneEnds.length) };
}

export function ScheduleView({ trainings, modalities, todayDay }: { trainings: Training[]; modalities: string[]; todayDay: WeekDay | null }) {
  const [modality, setModality] = useState("all");
  const color = (m: string) => PALETTE[Math.max(0, modalities.indexOf(m)) % PALETTE.length];

  const byDay = useMemo(() => {
    const filtered = trainings.filter((t) => modality === "all" || t.modality === modality);
    return Object.fromEntries(WEEK_DAYS.map((d) => [d.value, filtered.filter((t) => t.day === d.value).sort((a, b) => a.start.localeCompare(b.start))])) as Record<WeekDay, Training[]>;
  }, [trainings, modality]);

  const total = Object.values(byDay).reduce((s, l) => s + l.length, 0);
  const rows = (GRID_END - GRID_START) / SLOT;

  return (
    <div className="mx-auto max-w-7xl px-4">
      <div className="card relative -mt-8 p-4 sm:p-5">
        <FilterChips label="Modalidade" value={modality} onChange={setModality} options={[{ value: "all", label: "Todas" }, ...modalities.map((m) => ({ value: m, label: m }))]} />
      </div>

      {total === 0 && <div className="mt-8"><EmptyState>Nenhum treino cadastrado para esta modalidade.</EmptyState></div>}

      {/* Desktop: matriz dias × horários */}
      {total > 0 && (
        <div className="card mt-8 hidden overflow-hidden md:block">
          <div className="grid grid-cols-[64px_repeat(6,minmax(0,1fr))] border-b-4 border-lobo-red bg-grain-navy text-white">
            <div />
            {WEEK_DAYS.map((d) => (
              <div key={d.value} className={`px-2 py-3 text-center font-display uppercase tracking-wider ${todayDay === d.value ? "bg-lobo-red text-white" : ""}`}>
                {d.label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-[64px_repeat(6,minmax(0,1fr))]">
            <div className="relative" style={{ height: rows * SLOT_PX }}>
              {Array.from({ length: rows + 1 }, (_, i) => GRID_START + i * SLOT)
                .filter((m) => m % 60 === 0)
                .map((m) => (
                  <span key={m} className="absolute right-2 -translate-y-1/2 text-xs font-semibold text-slate-500" style={{ top: Math.min(rows * SLOT_PX - 8, Math.max(8, ((m - GRID_START) / SLOT) * SLOT_PX)) }}>
                    {String(m / 60).padStart(2, "0")}:00
                  </span>
                ))}
            </div>
            {WEEK_DAYS.map((d) => {
              const { placed, lanes } = withLanes(byDay[d.value]);
              return (
                <div
                  key={d.value}
                  className={`relative border-l ${todayDay === d.value ? "bg-red-50/50" : ""}`}
                  style={{
                    height: rows * SLOT_PX,
                    backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 ${SLOT_PX * 2 - 1}px, #e2e8f0 ${SLOT_PX * 2 - 1}px ${SLOT_PX * 2}px)`,
                  }}
                >
                  {placed.map(({ t, lane }) => {
                    const start = Math.max(GRID_START, minutes(t.start));
                    const end = Math.min(GRID_END, minutes(t.end));
                    if (end <= start) return null;
                    return (
                      <div
                        key={t.id}
                        className={`absolute overflow-hidden rounded-md border-l-4 p-1.5 text-xs shadow-sm ${color(t.modality)}`}
                        style={{
                          top: ((start - GRID_START) / SLOT) * SLOT_PX + 2,
                          height: ((end - start) / SLOT) * SLOT_PX - 4,
                          left: `calc(${(lane / lanes) * 100}% + 3px)`,
                          width: `calc(${100 / lanes}% - 6px)`,
                        }}
                        title={`${t.modality} ${t.category} · ${t.start}–${t.end} · ${t.court}`}
                      >
                        <p className="font-bold leading-tight text-lobo-navy">{t.modality}</p>
                        <p className="text-slate-600">{t.category}</p>
                        <p className="mt-0.5 text-slate-500">{t.start}–{t.end}</p>
                        <a href={mapsUrl(t.address || t.court)} target="_blank" rel="noreferrer" className="mt-0.5 block truncate text-slate-600 underline-offset-2 hover:underline">
                          {t.court}
                        </a>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
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
                    {todayDay === d.value && <span className="ml-2 rounded bg-lobo-red px-1.5 py-0.5 align-middle text-[10px] font-bold">HOJE</span>}
                  </span>
                  <span className="flex items-center gap-2 text-sm text-slate-500">
                    {list.length} {list.length === 1 ? "treino" : "treinos"}
                    <IconChevron className="h-5 w-5 transition group-open:rotate-180" />
                  </span>
                </summary>
                <ul className="space-y-2 border-t px-4 py-3">
                  {list.length === 0 && <li className="text-sm text-slate-500">Sem treinos neste dia.</li>}
                  {list.map((t) => (
                    <li key={t.id} className={`rounded-lg border-l-4 p-3 ${color(t.modality)}`}>
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
