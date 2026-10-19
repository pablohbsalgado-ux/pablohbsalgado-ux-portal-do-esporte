import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AuditTable } from "@/components/admin/AuditTable";
import { ADMIN_PROFILES, DATA_OWNER, currentAdmin } from "@/lib/admin-users";
import { listAudit } from "@/lib/audit";

export default async function HistoricoPage() {
  const admin = await currentAdmin();
  if (admin?.id !== DATA_OWNER) notFound();
  const entries = await listAudit(5000);
  return (
    <div className="p-5 md:p-8">
      <h1 className="text-3xl text-lobo-navy">Histórico de alterações</h1>
      <p className="text-sm text-slate-500">
        Tudo o que foi feito no painel, por perfil. Os registros não podem ser editados nem apagados, por ninguém.
      </p>
      <div className="mt-6">
        <Suspense>
          <AuditTable entries={entries} profiles={ADMIN_PROFILES.map(({ id, name }) => ({ id, name }))} />
        </Suspense>
      </div>
    </div>
  );
}
