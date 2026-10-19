"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface CartItem {
  key: string;
  kind: "product" | "plan";
  id: string;
  name: string;
  image: string;
  price: number; // preço exibido; o servidor recalcula tudo no checkout
  quantity: number;
  size?: string;
  customization?: { name: string; number: string };
}

interface CartState {
  items: CartItem[];
  count: number;
  subtotal: number;
  open: boolean;
  checkoutOpen: boolean;
  setOpen: (v: boolean) => void;
  setCheckoutOpen: (v: boolean) => void;
  add: (item: Omit<CartItem, "key" | "quantity">, quantity?: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartState | null>(null);
const STORAGE_KEY = "lobo-cart-v1";

function keyFor(i: Omit<CartItem, "key" | "quantity">) {
  return [i.kind, i.id, i.size ?? "", i.customization?.name ?? "", i.customization?.number ?? ""].join("|");
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // planos de sócio não passam mais pelo carrinho (têm ficha de adesão própria)
      if (raw) setItems((JSON.parse(raw) as CartItem[]).filter((i) => i.kind === "product"));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, loaded]);

  const add = useCallback<CartState["add"]>((item, quantity = 1) => {
    const key = keyFor(item);
    setItems((prev) => {
      if (item.kind === "plan") {
        // só um plano de sócio por pedido
        return [...prev.filter((i) => i.kind !== "plan"), { ...item, key, quantity: 1 }];
      }
      const found = prev.find((i) => i.key === key);
      if (found) return prev.map((i) => (i.key === key ? { ...i, quantity: Math.min(20, i.quantity + quantity) } : i));
      return [...prev, { ...item, key, quantity }];
    });
    setOpen(true);
  }, []);

  const value = useMemo<CartState>(
    () => ({
      items,
      count: items.reduce((s, i) => s + i.quantity, 0),
      subtotal: items.reduce((s, i) => s + i.price * i.quantity, 0),
      open,
      checkoutOpen,
      setOpen,
      setCheckoutOpen,
      add,
      setQuantity: (key, quantity) =>
        setItems((prev) => prev.map((i) => (i.key === key ? { ...i, quantity: Math.max(1, Math.min(20, quantity)) } : i))),
      remove: (key) => setItems((prev) => prev.filter((i) => i.key !== key)),
      clear: () => setItems([]),
    }),
    [items, open, checkoutOpen, add],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart fora do CartProvider");
  return ctx;
}
