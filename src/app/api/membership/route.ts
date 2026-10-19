import { NextResponse } from "next/server";
import { currentAccount } from "@/lib/accounts";
import { MemberError, createMember, isAthletePlan, patchMember, setMemberStatus, validateMemberInput } from "@/lib/members";
import { CheckoutError, placeOrder } from "@/lib/orders";
import { FileError, checkPrivateFile, savePrivateFile } from "@/lib/private-files";
import { getCollection } from "@/lib/store";

export const dynamic = "force-dynamic";

// Adesão ao Sócio-Lobo: recebe a ficha (multipart, com foto e comprovante), grava a ficha
// como "pendente" e gera o pagamento. A ficha vira "ativo" quando o pagamento é aprovado.
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  const text = (k: string) => String(form.get(k) ?? "");

  const [plans, settings] = await Promise.all([getCollection("plans"), getCollection("settings")]);
  const plan = plans.find((p) => p.id === text("planId") && p.active);
  if (!plan) return NextResponse.json({ error: "Plano indisponível" }, { status: 400 });
  const athlete = isAthletePlan(plan);

  // confere a forma de pagamento antes de gravar ficha e arquivos
  const method = text("method") === "card" ? "card" : "pix";
  const payTo = method === "pix" ? plan.pixKey || settings.pixKey : plan.paymentLink || settings.paymentLink;
  if (!payTo && !process.env.MP_ACCESS_TOKEN) {
    return NextResponse.json(
      { error: method === "pix" ? "Pagamento por Pix indisponível para este plano. Escolha cartão ou fale com a diretoria." : "Pagamento por cartão indisponível para este plano. Escolha Pix ou fale com a diretoria." },
      { status: 400 },
    );
  }

  let memberId = "";
  try {
    const data = validateMemberInput(
      {
        fullName: text("fullName"),
        email: text("email"),
        cpf: text("cpf"),
        phone: text("phone"),
        birthDate: text("birthDate"),
        enrollmentStatus: text("enrollmentStatus"),
        instagram: text("instagram"),
        course: text("course"),
        sex: text("sex"),
        modalities: form.getAll("modalities").map(String),
      },
      { athlete, siteModalities: settings.modalities },
    );

    if (form.get("acceptGeneralTerms") !== "on") throw new MemberError("É preciso aceitar o termo de responsabilidade do associado");
    if (athlete && form.get("acceptAthleteTerms") !== "on") throw new MemberError("É preciso aceitar o termo de responsabilidade do atleta");

    const photo = form.get("photo");
    const proof = form.get("enrollmentProof");
    const hasPhoto = photo instanceof File && photo.size > 0;
    const hasProof = proof instanceof File && proof.size > 0;
    if (athlete && !hasPhoto) throw new MemberError("Envie uma foto de perfil (obrigatória para Sócio Atleta)");
    if (athlete && !hasProof) throw new MemberError("Envie o comprovante de matrícula (obrigatório para Sócio Atleta)");

    const photoRules = { label: "Foto de perfil", imagesOnly: true };
    const proofRules = { label: "Comprovante de matrícula" };
    if (hasPhoto) checkPrivateFile(photo, photoRules);
    if (hasProof) checkPrivateFile(proof, proofRules);
    const photoName = hasPhoto ? await savePrivateFile(photo, photoRules) : "";
    const proofName = hasProof ? await savePrivateFile(proof, proofRules) : "";

    const account = await currentAccount();
    const now = new Date().toISOString();
    const member = await createMember({
      ...data,
      planId: plan.id,
      planName: plan.name,
      athlete,
      accountId: account?.id ?? "",
      photo: photoName,
      enrollmentProof: proofName,
      generalTermsAcceptedAt: now,
      athleteTermsAcceptedAt: athlete ? now : "",
    });
    memberId = member.id;

    const result = await placeOrder({
      method,
      total: plan.price,
      items: [
        {
          kind: "plan",
          refId: plan.id,
          name: `Sócio-Lobo: ${plan.name} (${plan.period})`,
          unitPrice: plan.price,
          quantity: 1,
          paymentLink: plan.paymentLink || settings.paymentLink || "",
          pixKey: plan.pixKey || settings.pixKey || "",
        },
      ],
      customer: { name: data.fullName, email: data.email, phone: data.phone, cpf: data.cpf },
      memberId: member.id,
      ...(account ? { accountId: account.id } : {}),
    });
    await patchMember(member.id, { orderId: result.orderId });
    return NextResponse.json(result);
  } catch (err) {
    if (memberId) await setMemberStatus(memberId, "cancelado").catch(() => undefined);
    if (err instanceof MemberError || err instanceof FileError || err instanceof CheckoutError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[membership]", err);
    return NextResponse.json({ error: "Não foi possível enviar a ficha agora. Tente novamente em instantes." }, { status: 502 });
  }
}
