import { ScheduleView } from "@/components/schedule/ScheduleView";
import { PageHero } from "@/components/ui";
import { TZ, modalitiesInUse } from "@/lib/format";
import { getCollection } from "@/lib/store";
import type { WeekDay } from "@/lib/types";

export const metadata = { title: "Escala de Treinos" };
export const revalidate = 300;

const DAY_INDEX: (WeekDay | null)[] = [null, "seg", "ter", "qua", "qui", "sex", "sab"];

function currentWeekDay(): WeekDay | null {
  const name = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" }).format(new Date());
  return DAY_INDEX[["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(name)];
}

export default async function EscalaPage() {
  const [trainings, settings] = await Promise.all([getCollection("trainings"), getCollection("settings")]);
  return (
    <>
      <PageHero kicker="Grade semanal" title="Escala do Lobo">
        Treinos de segunda a sábado nas quadras do CEFET. Toque no local para abrir no mapa.
      </PageHero>
      <ScheduleView
        trainings={trainings}
        modalities={modalitiesInUse(settings.modalities, trainings.map((t) => t.modality))}
        todayDay={currentWeekDay()}
        period={settings.schedulePeriod ?? ""}
        notice={settings.scheduleNotice || "Os treinos podem sofrer alteração de data, horário e local."}
      />
    </>
  );
}
