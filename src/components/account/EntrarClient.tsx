"use client";

import { AuthForms } from "./AuthForms";

export function EntrarClient({ next, initialTab }: { next: string; initialTab: "login" | "register" }) {
  // navegação completa para a página seguinte já renderizar com a sessão nova
  return <AuthForms initialTab={initialTab} onDone={() => window.location.assign(next)} />;
}
