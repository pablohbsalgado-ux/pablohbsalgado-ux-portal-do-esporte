import Link from "next/link";
import { redirect } from "next/navigation";
import { ChangePassword } from "@/components/account/ChangePassword";
import { LogoutButton } from "@/components/account/LogoutButton";
import { PageHero } from "@/components/ui";
import { currentAccount, formatCpf, formatPhone } from "@/lib/accounts";
import { brl } from "@/lib/format";
import { getCollection } from "@/lib/store";
import type { MemberStatus, OrderStatus } from "@/lib/types";

export const metadata = { title: "Minha conta", robots: { index: false } };
export const dynamic = "force-dynamic";

const ORDER_STATUS: Record<OrderStatus, { label: string; cls: string }> = {
  pendente: { label: "Aguardando pagamento", cls: "bg-amber-100 text-amber-800" },
  pago: { label: "Pago", cls: "bg-emerald-100 text-emerald-800" },
  entregue: { label: "Entregue", cls: "bg-sky-100 text-sky-800" },
  cancelado: { label: "Cancelado", cls: "bg-slate-200 text-slate-600" },
};

const MEMBER_STATUS: Record<MemberStatus, { label: string; cls: string }> = {
  pendente: { label: "Aguardando pagamento / análise", cls: "bg-amber-100 text-amber-800" },
  ativo: { label: "Sócio ativo", cls: "bg-emerald-100 text-emerald-800" },
  cancelado: { label: "Cancelado", cls: "bg-slate-200 text-slate-600" },
};

export default async function ContaPage() {
  const account = await currentAccount();
  if (!account) redirect("/conta/entrar?next=/conta");

  const [orders, members] = await Promise.all([getCollection("orders"), getCollection("members")]);
  const myOrders = orders.filter((o) => o.accountId === account.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const myMemberships = members
    .filter((m) => m.accountId === account.id || m.cpf === account.cpf)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <PageHero kicker="Minha conta" title={`Olá, ${account.fullName.split(" ")[0]}`}>
        Seus dados, pedidos da loja e associação.
      </PageHero>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 lg:grid-cols-[340px_1fr]">
        <aside className="card relative -mt-8 h-fit p-6">
          <h2 className="text-2xl text-lobo-navy">Meus dados</h2>
          <dl className="mt-4 space-y-3 text-sm">
            {[
              ["Nome completo", account.fullName],
              ["CPF", formatCpf(account.cpf)],
              ["Telefone", formatPhone(account.phone)],
              ["E-mail", account.email],
              ["Cliente desde", new Date(account.createdAt).toLocaleDateString("pt-BR")],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="label !mb-0">{k}</dt>
                <dd className="break-words font-semibold text-lobo-ink">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-slate-500">Para corrigir algum dado, fale com a diretoria.</p>
          <LogoutButton />
          <ChangePassword />
        </aside>

        <div className="space-y-6 lg:-mt-8">
          <section className="card relative p-6">
            <h2 className="text-2xl text-lobo-navy">Associação Sócio-Lobo</h2>
            {myMemberships.length === 0 ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-600">Você ainda não é Sócio-Lobo.</p>
                <Link href="/vendas#socio" className="btn-red">Quero ser sócio</Link>
              </div>
            ) : (
              <ul className="mt-3 divide-y">
                {myMemberships.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                    <span>
                      <strong className="text-lobo-navy">{m.planName}</strong>
                      <span className="block text-xs text-slate-500">Ficha enviada em {new Date(m.createdAt).toLocaleDateString("pt-BR")}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${MEMBER_STATUS[m.status].cls}`}>{MEMBER_STATUS[m.status].label}</span>
                      {m.orderId && m.status === "pendente" && (
                        <Link href={`/pedido/${m.orderId}`} className="text-xs font-bold uppercase text-lobo-red hover:underline">Pagar</Link>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card p-6">
            <h2 className="text-2xl text-lobo-navy">Meus pedidos</h2>
            {myOrders.length === 0 ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-600">Nenhuma compra ainda.</p>
                <Link href="/vendas#produtos" className="btn-navy">Ir para a loja</Link>
              </div>
            ) : (
              <ul className="mt-3 divide-y">
                {myOrders.map((o) => (
                  <li key={o.id} className="py-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link href={`/pedido/${o.id}`} className="font-mono text-xs font-bold text-lobo-navy hover:underline">{o.id}</Link>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${ORDER_STATUS[o.status].cls}`}>{ORDER_STATUS[o.status].label}</span>
                    </div>
                    <p className="mt-1 text-slate-600">
                      {o.items.map((i) => `${i.quantity}× ${i.name}${i.size ? ` (${i.size})` : ""}`).join(" · ")}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(o.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })} · {o.method === "pix" ? "Pix" : "Cartão"} · <strong>{brl(o.total)}</strong>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
