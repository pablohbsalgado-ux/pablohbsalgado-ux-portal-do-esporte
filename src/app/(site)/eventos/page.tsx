import { EventsView } from "@/components/events/EventsView";
import { PageHero } from "@/components/ui";
import { getCollection } from "@/lib/store";

export const metadata = { title: "Eventos" };
export const revalidate = 60; // a virada de lote é por horário: a página se atualiza a cada minuto

export default async function EventosPage() {
  const events = (await getCollection("events")).filter((e) => e.active);
  return (
    <>
      <PageHero kicker="Agenda da alcateia" title="Eventos do Lobo">
        Festas, campeonatos e jogos da Atlética. Garanta seu ingresso antes da virada de lote!
      </PageHero>
      <EventsView events={events} nowIso={new Date().toISOString()} />
    </>
  );
}
