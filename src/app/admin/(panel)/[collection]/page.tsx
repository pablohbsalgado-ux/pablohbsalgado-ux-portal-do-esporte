import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CollectionEditor } from "@/components/admin/CollectionEditor";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { specFor } from "@/lib/admin";
import { getCollection } from "@/lib/store";

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
