import type { DisplayStatus } from "@/lib/format";

/** Estrela "explosão" de 8 pontas dos posts da Atlética. */
export function Star({ className = "", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path
        fill={color}
        d="M50 0l7 36 28-24-17 33 32 5-32 6 17 32-28-23-7 35-7-35-28 23 17-32-32-6 32-5L15 12l28 24z"
      />
    </svg>
  );
}

/** Rabiscos de giz vermelhos (detalhe dos posts). */
export function Scribble({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 60" className={className} aria-hidden="true" fill="none" stroke="#D20C07" strokeWidth="5" strokeLinecap="round">
      <path d="M8 50L40 8M30 54L62 12M52 56L84 14M74 56l30-38" />
    </svg>
  );
}

export function PageHero({ kicker, title, children }: { kicker: string; title: string; children?: React.ReactNode }) {
  const [first, ...rest] = title.split(" ");
  return (
    <section className="bg-grain-navy relative overflow-hidden text-white">
      <Star className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 animate-spinslow text-lobo-blue" />
      <Star className="pointer-events-none absolute bottom-6 right-32 hidden h-14 w-14 text-lobo-red sm:block" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/img/logo.png" alt="" className="pointer-events-none absolute right-6 top-1/2 hidden h-40 w-40 -translate-y-1/2 opacity-90 md:block lg:right-24 lg:h-48 lg:w-48" />
      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-10 sm:pb-20 sm:pt-14">
        <p className="inline-block -rotate-1 bg-lobo-red px-3 py-1 font-display text-sm uppercase tracking-[0.2em]">{kicker}</p>
        <h1 className="mt-4 text-5xl leading-[0.9] sm:text-7xl">
          <span className="text-outline-white">{first}</span> {rest.join(" ")}
        </h1>
        {children && <div className="mt-4 max-w-xl text-white/80">{children}</div>}
      </div>
      <div className="tricolor absolute inset-x-0 bottom-0 h-2" />
    </section>
  );
}

const STATUS_STYLE: Record<DisplayStatus, string> = {
  Agendado: "bg-white text-lobo-navy",
  "Em Breve": "bg-lobo-blue text-white",
  Hoje: "bg-lobo-red text-white ring-2 ring-white",
  "Em Andamento": "bg-lobo-red text-white",
  Finalizado: "bg-lobo-ink text-white",
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
