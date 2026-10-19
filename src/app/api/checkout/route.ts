import { NextResponse } from "next/server";
import { currentAccount } from "@/lib/accounts";
import { CheckoutError, placeOrder, priceCart, type CartLine } from "@/lib/orders";

export const dynamic = "force-dynamic";

// Compra de produtos da loja: exige conta logada; os dados do comprador vêm do cadastro.
export async function POST(req: Request) {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Entre na sua conta para finalizar a compra", needsLogin: true }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { method?: string; items?: CartLine[] } | null;
  if (!body) return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });

  try {
    const { items, total } = await priceCart(body.items ?? []);
    const result = await placeOrder({
      method: body.method === "card" ? "card" : "pix",
      total,
      items,
      accountId: account.id,
      customer: { name: account.fullName, email: account.email, phone: account.phone, cpf: account.cpf },
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof CheckoutError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("[checkout]", err);
    return NextResponse.json({ error: "Falha ao iniciar o pagamento. Tente novamente em instantes." }, { status: 502 });
  }
}
