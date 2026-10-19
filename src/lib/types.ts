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
}

export type OrderStatus = "pendente" | "pago" | "cancelado" | "entregue";

export interface OrderItem {
  kind: "product" | "plan";
  refId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  size?: string;
  customization?: { name: string; number: string };
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
}

export interface Collections {
  games: Game[];
  trainings: Training[];
  products: Product[];
  plans: Plan[];
  titles: Title[];
  orders: Order[];
  settings: Settings;
}

export type CollectionName = keyof Collections;
