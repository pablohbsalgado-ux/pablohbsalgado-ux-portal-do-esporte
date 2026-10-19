import Link from "next/link";
import { brl, formatDate, gameStatus, splitGames, todayISO } from "@/lib/format";
import { getCollection } from "@/lib/store";

export default async function AdminHome() {
  const [games, trainings, products, plans, titles, orders] = await Promise.all([
    getCollection("games"),
    getCollection("trainings"),
    getCollection("products"),
    getCollection("plans"),
    getCollection("titles"),
    getCollection("orders"),
  ]);
  const today = todayISO();
  const { upcoming } = splitGames(games, today);
  const pendingScore = games.filter((g) => g.status !== "finalizado" && g.date < today);
  const lowStock = products.filter((p) => p.active && p.stock <= 5).sort((a, b) => a.stock - b.stock);
  const paid = orders.filter((o) => o.status === "pago" || o.status === "entregue");

  const stats = [
    { href: "/admin/games", n: upcoming.length, l: "jogos agendados" },
    { href: "/admin/trainings", n: trainings.length, l: "treinos na escala" },
    { href: "/admin/products", n: products.filter((p) => p.active).length, l: "produtos ativos" },
    { href: "/admin/plans", n: plans.filter((p) => p.active).length, l: "planos de sócio" },
    { href: "/admin/titles", n: titles.length, l: "títulos" },
    { href: "/admin/orders", n: brl(paid.reduce((s, o) => s + o.total, 0)), l: `vendido (${paid.length} pedidos)` },
  ];

  return (
    <div className="p-5 md:p-8">
      <h1 className="text-3xl text-lobo-navy">Visão geral</h1>
      <p className="text-sm text-slate-500">Tudo que você altera aqui aparece no site na hora.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <Link key={s.l} href={s.href} className="card p-4 hover:border-lobo-gold">
            <p className="font-display text-3xl text-lobo-navy">{s.n}</p>
            <p className="text-xs text-slate-500">{s.l}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="text-xl text-lobo-navy">⚠️ Placares pendentes</h2>
          <p className="text-xs text-slate-500">Jogos com data passada que ainda não foram marcados como finalizados.</p>
          <ul className="mt-3 divide-y text-sm">
            {pendingScore.length === 0 && <li className="py-2 text-slate-500">Tudo em dia!</li>}
            {pendingScore.map((g) => (
              <li key={g.id} className="flex justify-between py-2">
                <span>{formatDate(g.date)} · {g.modality} {g.category} vs {g.opponent}</span>
                <Link href={`/admin/games?edit=${g.id}`} className="font-semibold text-lobo-navy hover:underline">Lançar placar</Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5">
          <h2 className="text-xl text-lobo-navy">📦 Estoque baixo</h2>
          <ul className="mt-3 divide-y text-sm">
            {lowStock.length === 0 && <li className="py-2 text-slate-500">Nenhum produto com estoque baixo.</li>}
            {lowStock.map((p) => (
              <li key={p.id} className="flex justify-between py-2">
                <span>{p.name}</span>
                <Link href={`/admin/products?edit=${p.id}`} className={`font-semibold ${p.stock === 0 ? "text-red-600" : "text-amber-700"}`}>
                  {p.stock === 0 ? "Esgotado" : `${p.stock} un.`}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5 lg:col-span-2">
          <h2 className="text-xl text-lobo-navy">Próximos jogos</h2>
          <ul className="mt-3 divide-y text-sm">
            {upcoming.slice(0, 6).map((g) => (
              <li key={g.id} className="flex justify-between py-2">
                <span>{formatDate(g.date)} {g.time} · {g.modality} {g.category} vs {g.opponent}</span>
                <span className="text-slate-500">{gameStatus(g, today)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
