import { notFound } from "next/navigation";
import { ProfilesTable } from "@/components/admin/ProfilesTable";
import { ADMIN_PROFILES, DATA_OWNER, currentAdmin, getAdminUsers } from "@/lib/admin-users";
import { listAudit } from "@/lib/audit";

export default async function PerfisPage() {
  const admin = await currentAdmin();
  if (admin?.id !== DATA_OWNER) notFound();
  const [users, log] = await Promise.all([getAdminUsers(), listAudit(5000)]);
  const rows = ADMIN_PROFILES.map((p) => {
    const u = users.find((x) => x.id === p.id);
    const mine = log.filter((e) => e.actorId === p.id && !["login", "logout", "login_falhou"].includes(e.action));
    return {
      id: p.id,
      name: p.name,
      configured: !!u,
      lastLoginAt: u?.lastLoginAt ?? "",
      passwordChangedAt: u?.passwordChangedAt ?? "",
      lastChangeAt: mine[0]?.at ?? "",
      changes: mine.length,
      failedLogins: log.filter((e) => e.actorId === p.id && e.action === "login_falhou").length,
    };
  });
  return (
    <div className="p-5 md:p-8">
      <h1 className="text-3xl text-lobo-navy">Perfis de acesso</h1>
      <p className="text-sm text-slate-500">Cada diretoria e conselho entra com a própria senha. Gerar uma nova senha desconecta o perfil de todos os dispositivos.</p>
      <div className="mt-6">
        <ProfilesTable rows={rows} />
      </div>
    </div>
  );
}
