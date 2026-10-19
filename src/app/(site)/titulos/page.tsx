import { TitlesGallery } from "@/components/titles/TitlesGallery";
import { PageHero } from "@/components/ui";
import { getCollection } from "@/lib/store";

export const metadata = { title: "Títulos do Lobo" };
export const revalidate = 300;

export default async function TitulosPage() {
  const [titles, settings] = await Promise.all([getCollection("titles"), getCollection("settings")]);
  return (
    <>
      <PageHero kicker="Sala de troféus" title="Títulos do Lobo">
        A história da alcateia contada pelas conquistas. Clique em um título para ver as fotos.
      </PageHero>
      <TitlesGallery titles={titles} modalities={settings.modalities} />
    </>
  );
}
