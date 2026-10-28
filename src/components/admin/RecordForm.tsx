"use client";

import { useState } from "react";
import type { FieldSpec } from "@/lib/schema";

type Values = Record<string, unknown>;

export function emptyRecord(fields: FieldSpec[]): Values {
  return Object.fromEntries(
    fields.map((f) => [f.key, f.default ?? (f.type === "list" || f.type === "images" || f.type === "lots" ? [] : f.type === "boolean" ? false : f.nullable ? null : "")]),
  );
}

async function upload(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body });
  const data = await res.json();
  if (!res.ok) throw new Error(data.errors?.join(", ") ?? "Falha no upload");
  return data.url;
}

function ImageInput({ value, onChange, id }: { value: string; onChange: (v: string) => void; id: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <div className="flex items-start gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={value || "/img/logo.png"} alt="" className={`h-16 w-16 flex-none rounded-lg border bg-lobo-paper object-cover ${value ? "" : "opacity-30"}`} />
      <div className="min-w-0 flex-1 space-y-1.5">
        <input id={id} className="input" value={value} onChange={(e) => onChange(e.target.value)} placeholder="URL da imagem ou envie um arquivo" />
        <label className="btn-ghost cursor-pointer px-3 py-1.5 text-xs">
          {busy ? "Enviando…" : "Enviar imagem"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            disabled={busy}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setBusy(true);
              setErr("");
              try {
                onChange(await upload(file));
              } catch (x) {
                setErr(x instanceof Error ? x.message : "Erro");
              } finally {
                setBusy(false);
                e.target.value = "";
              }
            }}
          />
        </label>
        {err && <p className="text-xs text-red-600">{err}</p>}
      </div>
    </div>
  );
}

function ImagesInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {value.map((src, i) => (
          <div key={src + i} className="group relative h-20 w-28 overflow-hidden rounded-lg border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" />
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="absolute right-1 top-1 rounded bg-black/70 px-1.5 text-xs text-white">✕</button>
          </div>
        ))}
        <label className="grid h-20 w-28 cursor-pointer place-items-center rounded-lg border-2 border-dashed text-xs text-slate-500 hover:border-lobo-navy">
          {busy ? "Enviando…" : "+ Fotos"}
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={async (e) => {
              const files = Array.from(e.target.files ?? []);
              setBusy(true);
              try {
                const urls: string[] = [];
                for (const f of files) urls.push(await upload(f));
                onChange([...value, ...urls]);
              } catch (x) {
                alert(x instanceof Error ? x.message : "Erro no upload");
              } finally {
                setBusy(false);
                e.target.value = "";
              }
            }}
          />
        </label>
      </div>
      <button
        type="button"
        className="mt-2 text-xs text-lobo-navy underline"
        onClick={() => {
          const url = prompt("Cole a URL da imagem");
          if (url) onChange([...value, url]);
        }}
      >
        Adicionar por URL
      </button>
    </div>
  );
}

type Lot = { name: string; price: number | string; endsAt: string; soldOut: boolean };

/** Lista de lotes: nome, preço, data/hora da virada e "esgotado". A ordem define a sequência dos lotes. */
function LotsInput({ value, onChange }: { value: Lot[]; onChange: (v: Lot[]) => void }) {
  const update = (i: number, patch: Partial<Lot>) => onChange(value.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const move = (i: number, d: number) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {value.map((l, i) => (
        <div key={i} className={`grid grid-cols-2 gap-2 rounded-lg border-2 p-3 sm:grid-cols-[1.2fr_.8fr_1.4fr_auto] ${l.soldOut ? "border-slate-200 bg-slate-50" : "border-lobo-navy/15"}`}>
          <input className="input" aria-label={`Nome do lote ${i + 1}`} placeholder={`${i + 1}º lote`} value={l.name} onChange={(e) => update(i, { name: e.target.value })} />
          <input className="input" aria-label={`Preço do lote ${i + 1}`} type="number" step="0.01" min={0} placeholder="R$" value={l.price === null || l.price === undefined ? "" : String(l.price)} onChange={(e) => update(i, { price: e.target.value === "" ? "" : Number(e.target.value) })} />
          <label className="col-span-2 text-xs text-slate-500 sm:col-span-1">
            Vira em (Brasília)
            <input className="input mt-0.5" type="datetime-local" value={l.endsAt} onChange={(e) => update(i, { endsAt: e.target.value })} />
          </label>
          <div className="col-span-2 flex items-center justify-between gap-2 sm:col-span-1 sm:flex-col sm:items-end">
            <label className="flex items-center gap-1 text-xs font-semibold">
              <input type="checkbox" className="h-4 w-4 accent-lobo-navy" checked={l.soldOut} onChange={(e) => update(i, { soldOut: e.target.checked })} /> Esgotado
            </label>
            <span className="flex gap-1 text-xs">
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Subir lote" className="rounded border px-1.5 disabled:opacity-30">↑</button>
              <button type="button" disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label="Descer lote" className="rounded border px-1.5 disabled:opacity-30">↓</button>
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remover lote" className="rounded border border-red-200 px-1.5 text-red-600">✕</button>
            </span>
          </div>
        </div>
      ))}
      <button type="button" className="btn-ghost w-full py-2 text-xs" onClick={() => onChange([...value, { name: `${value.length + 1}º lote`, price: "", endsAt: "", soldOut: false }])}>
        + Adicionar lote
      </button>
    </div>
  );
}

