// Perfis de acesso ao painel. Cada diretoria/conselho tem a sua senha e todas as
// alterações ficam no histórico com o perfil que as fez (ver ./audit.ts).

import { randomBytes } from "crypto";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { hashPassword, verifyPassword } from "./accounts";
import { SESSION_COOKIE, checkPassword, readSessionToken } from "./auth";
import { getCollection, updateCollection } from "./store";
import type { AdminUser } from "./types";

export const DATA_OWNER = "data_owner";

/** Perfis fixos do painel, na ordem em que aparecem no login. */
export const ADMIN_PROFILES = [
  { id: "presidencia", name: "Presidência" },
  { id: "vice_presidencia", name: "Vice-presidência" },
  { id: "dir_adm_fin", name: "Diretoria Administrativa Financeira" },
  { id: "dir_esportes", name: "Diretoria de Esportes" },
  { id: "dir_marketing", name: "Diretoria de Marketing" },
  { id: "cons_administrativo", name: "Conselho Administrativo" },
  { id: "cons_benemeritos", name: "Conselho de Beneméritos" },
  { id: DATA_OWNER, name: "Data Owner" },
] as const;

export type PublicAdminUser = Omit<AdminUser, "passwordHash">;

export function toPublicAdmin({ passwordHash: _omit, ...rest }: AdminUser): PublicAdminUser {
  return rest;
}

export function profileName(id: string) {
  return ADMIN_PROFILES.find((p) => p.id === id)?.name ?? id;
}

/** Senha forte e fácil de digitar (sem caracteres ambíguos). */
export function generatePassword() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(14);
  const body = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `Lobo-${body.slice(0, 5)}-${body.slice(5, 10)}`;
}

export function checkAdminPasswordRules(password: string) {
  if (password.length < 10) return "A senha do painel precisa ter pelo menos 10 caracteres";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "Use letras e números na senha";
  return null;
}

export async function getAdminUsers() {
  return getCollection("adminUsers");
}

/**
 * Confere perfil + senha. Enquanto nenhum perfil tiver sido cadastrado (instalação nova),
 * ADMIN_PASSWORD continua valendo como acesso do Data Owner.
 */
export async function authenticateAdmin(userId: string, password: string): Promise<AdminUser | null> {
  const users = await getAdminUsers();
  if (users.length === 0) {
    if (userId !== DATA_OWNER || !(await checkPassword(password))) return null;
    return { id: DATA_OWNER, name: profileName(DATA_OWNER), passwordHash: "", sessionVersion: 0, passwordChangedAt: "", lastLoginAt: "" };
  }
  const user = users.find((u) => u.id === userId);
  // compara mesmo sem perfil, para não revelar pelo tempo de resposta
  const ok = await verifyPassword(password, user?.passwordHash ?? `scrypt$${"0".repeat(32)}$${"0".repeat(128)}`);
  return ok && user ? user : null;
}

export async function touchLastLogin(userId: string) {
  await updateCollection("adminUsers", (list) => list.map((u) => (u.id === userId ? { ...u, lastLoginAt: new Date().toISOString() } : u)));
}

/** Define a senha de um perfil (criando-o se ainda não existir) e derruba as sessões abertas dele. */
export async function setAdminPassword(userId: string, password: string) {
  if (!ADMIN_PROFILES.some((p) => p.id === userId)) throw new Error("Perfil desconhecido");
  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();
  await updateCollection("adminUsers", (list) => {
    const existing = list.find((u) => u.id === userId);
    if (!existing) {
      return [...list, { id: userId, name: profileName(userId), passwordHash, sessionVersion: 1, passwordChangedAt: now, lastLoginAt: "" }];
    }
    return list.map((u) => (u.id === userId ? { ...u, passwordHash, sessionVersion: u.sessionVersion + 1, passwordChangedAt: now } : u));
  });
}

/** Perfil logado na requisição atual (assinatura + versão da senha conferidas). */
export async function currentAdmin(): Promise<PublicAdminUser | null> {
  const session = await readSessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const users = await getAdminUsers();
  if (users.length === 0) {
    // instalação nova: só existe o acesso do Data Owner via ADMIN_PASSWORD
    return session.userId === DATA_OWNER && session.version === 0
      ? { id: DATA_OWNER, name: profileName(DATA_OWNER), sessionVersion: 0, passwordChangedAt: "", lastLoginAt: "" }
      : null;
  }
  const user = users.find((u) => u.id === session.userId);
  return user && user.sessionVersion === session.version ? toPublicAdmin(user) : null;
}

/** Para rotas do painel: devolve o perfil logado ou uma resposta 401/403 pronta. */
export async function requireAdmin(opts: { dataOwner?: boolean } = {}): Promise<PublicAdminUser | NextResponse> {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ errors: ["Sessão expirada. Entre novamente."] }, { status: 401 });
  if (opts.dataOwner && admin.id !== DATA_OWNER) return NextResponse.json({ errors: ["Acesso restrito ao Data Owner"] }, { status: 403 });
  return admin;
}

export async function clientIp() {
  return (await headers()).get("x-forwarded-for")?.split(",")[0].trim() ?? "";
}
