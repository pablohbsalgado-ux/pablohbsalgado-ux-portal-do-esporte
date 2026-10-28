// Regras dos eventos: lote vigente, virada de lote e rótulos.
// Usado no servidor (preço cobrado no checkout) e no navegador (contagem para a virada).

import type { EventLot, EventType, LoboEvent } from "./types";

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  festa: "Festa",
  campeonato: "Campeonato",
  jogo: "Jogo",
  outro: "Evento",
};

export const isSportsEvent = (e: Pick<LoboEvent, "type">) => e.type === "campeonato" || e.type === "jogo";

/** "AAAA-MM-DDTHH:MM" no horário de Brasília (UTC-3, sem horário de verão desde 2019) → instante. */
export function lotDeadline(lot: Pick<EventLot, "endsAt">): Date | null {
  return lot.endsAt ? new Date(`${lot.endsAt}:00-03:00`) : null;
}

export interface LotState {
  lot: EventLot | null; // lote à venda agora (null = esgotado/encerrado)
  index: number;
  next: EventLot | null; // próximo lote, para "vira para R$ X"
}

/** O lote vigente é o primeiro que não está esgotado e cuja virada ainda não passou. */
export function currentLot(event: Pick<LoboEvent, "lots">, now = new Date()): LotState {
  const lots = event.lots ?? [];
  const index = lots.findIndex((l) => !l.soldOut && (!l.endsAt || lotDeadline(l)!.getTime() > now.getTime()));
  if (index === -1) return { lot: null, index: -1, next: null };
  return { lot: lots[index], index, next: lots.slice(index + 1).find((l) => !l.soldOut) ?? null };
}

/** O evento já aconteceu? (fim do dia do evento, em Brasília) */
export function isPastEvent(event: Pick<LoboEvent, "date">, now = new Date()) {
  return new Date(`${event.date}T23:59:59-03:00`).getTime() < now.getTime();
}

/** Ingressos à venda agora: evento visível, vendas abertas, data futura e com lote vigente. */
export function canBuy(event: LoboEvent, now = new Date()) {
  return event.active && event.salesOpen && !isPastEvent(event, now) && currentLot(event, now).lot !== null;
}

export function formatDeadline(endsAt: string) {
  const d = lotDeadline({ endsAt });
  return d ? d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";
}
