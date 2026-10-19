import { NextResponse } from "next/server";
import { ADMIN_PROFILES, DATA_OWNER, generatePassword, getAdminUsers, profileName, requireAdmin, setAdminPassword } from "@/lib/admin-users";
import { audit } from "@/lib/audit";

// Só o Data Owner: gera uma senha nova para um perfil (e derruba as sessões dele).
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin({ dataOwner: true });
  if (admin instanceof NextResponse) return admin;
  const { id } = await params;
  if (!ADMIN_PROFILES.some((p) => p.id === id)) return NextResponse.json({ errors: ["Perfil desconhecido"] }, { status: 404 });
  // instalação nova: o Data Owner precisa ter senha própria antes, senão perderia o acesso
  if (id !== DATA_OWNER && !(await getAdminUsers()).some((u) => u.id === DATA_OWNER)) {
    return NextResponse.json({ errors: ["Gere primeiro a senha do próprio Data Owner"] }, { status: 400 });
  }
  const password = generatePassword();
  await setAdminPassword(id, password);
  await audit(admin, { action: "senha", area: "Perfis de acesso", target: `Nova senha gerada para ${profileName(id)}` });
  return NextResponse.json({ password });
}
