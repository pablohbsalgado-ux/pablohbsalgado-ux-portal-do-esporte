// Tipos de todo o conteúdo editável pelo painel. As definições de campos
// (formulários + validação) ficam em ./schema.ts.

export type Category = "Masculino" | "Feminino" | "Misto";

export type GameStatus = "auto" | "agendado" | "em_andamento" | "finalizado" | "adiado";

export interface Game {
  id: string;
  modality: string;
  category: Category;
  competition: string;
  opponent: string;
  opponentLogo: string;
  date: string; // AAAA-MM-DD
  time: string; // HH:MM ("" = a definir)
  location: string;
  address: string;
  homeAway: "casa" | "fora" | "neutro";
  status: GameStatus;
  scoreLobo: number | null;
  scoreOpponent: number | null;
  notes: string;
}

export type WeekDay = "seg" | "ter" | "qua" | "qui" | "sex" | "sab";

export interface Training {
  id: string;
  modality: string;
  category: Category;
  day: WeekDay;
  start: string; // HH:MM
  end: string; // HH:MM
  court: string;
  address: string;
  coach: string;
}

export type ProductCategory = "Roupas" | "Acessórios" | "Uniformes";

export interface Product {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  price: number;
  compareAtPrice: number | null;
  image: string;
  badge: string;
  sizes: string[];
  stock: number;
  customizable: boolean;
  active: boolean;
  featured?: boolean; // destaque na página inicial
  paymentLink?: string; // link InfinitePay (crédito/débito)
  pixKey?: string;
}

export interface Plan {
  id: string;
  name: string;
  tagline: string;
  price: number;
  period: "mensal" | "semestral" | "anual";
  benefits: string[];
  highlight: boolean;
  active: boolean;
  athlete?: boolean; // plano de atleta: exige foto, modalidades, comprovante e termo de atleta
  paymentLink?: string;
  pixKey?: string;
}

export type EventType = "festa" | "campeonato" | "jogo" | "outro";

/** Lote de ingressos. A virada acontece em endsAt (horário de Brasília) ou quando marcado como esgotado. */
export interface EventLot {
  name: string;
  price: number;
  endsAt: string; // "AAAA-MM-DDTHH:MM" (vazio = vale até esgotar)
  soldOut: boolean;
}

/** Evento (festas e eventos esportivos) com venda de ingressos por lote. */
export interface LoboEvent {
  id: string;
  name: string;
  type: EventType;
  description: string;
  image: string;
  date: string; // AAAA-MM-DD
  time: string; // HH:MM
  duration: string; // texto livre: "8 horas", "2 dias"…
  location: string;
  address: string;
  lots: EventLot[];
  salesOpen: boolean;
  featured: boolean; // destaque na página inicial
  active: boolean;
  pastEditions: string;
  pastPhotos: string[];
  pastVideo: string;
  paymentLink?: string;
  pixKey?: string;
}

export type Placement = "campeao" | "vice" | "terceiro" | "destaque";

export interface Title {
  id: string;
  championship: string;
  year: number;
  modality: string;
  category: Category;
  placement: Placement;
  description: string;
  cover: string;
  photos: string[];
}

export interface Settings {
  siteName: string;
  tagline: string;
  modalities: string[];
  customizationPrice: number;
  memberDiscountPercent: number;
  instagram: string;
  whatsapp: string;
  email: string;
  announcement: string;
  schedulePeriod: string;
  scheduleNotice: string;
  pixKey?: string; // chave Pix padrão
  pixReceiverName?: string;
  pixCity?: string;
  paymentLink?: string; // link de pagamento padrão
}

export type OrderStatus = "pendente" | "pago" | "cancelado" | "entregue";

export interface OrderItem {
  kind: "product" | "plan" | "event";
  refId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  size?: string;
  customization?: { name: string; number: string };
  lot?: string; // ingresso: nome do lote vigente na compra
  eventDate?: string;
  paymentLink?: string; // copiados do produto/plano/evento no momento da compra
  pixKey?: string;
}

export interface Order {
  id: string;
  createdAt: string;
  status: OrderStatus;
  method: "pix" | "card";
  total: number;
  items: OrderItem[];
  customer: { name: string; email: string; phone: string; cpf: string };
  paymentId: string;
  stockApplied: boolean;
  demo: boolean;
  pix?: { qrCodeBase64: string; copyPaste: string; expiresAt: string };
  accountId?: string; // compra de produtos: conta que fez o pedido
  memberId?: string; // adesão de sócio: ficha vinculada
  provider?: "manual" | "mercadopago"; // manual = chave Pix/link InfinitePay + comprovante
  paymentProof?: string; // comprovante enviado pelo cliente (arquivo privado)
  proofSubmittedAt?: string;
}

/** Conta de cliente (obrigatória para comprar produtos). */
export interface Account {
  id: string;
  createdAt: string;
  fullName: string;
  cpf: string; // só dígitos
  phone: string; // só dígitos
  email: string; // minúsculo
  passwordHash: string; // scrypt$salt$hash — nunca sai do servidor
}

export type PublicAccount = Omit<Account, "passwordHash">;

export type EnrollmentStatus = "ativo" | "formado" | "nao_aluno";
export type MemberStatus = "pendente" | "ativo" | "cancelado";

/** Ficha de associação (Sócio-Lobo). */
export interface Member {
  id: string;
  createdAt: string;
  status: MemberStatus;
  planId: string;
  planName: string;
  athlete: boolean;
  accountId: string;
  orderId: string;
  fullName: string;
  email: string;
  cpf: string;
  phone: string;
  birthDate: string; // AAAA-MM-DD
  enrollmentStatus: EnrollmentStatus;
  instagram: string;
  course: string;
  sex: "Masculino" | "Feminino";
  modalities: string[]; // atleta
  photo: string; // arquivo privado (atleta)
  enrollmentProof: string; // arquivo privado
  generalTermsAcceptedAt: string;
  athleteTermsAcceptedAt: string; // atleta
}

export interface Collections {
  games: Game[];
  trainings: Training[];
  products: Product[];
  plans: Plan[];
  titles: Title[];
  events: LoboEvent[];
  orders: Order[];
  accounts: Account[];
  members: Member[];
  adminUsers: AdminUser[];
  settings: Settings;
}

export type CollectionName = keyof Collections;

/** Perfil de acesso ao painel (uma senha por diretoria/conselho). */
export interface AdminUser {
  id: string; // chave fixa do perfil (ex.: "presidencia")
  name: string;
  passwordHash: string; // scrypt — nunca sai do servidor
  sessionVersion: number; // muda ao trocar a senha: derruba sessões antigas
  passwordChangedAt: string;
  lastLoginAt: string;
}

export interface AuditChange {
  field: string;
  before: string;
  after: string;
}

/** Registro do histórico de alterações do painel (somente inclusão). */
export interface AuditEntry {
  id: string;
  at: string;
  actorId: string;
  actorName: string;
  action: "criar" | "editar" | "excluir" | "status" | "senha" | "upload" | "login" | "login_falhou" | "logout";
  area: string;
  target: string;
  changes: AuditChange[];
  ip: string;
}
