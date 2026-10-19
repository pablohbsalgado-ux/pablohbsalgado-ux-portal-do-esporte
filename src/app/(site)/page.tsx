import Link from "next/link";
import { GameCard } from "@/components/games/GamesView";
import { Scribble, Star } from "@/components/ui";
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
  const words = settings.siteName.split(" ");
  const titleEnd = words.length > 1 ? words.pop() : "";
  const titleStart = words.join(" ");

  return (
    <>
      <section className="bg-grain-navy relative overflow-hidden text-white">
        <Star className="pointer-events-none absolute -left-16 top-10 h-48 w-48 animate-spinslow text-lobo-blue" />
        <Scribble className="pointer-events-none absolute bottom-16 left-1/2 hidden h-12 w-24 md:block" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pb-24 pt-12 md:grid-cols-[1.25fr_1fr] md:pb-28 md:pt-16">
          <div className="animate-rise">
            <p className="inline-block -rotate-2 bg-lobo-red px-3 py-1 font-display text-sm uppercase tracking-[0.25em]">A.A.A. CEFET/RJ</p>
            <h1 className="mt-5 text-6xl leading-[0.88] sm:text-8xl">
              <span className="text-outline-white block">{titleStart}</span>
              <span className="block">{titleEnd}</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-white/80">{settings.tagline}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/jogos" className="btn-red px-6 py-3 text-base">Próximos jogos</Link>
              <Link href="/vendas#socio" className="btn border-2 border-white px-6 py-3 text-base text-white hover:bg-white hover:text-lobo-navy">
                Seja Sócio-Lobo{cheapest ? ` · ${brl(cheapest.price)}` : ""}
              </Link>
            </div>
            <dl className="mt-10 flex flex-wrap gap-3">
              {[
                [championships, "títulos"],
                [settings.modalities.length, "modalidades"],
                [upcoming.length, "jogos agendados"],
              ].map(([n, l], i) => (
                <div key={l} className={`stamp bg-lobo-paper text-lobo-navy ${i % 2 ? "rotate-2" : "-rotate-2"}`}>
                  <dt className="sr-only">{l}</dt>
                  <dd className="font-display text-4xl leading-none text-lobo-red">{n}</dd>
                  <dd className="text-[11px] font-bold uppercase tracking-wider">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative mx-auto hidden w-full max-w-sm md:block">
            <Star className="absolute -right-6 -top-8 h-24 w-24 text-lobo-red" />
            <div className="stamp rotate-3 bg-lobo-paper shadow-2xl">
              <div className="bg-grain-red grid aspect-square place-items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img/logo.png" alt="Escudo da Atlética CEFET-RJ" className="w-4/5 drop-shadow-[0_10px_20px_rgba(0,0,0,.35)]" />
              </div>
              <p className="mt-2 text-center font-display text-2xl uppercase text-lobo-navy">Vamos, Lobo!</p>
            </div>
          </div>
        </div>
        <div className="tricolor absolute inset-x-0 bottom-0 h-2" />
      </section>

      <div className="mx-auto max-w-7xl px-4">
        <nav className="relative -mt-10 grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Seções">
          {TILES.map((t, i) => (
            <Link
              key={t.href}
              href={t.href}
              className={`group relative overflow-hidden rounded-xl p-5 text-white shadow-lg transition hover:-translate-y-1 ${i % 2 ? "bg-grain-red" : "bg-grain-navy"}`}
            >
              <span className="absolute right-3 top-2 font-display text-5xl leading-none text-white/15">0{i + 1}</span>
              <p className="relative font-display text-3xl uppercase">{t.title} <span className="inline-block transition group-hover:translate-x-1">→</span></p>
              <p className="relative mt-1 text-sm text-white/75">{t.text}</p>
            </Link>
          ))}
        </nav>

        <section className="mt-14">
          <div className="flex items-end justify-between">
            <h2 className="section-title"><span className="text-outline-red">Próximos</span> jogos</h2>
            <Link href="/jogos" className="text-sm font-bold uppercase text-lobo-red hover:underline">Ver todos →</Link>
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {upcoming.slice(0, 3).map((g, i) => <GameCard key={g.id} game={g} today={today} index={i} />)}
          </div>
          {upcoming.length === 0 && <p className="mt-4 text-slate-500">Nenhum jogo agendado no momento.</p>}
        </section>

        {results.length > 0 && (
          <section className="mt-14">
            <h2 className="section-title"><span className="text-outline-red">Últimos</span> resultados</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {results.slice(0, 4).map((g) => (
                <li key={g.id} className="card border-l-4 border-l-lobo-red p-4">
                  <p className="text-xs font-bold uppercase text-lobo-navy/60">{g.modality} {g.category} · {formatDate(g.date)}</p>
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
