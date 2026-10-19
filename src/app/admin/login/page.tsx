import { LoginForm } from "@/components/admin/LoginForm";

export const metadata = { title: "Painel — Entrar", robots: { index: false } };

export default function LoginPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-lobo-navy px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/lobo.svg" alt="" className="mx-auto h-16 w-16" />
        <h1 className="mt-3 text-center text-2xl text-lobo-navy">Painel da diretoria</h1>
        <p className="mb-6 text-center text-sm text-slate-500">Acesso restrito à Atlética Lobo</p>
        <LoginForm />
      </div>
    </div>
  );
}
