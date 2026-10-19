"use client";

import { useEffect, useMemo, useState } from "react";
import { PLACEMENT_LABEL } from "@/lib/format";
import type { Placement, Title } from "@/lib/types";
import { EmptyState, FilterChips } from "../ui";
import { IconClose, IconTrophy } from "../icons";

const MEDAL: Record<Placement, string> = {
  campeao: "bg-lobo-red text-white",
  vice: "bg-slate-300 text-slate-800",
  terceiro: "bg-amber-700 text-white",
  destaque: "bg-sky-600 text-white",
};

export function TitlesGallery({ titles, modalities }: { titles: Title[]; modalities: string[] }) {
  const [modality, setModality] = useState("all");
  const [open, setOpen] = useState<Title | null>(null);

  const byYear = useMemo(() => {
    const list = titles.filter((t) => modality === "all" || t.modality === modality).sort((a, b) => b.year - a.year);
    const groups = new Map<number, Title[]>();
    for (const t of list) groups.set(t.year, [...(groups.get(t.year) ?? []), t]);
    return [...groups.entries()];
  }, [titles, modality]);

  const champions = titles.filter((t) => t.placement === "campeao").length;

  return (
    <div className="mx-auto max-w-7xl px-4">
      <div className="card relative -mt-8 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <FilterChips label="Modalidade" value={modality} onChange={setModality} options={[{ value: "all", label: "Todas" }, ...modalities.map((m) => ({ value: m, label: m }))]} />
        <p className="flex-none text-sm text-slate-600">
          <strong className="font-display text-2xl text-lobo-navy">{champions}</strong> títulos de campeão · <strong className="font-display text-2xl text-lobo-navy">{titles.length}</strong> pódios
        </p>
      </div>

      {byYear.length === 0 && <div className="mt-8"><EmptyState>Nenhum título nesta modalidade… ainda!</EmptyState></div>}

      <ol className="relative mt-10 space-y-12 border-l-2 border-lobo-red/50 pl-6 sm:pl-10">
        {byYear.map(([year, list]) => (
          <li key={year}>
            <span className="absolute -left-[13px] mt-1.5 grid h-6 w-6 place-items-center rounded-full bg-lobo-red text-white">
              <IconTrophy className="h-3.5 w-3.5" />
            </span>
            <h2 className="font-display text-4xl text-lobo-navy">{year}</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => setOpen(t)}
                  className="card group animate-rise overflow-hidden text-left transition hover:-translate-y-1 hover:shadow-xl"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-lobo-navy">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.cover || t.photos[0] || "/img/titulo-1.svg"} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    <span className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold uppercase ${MEDAL[t.placement]}`}>
                      <IconTrophy className="h-3.5 w-3.5" /> {PLACEMENT_LABEL[t.placement]}
                    </span>
                    {t.photos.length > 0 && <span className="absolute bottom-3 right-3 rounded bg-black/60 px-2 py-0.5 text-xs text-white">{t.photos.length} fotos</span>}
                  </div>
                  <div className="p-4">
                    <h3 className="text-xl leading-tight text-lobo-navy">{t.championship}</h3>
                    <p className="mt-1 text-sm text-slate-500">{t.modality} · {t.category} · {t.year}</p>
                  </div>
                </button>
              ))}
            </div>
          </li>
        ))}
      </ol>

      {open && <TitleModal title={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function TitleModal({ title, onClose }: { title: Title; onClose: () => void }) {
  const photos = title.photos.length ? title.photos : [title.cover].filter(Boolean);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % photos.length);
      if (e.key === "ArrowLeft") setIdx((i) => (i - 1 + photos.length) % photos.length);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, photos.length]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3" role="dialog" aria-modal="true" aria-label={title.championship}>
      <button className="absolute inset-0 bg-black/80" aria-label="Fechar" onClick={onClose} />
      <div className="relative max-h-[94vh] w-full max-w-3xl animate-rise overflow-y-auto rounded-2xl bg-white">
        <button onClick={onClose} className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-1.5 text-white" aria-label="Fechar">
          <IconClose />
        </button>
        {photos.length > 0 && (
          <div className="bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[idx]} alt={`Foto ${idx + 1} de ${photos.length}`} className="mx-auto max-h-[55vh] w-full object-contain" />
            {photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-2">
                {photos.map((src, i) => (
                  <button key={src + i} onClick={() => setIdx(i)} className={`h-14 w-20 flex-none overflow-hidden rounded ${i === idx ? "ring-2 ring-lobo-red" : "opacity-60"}`} aria-label={`Ver foto ${i + 1}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="p-6">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold uppercase ${MEDAL[title.placement]}`}>
            <IconTrophy className="h-3.5 w-3.5" /> {PLACEMENT_LABEL[title.placement]}
          </span>
          <h2 className="mt-2 text-3xl text-lobo-navy">{title.championship} {title.year}</h2>
          <p className="text-sm text-slate-500">{title.modality} · {title.category}</p>
          {title.description && <p className="mt-4 whitespace-pre-line text-slate-700">{title.description}</p>}
        </div>
      </div>
    </div>
  );
}
