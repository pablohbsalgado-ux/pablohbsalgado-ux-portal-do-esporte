"use client";

import { useMemo, useState } from "react";
import { formatDate, gameStatus, mapsUrl, splitGames, weekdayName } from "@/lib/format";
import type { Game } from "@/lib/types";
import { EmptyState, FilterChips, StatusBadge } from "../ui";
import { IconClock, IconPin } from "../icons";

const CATEGORY_OPTS = [
  { value: "all", label: "Todas" },
  { value: "Masculino", label: "Masculino" },
  { value: "Feminino", label: "Feminino" },
] as const;

export function GamesView({ games, modalities, today }: { games: Game[]; modalities: string[]; today: string }) {
  const [modality, setModality] = useState("all");
  const [category, setCategory] = useState<(typeof CATEGORY_OPTS)[number]["value"]>("all");

  const { upcoming, results } = useMemo(() => {
    const filtered = games.filter(
      (g) => (modality === "all" || g.modality === modality) && (category === "all" || g.category === category || g.category === "Misto"),
    );
    return splitGames(filtered, today);
  }, [games, modality, category, today]);

  return (
    <div className="mx-auto max-w-7xl px-4">
      <div className="card -mt-8 relative space-y-3 p-4 sm:p-5">
        <FilterChips label="Modalidade" value={modality} onChange={setModality} options={[{ value: "all", label: "Todas as modalidades" }, ...modalities.map((m) => ({ value: m, label: m }))]} />
        <FilterChips label="Categoria" value={category} onChange={setCategory} options={CATEGORY_OPTS} />
      </div>

      <section className="mt-10" aria-labelledby="proximos">
        <h2 id="proximos" className="section-title">Próximos jogos</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {upcoming.map((g, i) => (
            <GameCard key={g.id} game={g} today={today} index={i} />
          ))}
        </div>
        {upcoming.length === 0 && <EmptyState>Nenhum jogo agendado para este filtro.</EmptyState>}
      </section>

      <section className="mt-14" aria-labelledby="resultados">
        <h2 id="resultados" className="section-title">Resultados recentes</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {results.map((g) => (
            <ResultRow key={g.id} game={g} />
          ))}
        </div>
        {results.length === 0 && <EmptyState>Nenhum resultado para este filtro.</EmptyState>}
      </section>
    </div>
  );
}

function initials(name: string) {
  const words = name.replace(/^Atl[ée]tica\s+/i, "").split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? "?").slice(0, 2)).toUpperCase();
}

/** Escudo do time; sem imagem cadastrada, mostra as iniciais (ex.: "UFRJ EEFD" → "UE"). */
function TeamBadge({ src, name, className }: { src: string; name: string; className: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={`Escudo ${name}`} className={`${className} object-contain`} />;
  }
  return (
    <span aria-hidden="true" className={`${className} grid place-items-center rounded-full border-2 border-lobo-navy/20 bg-lobo-paper font-display text-lobo-navy`}>
      {initials(name)}
    </span>
  );
}

function Crest({ src, name }: { src: string; name: string }) {
  return (
    <div className="flex w-24 flex-col items-center gap-2 text-center">
      <TeamBadge src={src} name={name} className="h-16 w-16 text-2xl" />
      <span className="text-xs font-semibold leading-tight">{name}</span>
    </div>
  );
}

const HOME_AWAY_LABEL: Record<Game["homeAway"], string> = { casa: "Mando do CEFET", fora: "Fora de casa", neutro: "Local neutro" };

export function GameCard({ game, today, index = 0 }: { game: Game; today: string; index?: number }) {
  const status = gameStatus(game, today);
  const home = game.homeAway !== "fora"; // em casa ou neutro, o CEFET aparece à esquerda
  return (
    <article className="card animate-rise overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg" style={{ animationDelay: `${index * 60}ms` }}>
      <div className="bg-grain-navy flex items-center justify-between border-b-4 border-lobo-red px-4 py-2.5 text-white">
        <span className="text-sm font-semibold">
          {game.modality} · {game.category}
        </span>
        <StatusBadge status={status} />
      </div>
      <div className="p-5">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-500">{game.competition}</p>
        <div className="mt-4 flex items-center justify-between">
          {home ? <Crest src="/img/logo.png" name="CEFET" /> : <Crest src={game.opponentLogo} name={game.opponent} />}
          <div className="text-center">
            <p className="font-display text-3xl text-lobo-navy">{formatDate(game.date)}</p>
            <p className="text-sm text-slate-500">{weekdayName(game.date)}</p>
            <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-lobo-paper px-2 py-0.5 text-sm font-bold">
              <IconClock className="h-4 w-4" /> {game.time || "Horário a definir"}
            </p>
          </div>
          {home ? <Crest src={game.opponentLogo} name={game.opponent} /> : <Crest src="/img/logo.png" name="CEFET" />}
        </div>
        <div className="mt-5 flex items-center justify-between gap-3 border-t pt-4">
          <p className="min-w-0 text-sm">
            <span className="block truncate font-semibold">{game.location}</span>
            <span className="text-xs text-slate-500">{HOME_AWAY_LABEL[game.homeAway] ?? ""}</span>
          </p>
          <a href={mapsUrl(game.address || game.location)} target="_blank" rel="noreferrer" className="btn-ghost flex-none px-3 py-2">
            <IconPin className="h-4 w-4" /> Ver no mapa
          </a>
        </div>
        {game.notes && <p className="mt-3 text-xs text-slate-500">{game.notes}</p>}
      </div>
    </article>
  );
}

function ResultRow({ game }: { game: Game }) {
  const lobo = game.scoreLobo ?? 0;
  const opp = game.scoreOpponent ?? 0;
  const outcome = lobo > opp ? { t: "Vitória", c: "bg-emerald-600" } : lobo < opp ? { t: "Derrota", c: "bg-red-600" } : { t: "Empate", c: "bg-slate-500" };
  return (
    <article className="card flex items-center gap-4 p-4">
      <div className="hidden w-20 flex-none whitespace-nowrap text-center sm:block">
        <p className="font-display text-xl text-lobo-navy">{formatDate(game.date)}</p>
        <p className="text-xs text-slate-500">{game.modality}</p>
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/logo.png" alt="CEFET" className="h-10 w-10" />
          <span className="font-display text-4xl tabular-nums text-lobo-navy">
            {game.scoreLobo ?? "–"} <span className="text-slate-300">×</span> {game.scoreOpponent ?? "–"}
          </span>
          <TeamBadge src={game.opponentLogo} name={game.opponent} className="h-10 w-10 text-sm" />
        </div>
        <p className="max-w-full truncate text-sm font-bold uppercase text-lobo-navy">CEFET × {game.opponent}</p>
      </div>
      <div className="flex w-28 flex-none flex-col items-end gap-1 text-right">
        <StatusBadge status="Finalizado" />
        <span className={`rounded px-1.5 text-[11px] font-bold uppercase text-white ${outcome.c}`}>{outcome.t}</span>
        <span className="truncate text-xs text-slate-500 sm:hidden">{formatDate(game.date)} · {game.modality}</span>
        <span className="hidden text-xs text-slate-500 sm:block">{game.category}{game.notes ? ` · ${game.notes}` : ""}</span>
      </div>
    </article>
  );
}
