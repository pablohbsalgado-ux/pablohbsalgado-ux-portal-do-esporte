// Fichas de associação (Sócio-Lobo).

import { isValidCpf, isValidEmail, isValidPhone, onlyDigits } from "./accounts";
import { getCollection, newId, updateCollection } from "./store";
import type { EnrollmentStatus, Member, MemberStatus, Plan } from "./types";

export class MemberError extends Error {}

/** Plano de atleta: campo do painel; planos antigos sem o campo são reconhecidos pelo nome. */
export function isAthletePlan(plan: Pick<Plan, "athlete" | "name">) {
  return plan.athlete ?? /atleta/i.test(plan.name);
}

const ENROLLMENT: EnrollmentStatus[] = ["ativo", "formado", "nao_aluno"];

export interface MemberInput {
  fullName: string;
  email: string;
  cpf: string;
  phone: string;
  birthDate: string;
  enrollmentStatus: string;
  instagram: string;
  course: string;
  sex: string;
  modalities: string[];
}

/** Valida e normaliza os campos de texto da ficha. */
export function validateMemberInput(raw: MemberInput, opts: { athlete: boolean; siteModalities: string[] }) {
  const fullName = raw.fullName.trim().replace(/\s+/g, " ").slice(0, 120);
  const email = raw.email.trim().toLowerCase().slice(0, 160);
  const cpf = onlyDigits(raw.cpf);
  const phone = onlyDigits(raw.phone);
  const instagram = raw.instagram.trim().replace(/^@+/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/\/.*$/, "").slice(0, 40);
  const course = raw.course.trim().slice(0, 120);
  const errors: string[] = [];

  if (fullName.split(" ").length < 2) errors.push("Nome completo (nome e sobrenome)");
  if (!isValidEmail(email)) errors.push("E-mail válido");
  if (!isValidCpf(cpf)) errors.push("CPF válido");
  if (!isValidPhone(phone)) errors.push("Celular com DDD");

  const birth = /^\d{4}-\d{2}-\d{2}$/.test(raw.birthDate) ? new Date(`${raw.birthDate}T12:00:00Z`) : null;
  const age = birth ? (Date.now() - birth.getTime()) / (365.25 * 86_400_000) : NaN;
  if (!birth || Number.isNaN(age) || age < 14 || age > 100) errors.push("Data de nascimento válida");

  if (!ENROLLMENT.includes(raw.enrollmentStatus as EnrollmentStatus)) errors.push("Situação de matrícula");
  if (!/^[a-z0-9._]{1,30}$/i.test(instagram)) errors.push("Instagram (ex.: @seuperfil)");
  if (course.length < 2) errors.push("Curso");
  if (raw.sex !== "Masculino" && raw.sex !== "Feminino") errors.push("Sexo");

  const modalities = [...new Set(raw.modalities.map((m) => m.trim()))].filter((m) => opts.siteModalities.includes(m));
  if (opts.athlete && modalities.length === 0) errors.push("Ao menos uma modalidade que vai praticar");

  if (errors.length) throw new MemberError(`Preencha corretamente: ${errors.join(", ")}`);
  return {
    fullName,
    email,
    cpf,
    phone,
    birthDate: raw.birthDate,
    enrollmentStatus: raw.enrollmentStatus as EnrollmentStatus,
    instagram,
    course,
    sex: raw.sex as Member["sex"],
    modalities: opts.athlete ? modalities : [],
  };
}

export async function createMember(data: Omit<Member, "id" | "createdAt" | "status" | "orderId">) {
  const member: Member = { ...data, id: newId("s_"), createdAt: new Date().toISOString(), status: "pendente", orderId: "" };
  await updateCollection("members", (list) => {
    if (list.some((m) => m.cpf === member.cpf && m.planId === member.planId && m.status === "ativo")) {
      throw new MemberError("Este CPF já é sócio ativo neste plano.");
    }
    return [...list, member];
  });
  return member;
}

export async function patchMember(id: string, patch: Partial<Member>) {
  let found: Member | undefined;
  await updateCollection("members", (list) => list.map((m) => (m.id === id ? (found = { ...m, ...patch }) : m)));
  return found;
}

export async function setMemberStatus(id: string, status: MemberStatus) {
  return patchMember(id, { status });
}

export async function getMembers() {
  return getCollection("members");
}
