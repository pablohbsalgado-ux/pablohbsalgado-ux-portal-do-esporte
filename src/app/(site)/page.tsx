import Link from "next/link";
import { GameCard } from "@/components/games/GamesView";
import { brl, formatDate, splitGames, todayISO } from "@/lib/format";
import { getCollection } from "@/lib/store";

export const revalidate = 300;

const TILES = [
  { href: "/jogos", title: "Jogos", text: "Calendário, locais e placares" },
  { href: "/escala", title: "Escala", text: "Horários de treino da semana" },
  { href: "/vendas", title: "Vendas", text: "Loja oficial e Sócio-Lobo" },
  { href: "/titulos", title: "Títulos", text: "Nossa sala de troféus" },
];

export default async function Home() {
  const [games, plans, titles, settings] = await Promise.all([
    getCollection("games"),
    getCollection("plans"),
    getCollection("titles"),
    getCollection("settings"),
  ]);
  const today = todayISO();
  const { upcoming, results } = splitGames(games, today);
  const cheapest = plans.filter((p) => p.active).sort((a, b) => a.price - b.price)[0];
  const championships = titles.filter((t) => t.placement === "campeao").length;

  return (
    <>
      <section className="relative overflow-hidden bg-lobo-navy text-white">
        <div className="pointer-events-none absolute -right-40 top-0 h-[520px] w-[520px] rounded-full border-[60px] border-lobo-gold/10" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-[1.3fr_1fr] md:py-24">
          <div className="animate-rise">
            <p className="font-display text-sm uppercase tracking-[0.35em] text-lobo-gold">Atlética Lobo</p>
            <h1 className="mt-3 text-5xl leading-[0.95] sm:text-7xl">
              {settings.siteName.split(" ").slice(0, -1).join(" ")} <span className="text-lobo-gold">{settings.siteName.split(" ").slice(-1)}</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/75">{settings.tagline}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/jogos" className="btn-gold px-6 py-3 text-base">Ver próximos jogos</Link>
              <Link href="/vendas#socio" className="btn border border-white/30 px-6 py-3 text-base text-white hover:bg-white/10">
                Seja Sócio-Lobo{cheapest ? ` · a partir de ${brl(cheapest.price)}` : ""}
              </Link>
            </div>
            <dl className="mt-10 flex gap-8">
              {[
                [championships, "títulos"],
                [settings.modalities.length, "modalidades"],
                [upcoming.length, "jogos agendados"],
              ].map(([n, l]) => (
                <div key={l}>
                  <dt className="sr-only">{l}</dt>
                  <dd className="font-display text-4xl text-lobo-gold">{n}</dd>
                  <dd className="text-xs uppercase tracking-wider text-white/60">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/lobo.svg" alt="Escudo da Atlética Lobo" className="mx-auto hidden w-72 drop-shadow-2xl md:block lg:w-96" />
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4">
        <nav className="relative -mt-8 grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Seções">
          {TILES.map((t) => (
            <Link key={t.href} href={t.href} className="card group p-5 transition hover:-translate-y-0.5 hover:border-lobo-gold hover:shadow-lg">
              <p className="font-display text-2xl uppercase text-lobo-navy group-hover:text-lobo-goldDark">{t.title} →</p>
              <p className="mt-1 text-sm text-slate-500">{t.text}</p>
            </Link>
          ))}
        </nav>

        <section className="mt-14">
          <div className="flex items-end justify-between">
            <h2 className="section-title">Próximos jogos</h2>
            <Link href="/jogos" className="text-sm font-semibold text-lobo-navy hover:underline">Ver todos</Link>
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {upcoming.slice(0, 3).map((g, i) => <GameCard key={g.id} game={g} today={today} index={i} />)}
          </div>
          {upcoming.length === 0 && <p className="mt-4 text-slate-500">Nenhum jogo agendado no momento.</p>}
        </section>

        {results.length > 0 && (
          <section className="mt-14">
            <h2 className="section-title">Últimos resultados</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {results.slice(0, 4).map((g) => (
                <li key={g.id} className="card p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">{g.modality} {g.category} · {formatDate(g.date)}</p>
                  <p className="mt-1 font-display text-2xl text-lobo-navy">Lobo {g.scoreLobo} × {g.scoreOpponent} <span className="text-base text-slate-500">{g.opponent.replace("Atlética ", "")}</span></p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
