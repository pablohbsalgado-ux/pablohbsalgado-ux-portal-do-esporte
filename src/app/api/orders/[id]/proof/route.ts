import { NextResponse } from "next/server";
import { getOrder, patchOrder } from "@/lib/orders";
import { FileError, savePrivateFile } from "@/lib/private-files";

export const dynamic = "force-dynamic";

// O cliente envia o comprovante do Pix/cartão pela página do pedido.
// O arquivo fica privado (só a diretoria vê no painel) e o pedido aparece como "comprovante enviado".
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order || order.provider !== "manual") return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  if (order.status !== "pendente") return NextResponse.json({ error: "Este pedido não está aguardando pagamento" }, { status: 400 });

  const file = (await req.formData().catch(() => null))?.get("proof");
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Escolha o arquivo do comprovante" }, { status: 400 });
  try {
    const name = await savePrivateFile(file, { label: "Comprovante" });
    await patchOrder(id, { paymentProof: name, proofSubmittedAt: new Date().toISOString() });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof FileError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("[proof]", err);
    return NextResponse.json({ error: "Não foi possível enviar agora. Tente novamente." }, { status: 502 });
  }
}
