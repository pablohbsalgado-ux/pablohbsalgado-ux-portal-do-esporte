import Link from "next/link";
import { notFound } from "next/navigation";
import { EventTypeBadge } from "@/components/events/EventCard";
import { BuyTickets } from "@/components/events/BuyTickets";
import { LotCountdown } from "@/components/events/LotCountdown";
import { IconClock, IconPin } from "@/components/icons";
import { Star } from "@/components/ui";
import { canBuy, currentLot, formatDeadline, isPastEvent, lotDeadline } from "@/lib/events";
import { brl, formatDate, mapsUrl, weekdayName } from "@/lib/format";
import { getCollection } from "@/lib/store";

// preço do lote depende do horário: sempre renderizada na hora
export const dynamic = "force-dynamic";

/** Link do YouTube → endereço de incorporação (outros links viram botão). */
function youtubeEmbed(url: string) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = (await getCollection("events")).find((e) => e.id === id);
  return { title: event?.name ?? "Evento" };
}

export default async function EventoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = (await getCollection("events")).find((e) => e.id === id && e.active);
  if (!event) notFound();

  const now = new Date();
  const { lot, index, next } = currentLot(event, now);
  const past = isPastEvent(event, now);
  const selling = canBuy(event, now);
  const dateLabel = `${weekdayName(event.date)}, ${formatDate(event.date, { day: "2-digit", month: "long" })}`;
  const embed = event.pastVideo ? youtubeEmbed(event.pastVideo) : null;

  return (
    <>
      <section className="bg-grain-navy relative overflow-hidden text-white">
        {event.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-lobo-navy via-lobo-navy/70 to-transparent" />
        <Star className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 animate-spinslow text-lobo-red/60" />
        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-10 sm:pt-16">
          <Link href="/eventos" className="text-sm font-bold uppercase text-white/70 hover:text-white">← Todos os eventos</Link>
          <div className="mt-4"><EventTypeBadge event={event} /></div>
          <h1 className="mt-3 max-w-4xl text-5xl leading-[0.9] sm:text-7xl">{event.name}</h1>
          <p className="mt-4 text-lg text-white/85">
            {dateLabel}{event.time ? ` · ${event.time}` : ""} · {event.location}
          </p>
        </div>
        <div className="tricolor absolute inset-x-0 bottom-0 h-2" />
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 pt-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-10">
          {event.image && (
            <div className="stamp -rotate-1 bg-white shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={event.image} alt={`Arte do evento ${event.name}`} className="w-full" />
            </div>
          )}

          {event.description && (
            <section>
              <h2 className="section-title"><span className="text-outline-red">Sobre</span> o evento</h2>
              <p className="mt-4 whitespace-pre-line text-lg leading-relaxed text-slate-700">{event.description}</p>
            </section>
          )}

          <section aria-labelledby="info">
            <h2 id="info" className="section-title"><span className="text-outline-red">Informações</span> essenciais</h2>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ["Data", dateLabel],
                ["Horário", event.time || "A definir"],
                ["Duração", event.duration || "A definir"],
                ["Local", event.location],
              ].map(([k, v]) => (
                <div key={k} className="card border-l-4 border-l-lobo-red p-4">
                  <dt className="label !mb-0.5">{k}</dt>
                  <dd className="font-display text-2xl text-lobo-navy">{v}</dd>
                </div>
              ))}
            </dl>
            <a href={mapsUrl(event.address || event.location)} target="_blank" rel="noreferrer" className="btn-ghost mt-4">
              <IconPin className="h-4 w-4" /> Ver local no mapa
            </a>
          </section>

          {(event.pastEditions || event.pastPhotos.length > 0 || event.pastVideo) && (
            <section aria-labelledby="reprise">
              <h2 id="reprise" className="section-title"><span className="text-outline-red">Reprise</span> das últimas edições</h2>
              {event.pastEditions && <p className="mt-4 whitespace-pre-line text-slate-700">{event.pastEditions}</p>}
              {embed && (
                <div className="mt-5 aspect-video overflow-hidden rounded-xl bg-black shadow-lg">
                  <iframe src={embed} title={`Vídeo das últimas edições de ${event.name}`} className="h-full w-full" allow="encrypted-media; picture-in-picture" allowFullScreen loading="lazy" />
                </div>
              )}
              {event.pastVideo && !embed && (
                <a href={event.pastVideo} target="_blank" rel="noopener noreferrer" className="btn-navy mt-5">▶ Assistir ao vídeo da última edição</a>
              )}
              {event.pastPhotos.length > 0 && (
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {event.pastPhotos.map((src, i) => (
                    <a key={src + i} href={src} target="_blank" rel="noreferrer" className={`group overflow-hidden rounded-lg bg-lobo-navy ${i % 3 === 0 ? "-rotate-1" : i % 3 === 1 ? "rotate-1" : ""}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Foto ${i + 1} de edições anteriores`} loading="lazy" className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105" />
                    </a>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-28 lg:h-fit">
          <div className="card overflow-hidden">
            <div className="bg-grain-navy border-b-4 border-lobo-red px-5 py-4 text-white">
              <p className="font-display text-2xl uppercase">Ingressos</p>
            </div>
            <div className="space-y-5 p-5">
              {past ? (
                <p className="text-slate-600">Esta edição já aconteceu. Confira a reprise e fique de olho na próxima!</p>
              ) : selling && lot ? (
                <>
                  <div>
                    <p className="label !mb-0">{lot.name}</p>
                    <p className="font-display text-5xl text-lobo-red">{lot.price === 0 ? "Grátis" : brl(lot.price)}</p>
                  </div>
                  {lot.endsAt && (
                    <div>
                      <p className="mb-2 text-sm font-bold uppercase text-lobo-navy">
                        Virada de lote em {formatDeadline(lot.endsAt)}
                        {next && <span className="block text-xs font-semibold normal-case text-slate-500">Depois: {next.name} por {brl(next.price)}</span>}
                      </p>
                      <LotCountdown endsAt={lot.endsAt} />
                    </div>
                  )}
                  <BuyTickets event={{ id: event.id, name: event.name, image: event.image, dateLabel: formatDate(event.date, { day: "2-digit", month: "2-digit" }) }} lot={{ name: lot.name, price: lot.price }} />
                </>
              ) : (
                <p className="font-display text-2xl uppercase text-slate-500">
                  {!event.salesOpen ? "Vendas em breve" : event.lots.length ? "Ingressos esgotados" : "Lotes em breve"}
                </p>
              )}

              {event.lots.length > 0 && (
                <div>
                  <p className="label">Lotes</p>
                  <ol className="divide-y rounded-lg border">
                    {event.lots.map((l, i) => {
                      const ended = l.soldOut || (lotDeadline(l) ? lotDeadline(l)!.getTime() <= now.getTime() : false);
                      const isCurrent = i === index;
                      return (
                        <li key={i} className={`flex items-center justify-between gap-2 px-3 py-2 text-sm ${isCurrent ? "bg-red-50 font-bold" : ""} ${ended && !isCurrent ? "text-slate-400 line-through" : ""}`}>
                          <span>
                            {l.name}
                            {l.endsAt && !ended && <span className="block text-[11px] font-normal text-slate-500">até {formatDeadline(l.endsAt)}</span>}
                          </span>
                          <span className="flex items-center gap-2">
                            {brl(l.price)}
                            {isCurrent && <span className="rounded bg-lobo-red px-1.5 text-[10px] uppercase text-white no-underline">Atual</span>}
                            {l.soldOut && <span className="rounded bg-slate-200 px-1.5 text-[10px] uppercase text-slate-600">Esgotado</span>}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}
              <p className="flex items-center gap-1 text-xs text-slate-500"><IconClock className="h-4 w-4" /> Horários de Brasília.</p>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
