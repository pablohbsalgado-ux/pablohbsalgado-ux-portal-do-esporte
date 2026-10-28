import { notFound } from "next/navigation";
import { ManualPaymentPanel } from "@/components/cart/ManualPaymentPanel";
import { OrderStatusPanel } from "@/components/cart/OrderStatusPanel";
import { buildInstructions } from "@/lib/manual-payment";
import { getCollection } from "@/lib/store";
import { brl } from "@/lib/format";
import { getOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seu pedido", robots: { index: false } };

export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();
  const manual = order.provider === "manual" ? await buildInstructions(order, await getCollection("settings")) : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="font-display text-sm uppercase tracking-[0.3em] text-lobo-redDark">Pedido {order.id}</p>
      <h1 className="mt-1 text-4xl text-lobo-navy">Obrigado, {order.customer.name.split(" ")[0]}!</h1>

      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_280px]">
        {manual ? (
          <ManualPaymentPanel
            orderId={order.id}
            initialStatus={order.status}
            initialProofAt={order.proofSubmittedAt ?? ""}
            instructions={manual}
            total={order.total}
            isMembership={!!order.memberId}
          />
        ) : (
          <OrderStatusPanel orderId={order.id} initialStatus={order.status} method={order.method} pix={order.pix} demo={order.demo} />
        )}

        <aside className="card h-fit p-5">
          <h2 className="text-xl text-lobo-navy">Resumo</h2>
          <ul className="mt-3 divide-y text-sm">
            {order.items.map((i, idx) => (
              <li key={idx} className="py-2">
                <div className="flex justify-between gap-2">
                  <span>{i.quantity}× {i.name}</span>
                  <span className="flex-none font-semibold">{brl(i.unitPrice * i.quantity)}</span>
                </div>
                {(i.size || i.customization || i.lot) && (
                  <p className="text-xs text-slate-500">
                    {[i.lot, i.size && `Tam. ${i.size}`, i.customization && `${i.customization.name} #${i.customization.number}`].filter(Boolean).join(" · ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-2 flex justify-between border-t pt-3 text-lg">
            <span>Total</span>
            <strong>{brl(order.total)}</strong>
          </div>
        </aside>
      </div>
    </div>
  );
}
