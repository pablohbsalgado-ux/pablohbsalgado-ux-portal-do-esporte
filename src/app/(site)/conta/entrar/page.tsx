import { redirect } from "next/navigation";
import { EntrarClient } from "@/components/account/EntrarClient";
import { PageHero } from "@/components/ui";
import { currentAccount } from "@/lib/accounts";

export const metadata = { title: "Entrar", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function EntrarPage({ searchParams }: { searchParams: Promise<{ next?: string; aba?: string }> }) {
  const { next, aba } = await searchParams;
  const target = next?.startsWith("/") && !next.startsWith("//") ? next : "/conta";
  if (await currentAccount()) redirect(target);
  return (
    <>
      <PageHero kicker="Sua conta" title="Entrar na alcateia">
        Acesse para comprar na loja e acompanhar seus pedidos.
      </PageHero>
      <div className="mx-auto max-w-lg px-4">
        <div className="card relative -mt-8 p-6">
          <EntrarClient next={target} initialTab={aba === "cadastro" ? "register" : "login"} />
        </div>
      </div>
    </>
  );
}
