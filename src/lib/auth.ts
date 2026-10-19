// Sessão do painel: cookie "exp.assinatura" assinado com HMAC-SHA256 (ADMIN_SECRET).
// Usa Web Crypto para funcionar tanto no middleware (edge) quanto nas rotas Node.

export const SESSION_COOKIE = "lobo_admin";
export const SESSION_HOURS = 12;

function secret() {
  const s = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD;
  if (!s) throw new Error("Defina ADMIN_PASSWORD (e ADMIN_SECRET) no .env");
  return s;
}

export async function hmacHex(message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken() {
  const exp = String(Date.now() + SESSION_HOURS * 3_600_000);
  return `${exp}.${await hmacHex(exp)}`;
}

export async function verifySessionToken(token: string | undefined) {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  try {
    return safeEqual(sig, await hmacHex(exp));
  } catch {
    return false;
  }
}

export async function checkPassword(input: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  // compara os HMACs para não vazar o tamanho da senha pelo tempo de resposta
  return safeEqual(await hmacHex(`pw:${input}`), await hmacHex(`pw:${expected}`));
}
