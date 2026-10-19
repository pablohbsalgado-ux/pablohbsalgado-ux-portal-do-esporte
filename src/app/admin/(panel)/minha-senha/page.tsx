import { AdminPasswordForm } from "@/components/admin/AdminPasswordForm";
import { currentAdmin } from "@/lib/admin-users";

export default async function MinhaSenhaPage() {
  const admin = await currentAdmin();
  return (
    <div className="p-5 md:p-8">
      <h1 className="text-3xl text-lobo-navy">Minha senha</h1>
      <p className="text-sm text-slate-500">Perfil: {admin?.name}. Ao trocar, os outros dispositivos conectados com este perfil são desconectados.</p>
      <div className="mt-6 max-w-md">
        <AdminPasswordForm />
      </div>
    </div>
  );
}
