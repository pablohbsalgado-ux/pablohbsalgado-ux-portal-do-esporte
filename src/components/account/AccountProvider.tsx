"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { PublicAccount } from "@/lib/types";

interface AccountState {
  account: PublicAccount | null;
  loading: boolean;
  setAccount: (a: PublicAccount | null) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AccountContext = createContext<AccountState | null>(null);

/** Quem está logado. As páginas públicas são estáticas, então a conta é buscada no navegador. */
export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<PublicAccount | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/conta/me", { cache: "no-store" });
      setAccount(res.ok ? (await res.json()).account : null);
    } catch {
      setAccount(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch("/api/conta/sair", { method: "POST" });
    setAccount(null);
  }, []);

  return <AccountContext.Provider value={{ account, loading, setAccount, refresh, logout }}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount fora do AccountProvider");
  return ctx;
}
