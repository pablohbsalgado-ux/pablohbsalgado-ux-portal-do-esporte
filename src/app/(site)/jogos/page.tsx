import { GamesView } from "@/components/games/GamesView";
import { PageHero } from "@/components/ui";
import { modalitiesInUse, todayISO } from "@/lib/format";
import { getCollection } from "@/lib/store";

export const metadata = { title: "Jogos do Lobo" };
export const revalidate = 300; // "Hoje / Em breve" se atualizam sozinhos; o painel também revalida ao salvar

export default async function JogosPage() {
  const [games, settings] = await Promise.all([getCollection("games"), getCollection("settings")]);
  return (
    <>
      <PageHero kicker="Calendário" title="Jogos do Lobo">
        Agenda completa das partidas e resultados de todas as modalidades.
      </PageHero>
      <GamesView games={games} modalities={modalitiesInUse(settings.modalities, games.map((g) => g.modality))} today={todayISO()} />
    </>
  );
}
