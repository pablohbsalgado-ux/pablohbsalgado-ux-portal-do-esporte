// Contas de clientes: cadastro, senha (scrypt) e sessão por cookie assinado.
// Só para uso no servidor (rotas e páginas dinâmicas).

import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { cookies } from "next/headers";
import { hmacHex } from "./auth";
import { getCollection, newId, updateCollection } from "./store";
import type { Account, PublicAccount } from "./types";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export const ACCOUNT_COOKIE = "lobo_conta";
const SESSION_DAYS = 30;

export class AccountError extends Error {}

// ---------- validação ----------

export const onlyDigits = (v: unknown) => String(v ?? "").replace(/\D/g, "");

export function isValidCpf(raw: string) {
  const cpf = onlyDigits(raw);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const digit = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

export const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
export const isValidPhone = (p: string) => /^\d{10,11}$/.test(onlyDigits(p));

export function formatCpf(cpf: string) {
  const d = onlyDigits(cpf);
  return d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : cpf;
}

export function formatPhone(phone: string) {
  const d = onlyDigits(phone);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone;
}

// ---------- senha ----------

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [alg, saltHex, hashHex] = stored.split("$");
  if (alg !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

export function checkPasswordRules(password: string) {
  if (password.length < 8) return "A senha precisa ter pelo menos 8 caracteres";
  if (password.length > 128) return "Senha longa demais";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "Use letras e números na senha";
  return null;
}

// ---------- cadastro / login ----------

export function toPublic({ passwordHash: _omit, ...rest }: Account): PublicAccount {
  return rest;
}

export async function registerAccount(input: { fullName: unknown; cpf: unknown; phone: unknown; email: unknown; password: unknown }) {
  const fullName = String(input.fullName ?? "").trim().replace(/\s+/g, " ").slice(0, 120);
  const cpf = onlyDigits(input.cpf);
  const phone = onlyDigits(input.phone);
  const email = String(input.email ?? "").trim().toLowerCase().slice(0, 160);
  const password = String(input.password ?? "");

  if (fullName.split(" ").length < 2) throw new AccountError("Informe seu nome completo (nome e sobrenome)");
  if (!isValidCpf(cpf)) throw new AccountError("CPF inválido");
  if (!isValidPhone(phone)) throw new AccountError("Telefone inválido: use DDD + número");
  if (!isValidEmail(email)) throw new AccountError("E-mail inválido");
  const rule = checkPasswordRules(password);
  if (rule) throw new AccountError(rule);

  const account: Account = { id: newId("c_"), createdAt: new Date().toISOString(), fullName, cpf, phone, email, passwordHash: await hashPassword(password) };
  // a checagem de duplicidade roda dentro da fila da coleção, sem corrida entre dois cadastros
  await updateCollection("accounts", (list) => {
    if (list.some((a) => a.email === email)) throw new AccountError("Já existe uma conta com este e-mail. Faça login.");
    if (list.some((a) => a.cpf === cpf)) throw new AccountError("Já existe uma conta com este CPF. Faça login.");
    return [...list, account];
  });
  return account;
}

export async function authenticate(emailOrCpf: unknown, password: unknown) {
  const login = String(emailOrCpf ?? "").trim().toLowerCase();
  const digits = onlyDigits(login);
  const accounts = await getCollection("accounts");
  const account = accounts.find((a) => a.email === login || (digits.length === 11 && a.cpf === digits));
  // compara mesmo sem conta, para não revelar pelo tempo de resposta se o e-mail existe
  const ok = await verifyPassword(String(password ?? ""), account?.passwordHash ?? `scrypt$${"0".repeat(32)}$${"0".repeat(128)}`);
  return ok && account ? account : null;
}

export async function setAccountPassword(id: string, password: string) {
  const passwordHash = await hashPassword(password);
  let found = false;
  await updateCollection("accounts", (list) => list.map((a) => (a.id === id ? ((found = true), { ...a, passwordHash }) : a)));
  return found;
}

// ---------- sessão ----------

export async function createAccountToken(accountId: string) {
  const exp = String(Date.now() + SESSION_DAYS * 86_400_000);
  return `${accountId}.${exp}.${await hmacHex(`conta:${accountId}.${exp}`)}`;
}

async function accountIdFromToken(token: string | undefined) {
  if (!token) return null;
  const [id, exp, sig] = token.split(".");
  if (!id || !exp || !sig || Number(exp) < Date.now()) return null;
  const expected = await hmacHex(`conta:${id}.${exp}`);
  return expected.length === sig.length && timingSafeEqual(Buffer.from(expected), Buffer.from(sig)) ? id : null;
}

export const accountCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_DAYS * 86_400,
};

/** Conta logada na requisição atual (ou null). */
export async function currentAccount(): Promise<Account | null> {
  const id = await accountIdFromToken((await cookies()).get(ACCOUNT_COOKIE)?.value);
  if (!id) return null;
  return (await getCollection("accounts")).find((a) => a.id === id) ?? null;
}

// Limite simples de tentativas por IP (memória do processo).
const attempts = new Map<string, { n: number; until: number }>();
export function tooManyAttempts(key: string) {
  const a = attempts.get(key);
  return !!a && a.n >= 8 && a.until > Date.now();
}
export function recordFailure(key: string) {
  const a = attempts.get(key);
  attempts.set(key, { n: (a && a.until > Date.now() ? a.n : 0) + 1, until: Date.now() + 15 * 60_000 });
}
export function clearFailures(key: string) {
  attempts.delete(key);
}
