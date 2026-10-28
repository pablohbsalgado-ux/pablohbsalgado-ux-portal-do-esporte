// Definição declarativa dos campos de cada coleção.
// A MESMA definição gera os formulários do painel /admin e valida os dados no servidor:
// para adicionar um campo novo basta incluí-lo aqui (e no tipo em ./types.ts).

import { isPlausiblePixKey, normalizePixKey } from "./pix";
import type { CollectionName } from "./types";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "money"
  | "date"
  | "time"
  | "select"
  | "boolean"
  | "image"
  | "images"
  | "list"
  | "url" // link https (ex.: link de pagamento InfinitePay)
  | "lots" // lotes de ingresso: nome, preço, virada e esgotado
  | "pixkey"; // chave Pix (CPF, CNPJ, e-mail, telefone ou aleatória)

export interface FieldSpec {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  nullable?: boolean; // number/money que podem ficar vazios (ex.: placar de jogo futuro)
  options?: { value: string; label: string }[];
  optionsFrom?: "modalities"; // opções dinâmicas vindas das Configurações
  help?: string;
  min?: number;
  default?: unknown;
  half?: boolean; // ocupa meia largura no formulário
}

export interface CollectionSpec {
  name: CollectionName;
  label: string;
  singular: string;
  singleton?: boolean;
  readOnly?: boolean;
  fields: FieldSpec[];
  // campos exibidos na listagem do painel
  columns: string[];
  sortBy?: { key: string; dir: "asc" | "desc" };
}

const categories = [
  { value: "Masculino", label: "Masculino" },
  { value: "Feminino", label: "Feminino" },
  { value: "Misto", label: "Misto" },
];

export const WEEK_DAYS = [
  { value: "seg", label: "Segunda" },
  { value: "ter", label: "Terça" },
  { value: "qua", label: "Quarta" },
  { value: "qui", label: "Quinta" },
  { value: "sex", label: "Sexta" },
  { value: "sab", label: "Sábado" },
] as const;

export const EVENT_TYPES = [
  { value: "festa", label: "Festa" },
  { value: "campeonato", label: "Campeonato esportivo" },
  { value: "jogo", label: "Jogo" },
  { value: "outro", label: "Outro" },
];

export const PLACEMENTS = [
  { value: "campeao", label: "Campeão" },
  { value: "vice", label: "Vice-campeão" },
  { value: "terceiro", label: "3º lugar" },
  { value: "destaque", label: "Destaque" },
];

export const GAME_STATUSES = [
  { value: "auto", label: "Automático (pela data)" },
  { value: "agendado", label: "Agendado" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "finalizado", label: "Finalizado" },
  { value: "adiado", label: "Adiado" },
];

