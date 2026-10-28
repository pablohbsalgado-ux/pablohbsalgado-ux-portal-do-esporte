"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { lotDeadline } from "@/lib/events";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

/** Contagem regressiva para a virada do lote; ao zerar, recarrega a página com o novo preço. */
export function LotCountdown({ endsAt, compact = false }: { endsAt: string; compact?: boolean }) {
  const router = useRouter();
  const deadline = lotDeadline({ endsAt })!.getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= deadline) {
        clearInterval(t);
        router.refresh();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [deadline, router]);

  if (now === null) return null; // evita diferença entre servidor e navegador
  const { d, h, m, s } = parts(deadline - now);
  if (compact) return <span>{d > 0 ? `${d}d ${h}h` : `${h}h ${String(m).padStart(2, "0")}min`}</span>;
  return (
    <div className="flex gap-2" role="timer" aria-label="Tempo até a virada do lote">
      {[
        [d, "dias"],
        [h, "horas"],
        [m, "min"],
        [s, "seg"],
      ].map(([v, l]) => (
        <span key={l as string} className="stamp min-w-[64px] bg-white text-center text-lobo-navy">
          <span className="block font-display text-3xl leading-none text-lobo-red">{String(v).padStart(2, "0")}</span>
          <span className="text-[10px] font-bold uppercase">{l}</span>
        </span>
      ))}
    </div>
  );
}
