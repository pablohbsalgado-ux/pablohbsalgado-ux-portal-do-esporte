import { notFound } from "next/navigation";
import { MembershipForm } from "@/components/account/MembershipForm";
import { PageHero } from "@/components/ui";
import { currentAccount, toPublic } from "@/lib/accounts";
import { brl } from "@/lib/format";
import { isAthletePlan } from "@/lib/members";
import { getCollection } from "@/lib/store";
import { ATHLETE_TERMS, ATHLETE_TERMS_TITLE, GENERAL_TERMS, GENERAL_TERMS_TITLE } from "@/lib/terms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ficha de associação" };

const PERIOD = { mensal: "por mês", semestral: "por semestre", anual: "por ano" } as const;

export default async function SocioPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params;
  const [plans, settings, account] = await Promise.all([getCollection("plans"), getCollection("settings"), currentAccount()]);
  const plan = plans.find((p) => p.id === planId && p.active);
  if (!plan) notFound();
  const athlete = isAthletePlan(plan);

  return (
    <>
      <PageHero kicker="Ficha de associação" title={plan.name}>
        {brl(plan.price)} {PERIOD[plan.period]}. Preencha a ficha e finalize com Pix ou cartão.
      </PageHero>
      <div className="mx-auto max-w-3xl px-4">
        <MembershipForm
          plan={{ id: plan.id, name: plan.name, price: plan.price }}
          athlete={athlete}
          modalities={settings.modalities}
          account={account ? toPublic(account) : null}
          terms={{ generalTitle: GENERAL_TERMS_TITLE, general: GENERAL_TERMS, athleteTitle: ATHLETE_TERMS_TITLE, athlete: ATHLETE_TERMS }}
        />
      </div>
    </>
  );
}
