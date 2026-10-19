import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { DATA_OWNER, currentAdmin } from "@/lib/admin-users";
import { paymentsDemoMode } from "@/lib/payments";
import { usingSupabase } from "@/lib/store";

export const metadata = { title: "Painel", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  // o middleware confere a assinatura; aqui conferimos se a senha do perfil não mudou desde o login
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");
  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="bg-lobo-navy text-white md:sticky md:top-0 md:h-screen">
        <div className="flex items-center gap-2 px-5 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/logo.png" alt="" className="h-9 w-9" />
          <div>
            <p className="font-display uppercase leading-none tracking-wider">Painel Lobo</p>
            <Link href="/" target="_blank" className="text-xs text-white/60 hover:text-lobo-red">Ver site ↗</Link>
          </div>
        </div>
        <div className="mx-3 mb-3 rounded-lg bg-white/10 px-3 py-2 text-xs">
          <span className="block text-white/60">Conectado como</span>
          <strong className="text-sm">{admin.name}</strong>
        </div>
        <AdminNav isDataOwner={admin.id === DATA_OWNER} />
        <div className="hidden space-y-1 px-5 py-4 text-[11px] text-white/50 md:block">
          <p>Conteúdo: {usingSupabase() ? "Supabase" : "arquivos JSON"}</p>
          <p>Pagamentos: {paymentsDemoMode() ? "Pix + link InfinitePay" : "Mercado Pago ativo"}</p>
        </div>
      </aside>
      <div className="min-w-0 bg-lobo-paper">{children}</div>
    </div>
  );
}