export function RecordForm({
  fields,
  values,
  onChange,
  modalities,
}: {
  fields: FieldSpec[];
  values: Values;
  onChange: (v: Values) => void;
  modalities: string[];
}) {
  const set = (key: string, v: unknown) => onChange({ ...values, [key]: v });

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-4">
      {fields.map((f) => {
        const id = `f-${f.key}`;
        const v = values[f.key];
        const options = f.optionsFrom === "modalities" ? modalities.map((m) => ({ value: m, label: m })) : f.options ?? [];
        let control: React.ReactNode;

        switch (f.type) {
          case "textarea":
            control = <textarea id={id} rows={3} className="input" value={String(v ?? "")} onChange={(e) => set(f.key, e.target.value)} />;
            break;
          case "number":
          case "money":
            control = (
              <input
                id={id}
                type="number"
                inputMode="decimal"
                step={f.type === "money" ? "0.01" : "1"}
                min={f.min}
                className="input"
                value={v === null || v === undefined ? "" : String(v)}
                onChange={(e) => set(f.key, e.target.value === "" ? (f.nullable ? null : "") : Number(e.target.value))}
              />
            );
            break;
          case "url":
            control = <input id={id} type="url" inputMode="url" className="input" placeholder="https://" value={String(v ?? "")} onChange={(e) => set(f.key, e.target.value)} />;
            break;
          case "date":
          case "time":
            control = <input id={id} type={f.type} className="input" value={String(v ?? "")} onChange={(e) => set(f.key, e.target.value)} />;
            break;
          case "select":
            control = (
              <select id={id} className="input" value={String(v ?? "")} onChange={(e) => set(f.key, e.target.value)}>
                <option value="">Selecione…</option>
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            );
            break;
          case "boolean":
            control = (
              <label className="flex h-[38px] cursor-pointer items-center gap-2 text-sm">
                <input id={id} type="checkbox" className="h-5 w-5 accent-lobo-navy" checked={Boolean(v)} onChange={(e) => set(f.key, e.target.checked)} />
                {v ? "Sim" : "Não"}
              </label>
            );
            break;
          case "list":
            control = (
              <textarea
                id={id}
                rows={4}
                className="input"
                value={Array.isArray(v) ? v.join("\n") : ""}
                onChange={(e) => set(f.key, e.target.value.split("\n"))}
              />
            );
            break;
          case "image":
            control = <ImageInput id={id} value={String(v ?? "")} onChange={(x) => set(f.key, x)} />;
            break;
          case "images":
            control = <ImagesInput value={Array.isArray(v) ? (v as string[]) : []} onChange={(x) => set(f.key, x)} />;
            break;
          case "lots":
            control = <LotsInput value={Array.isArray(v) ? (v as Lot[]) : []} onChange={(x) => set(f.key, x)} />;
            break;
          default:
            control = <input id={id} className="input" value={String(v ?? "")} onChange={(e) => set(f.key, e.target.value)} />;
        }

        return (
          <div key={f.key} className={f.half ? "col-span-2 sm:col-span-1" : "col-span-2"}>
            <label className="label" htmlFor={id}>
              {f.label} {f.required && <span className="text-red-500">*</span>}
            </label>
            {control}
            {f.help && <p className="mt-1 text-xs text-slate-500">{f.help}</p>}
          </div>
        );
      })}
    </div>
  );
}
