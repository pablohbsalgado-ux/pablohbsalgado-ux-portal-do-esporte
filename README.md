# 🐺 Portal do Esporte — Atlética Lobo

Central de informações e portal de transparência da Atlética Lobo: **Jogos**, **Escala de treinos**, **Vendas** (loja + Sócio-Lobo) e **Títulos**.
**Todo o conteúdo que muda com a temporada é editado pelo painel `/admin`, sem mexer no código.**

| Stack | |
|---|---|
| Frontend | Next.js 15 (App Router) + React 19 + Tailwind CSS |
| Conteúdo | Painel próprio em `/admin` + arquivos JSON **ou** Supabase (Postgres) |
| Pagamentos | Mercado Pago: Pix com QR Code no site e cartão via Checkout Pro |
| Mapas | Links do Google Maps (não precisa de chave de API) |

---

## Como rodar

```bash
npm install
cp .env.example .env.local      # defina pelo menos ADMIN_PASSWORD e ADMIN_SECRET
npm run dev                     # http://localhost:3000  ·  painel: http://localhost:3000/admin
```

Produção: `npm run build && npm start`.

Sem `MP_ACCESS_TOKEN` o checkout funciona em **modo demonstração**: gera um Pix fictício e mostra o botão "Simular pagamento aprovado". Nada é cobrado.

---

## Painel administrativo (`/admin`)

Protegido por senha (`ADMIN_PASSWORD`). A sessão dura 12 h, fica num cookie `httpOnly` assinado e há limite de tentativas de login. Toda alteração salva é **publicada no site na hora**.

| Seção | O que a diretoria pode fazer |
|---|---|
| **Visão geral** | Ver alertas de placares pendentes (jogos que já passaram e não foram finalizados), produtos com estoque baixo e o total vendido |
| **Jogos e placares** | Criar, editar ou excluir jogos; lançar placar; mudar status (Automático / Agendado / Em andamento / Finalizado / Adiado) |
| **Escala de treinos** | Adicionar, editar ou remover treinos (dia, horário, modalidade, quadra) |
| **Produtos e estoque** | Preço, preço "de", estoque, fotos, selo ("Mais vendido"), tamanhos, visibilidade e se aceita personalização |
| **Planos de sócio** | Preço, período, lista de benefícios, destaque e disponibilidade |
| **Títulos** | Novas conquistas com capa e galeria de fotos (upload) |
| **Pedidos** | Acompanhar e mudar o status (pendente → pago → entregue) e exportar para planilha (CSV) |
| **Configurações** | Nome e frase do site, aviso no topo, **lista de modalidades**, valor da personalização, desconto do sócio e contatos |

No status **Automático**, o card do jogo mostra *Hoje*, *Em Breve* (próximos 3 dias) ou *Agendado* conforme a data, no fuso de Brasília.

### Adicionar um campo novo

Os formulários do painel e a validação no servidor saem da mesma definição, em `src/lib/schema.ts`. Para criar um campo novo, inclua-o ali e no tipo correspondente em `src/lib/types.ts`.

---

## Onde o conteúdo fica salvo

O acesso aos dados passa todo por `src/lib/store.ts`. Escolha o armazenamento pela variável `CONTENT_STORE`:

| Modo | Quando usar | Como |
|---|---|---|
| `json` (padrão) | VPS ou servidor próprio com disco gravável | Lê e grava os arquivos em `data/*.json`. Fotos enviadas vão para `data/uploads/` |
| `supabase` | Render, Vercel ou outra hospedagem sem disco gravável | Rode `supabase/schema.sql` no Supabase e defina `SUPABASE_URL`, `SUPABASE_KEY` (chave pública) e `SUPABASE_PORTAL_TOKEN` (token gerado pelo script). As fotos também ficam no banco |

Os arquivos em `data/` também funcionam como **conteúdo inicial**: no Supabase, uma coleção que ainda não existe usa o arquivo JSON até o primeiro salvamento.

> ⚠️ No Render e na Vercel o modo `json` **não salva** as alterações de forma permanente. Lá, use `supabase`.

As tabelas do Supabase ficam fechadas: o site só lê e grava pelas funções `portal_*`, que exigem o token secreto. Nunca exponha `SUPABASE_PORTAL_TOKEN` no navegador.

## Publicar no Render

O arquivo `render.yaml` já descreve o serviço. No Render: **New → Blueprint**, escolha este repositório e preencha as variáveis marcadas como secretas (`ADMIN_PASSWORD`, `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_PORTAL_TOKEN`; e as do Mercado Pago quando for cobrar de verdade). O `ADMIN_SECRET` é gerado automaticamente. Depois do primeiro deploy, coloque o endereço do site em `NEXT_PUBLIC_SITE_URL`.

---

## Pagamentos (Mercado Pago)

1. Crie uma aplicação em <https://www.mercadopago.com.br/developers> e copie o **Access Token** para `MP_ACCESS_TOKEN`. Use o token de teste para homologar.
2. Defina `NEXT_PUBLIC_SITE_URL` com a URL pública do site.
3. Em *Webhooks*, cadastre `https://SEU-SITE/api/webhooks/mercadopago` (evento **Pagamentos**) e copie a assinatura secreta para `MP_WEBHOOK_SECRET`.

Como funciona:
- **Preços e estoque são sempre recalculados no servidor** a partir do CMS. O valor enviado pelo navegador é ignorado.
- **Pix:** o pagamento é criado pela API, o QR Code e o "copia e cola" aparecem em `/pedido/[id]` e a página detecta a aprovação sozinha.
- **Cartão:** o cliente é levado ao Checkout Pro (em até 6x) e volta para `/pedido/[id]`. Nenhum dado de cartão passa pelo nosso servidor.
- O webhook **reconsulta o pagamento na API do MP** e confere o valor antes de marcar como pago. O estoque é baixado **uma única vez** por pedido.
- A adesão de sócio é um pagamento único pelo período do plano. Para cobrança recorrente automática, dá para evoluir para as *Assinaturas* do Mercado Pago (`/preapproval`).

---

## Estrutura

```
data/                    conteúdo (JSON) + uploads
src/app/(site)/          páginas públicas: /, /jogos, /escala, /vendas, /titulos, /pedido/[id]
src/app/admin/           login + painel (/admin, /admin/[coleção])
src/app/api/             checkout, status do pedido, webhook MP, APIs do painel
src/components/          UI (jogos, escala, loja, títulos, carrinho, painel)
src/lib/schema.ts        definição dos campos → formulários do painel + validação
src/lib/store.ts         armazenamento (JSON ou Supabase)
src/lib/payments.ts      Mercado Pago
src/lib/orders.ts        cálculo do carrinho, pedidos e baixa de estoque
src/middleware.ts        proteção do /admin
```

As imagens em `public/img` (escudos, produtos e fotos de títulos) são ilustrações provisórias. Troque-as pelo painel, enviando as fotos reais.
