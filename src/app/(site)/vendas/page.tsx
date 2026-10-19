import { CustomizationForm, PlansSection, ProductGrid } from "@/components/shop/Shop";
import { PageHero } from "@/components/ui";
import { getCollection } from "@/lib/store";

export const metadata = { title: "Loja & Sócio-Lobo" };
export const revalidate = 300;

export default async function VendasPage() {
  const [products, plans, settings] = await Promise.all([getCollection("products"), getCollection("plans"), getCollection("settings")]);
  const visible = products.filter((p) => p.active);

  return (
    <>
      <PageHero kicker="Loja oficial" title="Vendas">
        Seja Sócio-Lobo, vista a alcateia e personalize seu uniforme. Pagamento via Pix ou cartão.
      </PageHero>
      <div className="mx-auto max-w-7xl space-y-20 px-4 pt-12">
        <section id="socio" aria-labelledby="socio-t">
          <h2 id="socio-t" className="section-title">Sócio-Lobo</h2>
          <p className="mb-6 mt-1 text-slate-600">Faça parte da alcateia e ganhe {settings.memberDiscountPercent}% de desconto na loja.</p>
          <PlansSection plans={plans.filter((p) => p.active)} />
        </section>

        <section id="produtos" aria-labelledby="produtos-t">
          <h2 id="produtos-t" className="section-title mb-5">Vitrine</h2>
          <ProductGrid products={visible} />
        </section>

        <section id="personalizar" aria-labelledby="personalizar-t">
          <h2 id="personalizar-t" className="section-title">Personalize seu uniforme</h2>
          <p className="mb-6 mt-1 text-slate-600">Escolha o modelo, coloque seu nome e número nas costas.</p>
          <CustomizationForm models={visible.filter((p) => p.customizable)} extraPrice={settings.customizationPrice} />
        </section>
      </div>
    </>
  );
}
