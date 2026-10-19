import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CollectionEditor } from "@/components/admin/CollectionEditor";
import { AccountsTable, type AccountRow } from "@/components/admin/AccountsTable";
import { MembersTable } from "@/components/admin/MembersTable";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { specFor } from "@/lib/admin";
import { toPublic } from "@/lib/accounts";
import { getCollection } from "@/lib/store";

async function accountRows(): Promise<AccountRow[]> {
  const [accounts, orders, members] = await Promise.all([getCollection("accounts"), getCollection("orders"), getCollection("members")]);
  return accounts.map((a) => ({
    ...toPublic(a),
    isMember: members.some((m) => m.status === "ativo" && (m.accountId === a.id || m.cpf === a.cpf)),
    orders: orders
      .filter((o) => o.accountId === a.id)
      .sort((x, y) => y.createdAt.localeCompare(x.createdAt))
      .map(({ id, createdAt, status, total, method, items }) => ({ id, createdAt, status, total, method, items })),
  }));
}

export default async function CollectionPage({ params }: { params: Promise<{ collection: string }> }) {
  const spec = specFor((await params).collection);
  if (!spec) notFound();
  const settings = await getCollection("settings");

  return (
    <div className="p-5 md:p-8">
      <h1 className="text-3xl text-lobo-navy">{spec.label}</h1>
      <div className="mt-6">
        {spec.name === "settings" ? (
          <SettingsForm initial={settings as unknown as Record<string, unknown>} />
        ) : spec.name === "orders" ? (
          <OrdersTable initial={await getCollection("orders")} />
        ) : spec.name === "accounts" ? (
          <AccountsTable initial={await accountRows()} />
        ) : spec.name === "members" ? (
          <MembersTable initial={await getCollection("members")} />
        ) : (
          <Suspense>
            <CollectionEditor
              name={spec.name}
              initial={(await getCollection(spec.name)) as unknown as Record<string, unknown>[]}
              modalities={settings.modalities}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}
