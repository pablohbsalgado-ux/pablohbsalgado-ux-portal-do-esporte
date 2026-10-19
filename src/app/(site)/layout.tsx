import { Header } from "@/components/Header";
import { AccountProvider } from "@/components/account/AccountProvider";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CheckoutModal } from "@/components/cart/CheckoutModal";
import { getCollection } from "@/lib/store";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getCollection("settings");
  const year = new Date().getFullYear();

  return (
    <AccountProvider>
    <CartProvider>
      <Header announcement={settings.announcement} siteName={settings.siteName} />
      <main className="min-h-[70vh]">{children}</main>
      <footer className="bg-grain-navy relative mt-24 text-white/75">
        <div className="tricolor h-2" />
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/logo.png" alt="" className="h-16 w-16" />
            <div>
              <p className="font-display text-2xl uppercase text-white">Atlética CEFET-RJ</p>
              <p className="text-sm">{settings.siteName} · Central de informações e transparência</p>
            </div>
          </div>
          <ul className="space-y-1 text-sm">
            {settings.instagram && (
              <li><a className="hover:text-lobo-redLight" href={`https://instagram.com/${settings.instagram.replace("@", "")}`} target="_blank" rel="noreferrer">Instagram @{settings.instagram.replace("@", "")}</a></li>
            )}
            {settings.whatsapp && (
              <li><a className="hover:text-lobo-redLight" href={`https://wa.me/55${settings.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">WhatsApp da diretoria</a></li>
            )}
            {settings.email && <li><a className="hover:text-lobo-redLight" href={`mailto:${settings.email}`}>{settings.email}</a></li>}
          </ul>
          <p className="text-sm sm:text-right">© {year} A.A.A. CEFET/RJ · Vamos, Lobo! 🐺</p>
        </div>
      </footer>
      <CartDrawer />
      <CheckoutModal />
    </CartProvider>
    </AccountProvider>
  );
}