export const SPECS: Record<CollectionName, CollectionSpec> = {
  games: {
    name: "games",
    label: "Jogos e placares",
    singular: "jogo",
    columns: ["date", "time", "modality", "category", "opponent", "status", "scoreLobo", "scoreOpponent"],
    sortBy: { key: "date", dir: "desc" },
    fields: [
      { key: "modality", label: "Modalidade", type: "select", optionsFrom: "modalities", required: true, half: true },
      { key: "category", label: "Categoria", type: "select", options: categories, required: true, half: true, default: "Masculino" },
      { key: "competition", label: "Competição", type: "text", help: "Ex.: Jogos Universitários 2026" },
      { key: "opponent", label: "Adversário", type: "text", required: true, half: true },
      { key: "opponentLogo", label: "Escudo do adversário", type: "image", half: true },
      { key: "date", label: "Data", type: "date", required: true, half: true },
      { key: "time", label: "Horário", type: "time", half: true, help: "Vazio = “Horário a definir”" },
      { key: "location", label: "Local (nome)", type: "text", required: true, help: "Ex.: Ginásio do CEFET" },
      { key: "address", label: "Endereço para o mapa", type: "text", help: "Usado no botão “Ver no mapa”. Se vazio, usa o nome do local." },
      { key: "homeAway", label: "Mando", type: "select", options: [{ value: "casa", label: "Em casa" }, { value: "fora", label: "Fora" }, { value: "neutro", label: "Local neutro" }], default: "casa", half: true },
      { key: "status", label: "Status", type: "select", options: GAME_STATUSES, default: "auto", half: true, help: "“Automático” mostra Agendado / Em breve / Hoje conforme a data." },
      { key: "scoreLobo", label: "Placar Lobo", type: "number", nullable: true, min: 0, half: true },
      { key: "scoreOpponent", label: "Placar adversário", type: "number", nullable: true, min: 0, half: true },
      { key: "notes", label: "Observações", type: "textarea" },
    ],
  },
  trainings: {
    name: "trainings",
    label: "Escala de treinos",
    singular: "treino",
    columns: ["day", "start", "end", "modality", "category", "court"],
    fields: [
      { key: "modality", label: "Modalidade", type: "select", optionsFrom: "modalities", required: true, half: true },
      { key: "category", label: "Categoria", type: "select", options: categories, required: true, half: true, default: "Masculino" },
      { key: "day", label: "Dia da semana", type: "select", options: [...WEEK_DAYS], required: true },
      { key: "start", label: "Início", type: "time", required: true, half: true },
      { key: "end", label: "Fim", type: "time", required: true, half: true },
      { key: "court", label: "Quadra / local", type: "text", required: true },
      { key: "address", label: "Endereço para o mapa", type: "text" },
      { key: "coach", label: "Técnico / responsável", type: "text" },
    ],
  },
  products: {
    name: "products",
    label: "Produtos e estoque",
    singular: "produto",
    columns: ["name", "category", "price", "stock", "badge", "active"],
    fields: [
      { key: "name", label: "Nome", type: "text", required: true },
      { key: "category", label: "Categoria", type: "select", required: true, options: ["Roupas", "Acessórios", "Uniformes"].map((v) => ({ value: v, label: v })), half: true, default: "Roupas" },
      { key: "badge", label: "Selo", type: "text", half: true, help: "Ex.: Mais vendido, Lançamento (vazio = sem selo)" },
      { key: "price", label: "Preço (R$)", type: "money", required: true, min: 0, half: true },
      { key: "compareAtPrice", label: "Preço “de” (R$)", type: "money", nullable: true, min: 0, half: true, help: "Opcional, aparece riscado" },
      { key: "stock", label: "Estoque (unidades)", type: "number", required: true, min: 0, half: true, default: 0 },
      { key: "active", label: "Visível na loja", type: "boolean", half: true, default: true },
      { key: "sizes", label: "Tamanhos", type: "list", help: "Um por linha. Vazio = tamanho único." },
      { key: "customizable", label: "Aceita personalização (nome e número)", type: "boolean", default: false },
      { key: "featured", label: "Destaque na página inicial (lançamento)", type: "boolean", default: false },
      { key: "paymentLink", label: "Link de pagamento (crédito/débito)", type: "url", help: "Link criado na InfinitePay para este valor. Vazio = usa o link padrão das Configurações." },
      { key: "pixKey", label: "Chave Pix", type: "pixkey", help: "CPF, CNPJ, e-mail, telefone ou chave aleatória. Vazio = usa a chave padrão das Configurações." },
      { key: "image", label: "Foto", type: "image" },
      { key: "description", label: "Descrição", type: "textarea" },
    ],
  },
  plans: {
    name: "plans",
    label: "Planos Sócio-Lobo",
    singular: "plano",
    columns: ["name", "price", "period", "highlight", "active"],
    fields: [
      { key: "name", label: "Nome do plano", type: "text", required: true },
      { key: "tagline", label: "Chamada", type: "text" },
      { key: "price", label: "Preço (R$)", type: "money", required: true, min: 0, half: true },
      { key: "period", label: "Período", type: "select", options: [{ value: "mensal", label: "Mensal" }, { value: "semestral", label: "Semestral" }, { value: "anual", label: "Anual" }], default: "semestral", half: true },
      { key: "benefits", label: "Benefícios", type: "list", help: "Um benefício por linha" },
      { key: "paymentLink", label: "Link de pagamento (crédito/débito)", type: "url", help: "Link criado na InfinitePay para este valor. Vazio = usa o link padrão das Configurações." },
      { key: "pixKey", label: "Chave Pix", type: "pixkey", help: "CPF, CNPJ, e-mail, telefone ou chave aleatória. Vazio = usa a chave padrão das Configurações." },
      { key: "athlete", label: "Plano de atleta", type: "boolean", half: true, default: false, help: "Exige foto, modalidades, comprovante de matrícula e termo de atleta na adesão" },
      { key: "highlight", label: "Destacar este plano", type: "boolean", half: true, default: false },
      { key: "active", label: "Disponível para adesão", type: "boolean", half: true, default: true },
    ],
  },
  events: {
    name: "events",
    label: "Eventos",
    singular: "evento",
    columns: ["date", "name", "type", "salesOpen", "featured", "active"],
    sortBy: { key: "date", dir: "desc" },
    fields: [
      { key: "name", label: "Nome do evento", type: "text", required: true },
      { key: "type", label: "Tipo", type: "select", required: true, half: true, default: "festa", options: EVENT_TYPES },
      { key: "image", label: "Foto ilustrativa", type: "image", half: true },
      { key: "description", label: "Descrição", type: "textarea" },
      { key: "date", label: "Data", type: "date", required: true, half: true },
      { key: "time", label: "Horário de início", type: "time", half: true },
      { key: "duration", label: "Duração", type: "text", half: true, help: "Ex.: 8 horas, das 15h às 23h, 3 dias" },
      { key: "location", label: "Local", type: "text", required: true, half: true },
      { key: "address", label: "Endereço para o mapa", type: "text" },
      { key: "lots", label: "Lotes de ingresso", type: "lots", help: "Em ordem. O site mostra o primeiro lote não esgotado e ainda dentro do prazo; na data/hora da virada o preço muda sozinho." },
      { key: "salesOpen", label: "Vendas abertas no site", type: "boolean", half: true, default: true },
      { key: "featured", label: "Destaque na página inicial", type: "boolean", half: true, default: false },
      { key: "active", label: "Visível no site", type: "boolean", half: true, default: true },
      { key: "paymentLink", label: "Link de pagamento (crédito/débito)", type: "url", help: "Link InfinitePay do ingresso. Vazio = usa o link padrão das Configurações." },
      { key: "pixKey", label: "Chave Pix", type: "pixkey", help: "Vazio = usa a chave padrão das Configurações." },
      { key: "pastEditions", label: "Reprise das últimas edições (texto)", type: "textarea", help: "Ex.: Edição 2.0 teve 800 pessoas, open bar de 6h…" },
      { key: "pastPhotos", label: "Fotos das últimas edições", type: "images" },
      { key: "pastVideo", label: "Vídeo das últimas edições", type: "url", help: "Link do YouTube, Instagram ou Drive (aftermovie)" },
    ],
  },
  titles: {
    name: "titles",
    label: "Galeria de títulos",
    singular: "título",
    columns: ["year", "championship", "modality", "category", "placement"],
    sortBy: { key: "year", dir: "desc" },
    fields: [
      { key: "championship", label: "Campeonato", type: "text", required: true },
      { key: "year", label: "Ano", type: "number", required: true, min: 1900, half: true, default: new Date().getFullYear() },
      { key: "placement", label: "Colocação", type: "select", options: PLACEMENTS, required: true, half: true, default: "campeao" },
      { key: "modality", label: "Modalidade", type: "select", optionsFrom: "modalities", required: true, half: true },
      { key: "category", label: "Categoria", type: "select", options: categories, required: true, half: true, default: "Masculino" },
      { key: "cover", label: "Foto de capa", type: "image" },
      { key: "photos", label: "Galeria de fotos", type: "images" },
      { key: "description", label: "Detalhes da conquista", type: "textarea" },
    ],
  },
  orders: {
    name: "orders",
    label: "Pedidos",
    singular: "pedido",
    readOnly: true,
    columns: ["createdAt", "customer", "total", "method", "status"],
    sortBy: { key: "createdAt", dir: "desc" },
    fields: [
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["pendente", "pago", "cancelado", "entregue"].map((v) => ({ value: v, label: v })),
      },
    ],
  },
  accounts: {
    name: "accounts",
    label: "Clientes",
    singular: "cliente",
    readOnly: true,
    columns: [],
    fields: [],
  },
  members: {
    name: "members",
    label: "Sócios",
    singular: "sócio",
    readOnly: true,
    columns: [],
    fields: [],
  },
  adminUsers: {
    name: "adminUsers",
    label: "Perfis de acesso",
    singular: "perfil",
    readOnly: true,
    columns: [],
    fields: [],
  },
  settings: {
    name: "settings",
    label: "Configurações gerais",
    singular: "configurações",
    singleton: true,
    columns: [],
    fields: [
      { key: "siteName", label: "Nome do site", type: "text", required: true },
      { key: "tagline", label: "Frase de destaque", type: "text" },
      { key: "announcement", label: "Aviso no topo do site", type: "text", help: "Vazio = sem aviso" },
      { key: "modalities", label: "Modalidades", type: "list", help: "Uma por linha. Alimenta filtros e formulários." },
      { key: "schedulePeriod", label: "Período da escala de treinos", type: "text", help: "Ex.: 2026.2 · de 17/08 até 19/11" },
      { key: "scheduleNotice", label: "Aviso da escala de treinos", type: "text", help: "Aparece em destaque na aba Escala" },
      { key: "customizationPrice", label: "Valor da personalização de uniforme (R$)", type: "money", min: 0, half: true },
      { key: "memberDiscountPercent", label: "Desconto do sócio na loja (%)", type: "number", min: 0, half: true },
      { key: "pixKey", label: "Chave Pix padrão", type: "pixkey", help: "Usada nos produtos e planos sem chave própria" },
      { key: "pixReceiverName", label: "Nome do recebedor do Pix", type: "text", half: true, help: "Como aparece no banco (até 25 letras). Ex.: AAA CEFET RJ" },
      { key: "pixCity", label: "Cidade do recebedor do Pix", type: "text", half: true, help: "Ex.: Rio de Janeiro" },
      { key: "paymentLink", label: "Link de pagamento padrão (crédito/débito)", type: "url", help: "Usado quando o item não tem link próprio. Pode ser um link de valor livre da InfinitePay." },
      { key: "instagram", label: "Instagram (@)", type: "text", half: true },
      { key: "whatsapp", label: "WhatsApp (com DDD)", type: "text", half: true },
      { key: "email", label: "E-mail de contato", type: "text" },
    ],
  },
};

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; errors: string[] };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Normaliza e valida um registro conforme a definição de campos. */
export function validateRecord(
  spec: CollectionSpec,
  raw: Record<string, unknown>,
  ctx: { modalities: string[] },
): ValidationResult<Record<string, unknown>> {
  const out: Record<string, unknown> = {};
  const errors: string[] = [];

  for (const f of spec.fields) {
    let v = raw[f.key];
    const empty = v === undefined || v === null || v === "";
    if (empty && f.default !== undefined) v = f.default;

    switch (f.type) {
      case "lots": {
        const rows = Array.isArray(v) ? v : [];
        const lots = [];
        for (const [i, r] of rows.entries()) {
          const row = (r ?? {}) as Record<string, unknown>;
          const name = String(row.name ?? "").trim() || `${i + 1}º lote`;
          const price = typeof row.price === "number" ? row.price : Number(String(row.price ?? "").replace(",", "."));
          const endsAt = String(row.endsAt ?? "").trim();
          if (!Number.isFinite(price) || price < 0) { errors.push(`${f.label}: preço inválido no ${name}`); continue; }
          if (endsAt && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(endsAt)) { errors.push(`${f.label}: data de virada inválida no ${name}`); continue; }
          lots.push({ name: name.slice(0, 40), price: Math.round(price * 100) / 100, endsAt, soldOut: row.soldOut === true });
        }
        if (f.required && lots.length === 0) errors.push(`${f.label}: cadastre ao menos um lote`);
        out[f.key] = lots;
        break;
      }
      case "number":
      case "money": {
        if (v === undefined || v === null || v === "") {
          if (f.nullable) { out[f.key] = null; break; }
          if (f.required) { errors.push(`${f.label}: obrigatório`); break; }
          out[f.key] = 0;
          break;
        }
        const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
        if (!Number.isFinite(n)) { errors.push(`${f.label}: número inválido`); break; }
        if (f.min !== undefined && n < f.min) { errors.push(`${f.label}: mínimo ${f.min}`); break; }
        out[f.key] = f.type === "money" ? Math.round(n * 100) / 100 : Math.round(n);
        break;
      }
      case "boolean":
        out[f.key] = v === true || v === "true" || v === "on";
        break;
      case "list":
      case "images": {
        const arr = Array.isArray(v) ? v : typeof v === "string" ? v.split("\n") : [];
        out[f.key] = arr.map((s) => String(s).trim()).filter(Boolean);
        if (f.required && (out[f.key] as string[]).length === 0) errors.push(`${f.label}: obrigatório`);
        break;
      }
      default: {
        const s = v === undefined || v === null ? "" : String(v).trim();
        if (f.required && !s) { errors.push(`${f.label}: obrigatório`); break; }
        if (s && f.type === "date" && !DATE_RE.test(s)) errors.push(`${f.label}: use AAAA-MM-DD`);
        if (s && f.type === "time" && !TIME_RE.test(s)) errors.push(`${f.label}: use HH:MM`);
        if (s && f.type === "url" && !/^https:\/\/[^\s]+\.[^\s]+$/.test(s)) errors.push(`${f.label}: cole o link completo, começando com https://`);
        if (s && f.type === "pixkey" && !isPlausiblePixKey(s)) errors.push(`${f.label}: chave Pix inválida (CPF, CNPJ, e-mail, telefone com DDD ou chave aleatória)`);
        if (s && f.type === "pixkey") { out[f.key] = normalizePixKey(s); break; }
        if (s && f.type === "select") {
          const allowed = f.optionsFrom === "modalities" ? ctx.modalities : (f.options ?? []).map((o) => o.value);
          if (!allowed.includes(s)) errors.push(`${f.label}: opção inválida “${s}”`);
        }
        out[f.key] = s;
      }
    }
  }

  if (spec.name === "trainings" && typeof out.start === "string" && typeof out.end === "string" && out.end <= out.start) {
    errors.push("Fim do treino deve ser depois do início");
  }

  return errors.length ? { ok: false, errors } : { ok: true, value: out };
}
