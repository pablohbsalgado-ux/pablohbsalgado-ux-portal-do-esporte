"use client";

import { useState } from "react";
import type { FieldSpec } from "@/lib/schema";

type Values = Record<string, unknown>;

export function emptyRecord(fields: FieldSpec[]): Values {
  return Object.fromEntries(
    fields.map((f) => [f.key, f.default ?? (f.type === "list" || f.type === "images" ? [] : f.type === "boolean" ? false : f.nullable ? null : "")]),
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
