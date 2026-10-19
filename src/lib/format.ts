import type { Game, Placement } from "./types";

export const TZ = "America/Sao_Paulo";

export function brl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Data de hoje (AAAA-MM-DD) no fuso de Brasília. */
export function todayISO(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

function parseISO(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

export function daysBetween(fromISO: string, toISO: string) {
  return Math.round((parseISO(toISO).getTime() - parseISO(fromISO).getTime()) / 86_400_000);
}

export function formatDate(date: string, opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" }) {
  return parseISO(date).toLocaleDateString("pt-BR", { timeZone: "UTC", ...opts }).replace(".", "");
}

export function weekdayName(date: string) {
  const s = parseISO(date).toLocaleDateString("pt-BR", { timeZone: "UTC", weekday: "long" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export type DisplayStatus = "Agendado" | "Em Breve" | "Hoje" | "Em Andamento" | "Finalizado" | "Adiado";

/** Status exibido no card. "auto" é calculado pela data (Em Breve = próximos 3 dias). */
export function gameStatus(game: Pick<Game, "status" | "date">, today = todayISO()): DisplayStatus {
  switch (game.status) {
    case "finalizado": return "Finalizado";
    case "em_andamento": return "Em Andamento";
    case "adiado": return "Adiado";
    case "agendado": return game.date === today ? "Hoje" : "Agendado";
  }
  const diff = daysBetween(today, game.date);
  if (diff === 0) return "Hoje";
  if (diff > 0 && diff <= 3) return "Em Breve";
  return "Agendado";
}

/** Próximos = não finalizados a partir de hoje (ou em andamento); Resultados = finalizados, mais recentes primeiro. */
export function splitGames(games: Game[], today = todayISO()) {
  const upcoming = games
    .filter((g) => g.status !== "finalizado" && (g.date >= today || g.status === "em_andamento"))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const results = games
    .filter((g) => g.status === "finalizado")
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  return { upcoming, results };
}

export function mapsUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export const PLACEMENT_LABEL: Record<Placement, string> = {
  campeao: "Campeão",
  vice: "Vice-campeão",
  terceiro: "3º lugar",
  destaque: "Destaque",
};

/** Modalidades que aparecem em `used`, na ordem cadastrada nas Configurações (as não cadastradas vão ao fim). */
export function modalitiesInUse(configured: string[], used: string[]) {
  const set = new Set(used);
  return [...configured.filter((m) => set.has(m)), ...[...set].filter((m) => !configured.includes(m))];
}

export function minutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
