import type { DisplayStatus } from "@/lib/format";

export function PageHero({ kicker, title, children }: { kicker: string; title: string; children?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-lobo-navy text-white">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-lobo-gold/10" />
      <div className="pointer-events-none absolute -bottom-32 right-40 h-64 w-64 rounded-full bg-lobo-blue/60" />
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:py-16">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-lobo-gold">{kicker}</p>
        <h1 className="mt-2 text-4xl sm:text-6xl">{title}</h1>
        {children && <div className="mt-3 max-w-2xl text-white/75">{children}</div>}
      </div>
    </section>
  );
}

const STATUS_STYLE: Record<DisplayStatus, string> = {
  Agendado: "bg-slate-100 text-slate-700",
  "Em Breve": "bg-amber-100 text-amber-800",
  Hoje: "bg-lobo-gold text-lobo-navy animate-pulse",
  "Em Andamento": "bg-red-600 text-white",
  Finalizado: "bg-lobo-navy text-white",
  Adiado: "bg-orange-100 text-orange-800 line-through",
};

export function StatusBadge({ status }: { status: DisplayStatus }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${STATUS_STYLE[status]}`}>
      {status === "Em Andamento" && <span className="h-1.5 w-1.5 animate-ping rounded-full bg-white" />}
      {status}
    </span>
  );
}

export function FilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)} className={value === o.value ? "chip-on" : "chip-off"}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center text-slate-500">{children}</div>;
}
