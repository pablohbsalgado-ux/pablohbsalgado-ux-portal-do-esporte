import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { paymentsDemoMode } from "@/lib/payments";
import { usingSupabase } from "@/lib/store";

export const metadata = { title: "Painel", robots: { index: false } };
export const dynamic = "force-dynamic";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="bg-lobo-navy text-white md:sticky md:top-0 md:h-screen">
        <div className="flex items-center gap-2 px-5 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/lobo.svg" alt="" className="h-9 w-9" />
          <div>
            <p className="font-display uppercase leading-none tracking-wider">Painel Lobo</p>
            <Link href="/" target="_blank" className="text-xs text-white/60 hover:text-lobo-gold">Ver site ↗</Link>
          </div>
        </div>
        <AdminNav />
        <div className="hidden space-y-1 px-5 py-4 text-[11px] text-white/50 md:block">
          <p>Conteúdo: {usingSupabase() ? "Supabase" : "arquivos JSON"}</p>
          <p>Pagamentos: {paymentsDemoMode() ? "modo demonstração" : "Mercado Pago ativo"}</p>
        </div>
      </aside>
      <div className="min-w-0 bg-lobo-ice">{children}</div>
    </div>
  );
}
