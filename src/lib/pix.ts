// "Pix copia e cola" (BR Code estático, padrão EMV do Banco Central) a partir de uma chave Pix.
// O valor e o identificador do pedido vão dentro do código, então o app do banco já abre
// com o valor certo e a diretoria reconhece o pagamento pelo número do pedido no extrato.

function tlv(id: string, value: string) {
  return id + String(value.length).padStart(2, "0") + value;
}

/** CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF), exigido no campo 63. */
export function crc16(payload: string) {
  let crc = 0xffff;
  for (const byte of Buffer.from(payload, "utf8")) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** Remove acentos e caracteres fora do padrão (nome e cidade do recebedor). */
function plain(text: string, max: number) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9 .-]/g, "").trim().slice(0, max);
}

/**
 * Normaliza a chave como o banco espera: CPF/CNPJ só com números, telefone com +55,
 * e-mail e chave aleatória como estão.
 */
export function normalizePixKey(raw: string) {
  const key = raw.trim();
  if (!key) return "";
  if (key.includes("@")) return key.toLowerCase();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)) return key.toLowerCase();
  if (key.startsWith("+")) return "+" + key.replace(/\D/g, "");
  const digits = key.replace(/\D/g, "");
  // telefone escrito com DDD entre parênteses, ex.: (21) 99999-0000
  if (/^\(?\d{2}\)?\s*9?\d{4}-?\d{4}$/.test(key) && /[()\s-]/.test(key) && !/\d{3}\.\d{3}/.test(key)) return `+55${digits}`;
  if (digits.length === 11 || digits.length === 14) return digits; // CPF ou CNPJ
  return key;
}

export function isPlausiblePixKey(raw: string) {
  const k = normalizePixKey(raw);
  return (
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(k) || // e-mail
    /^\+55\d{10,11}$/.test(k) || // telefone
    /^\d{11}$/.test(k) || // CPF
    /^\d{14}$/.test(k) || // CNPJ
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(k) // aleatória
  );
}

export function pixCopyPaste(opts: { key: string; amount: number; name: string; city: string; txid: string; description?: string }) {
  const account =
    tlv("00", "br.gov.bcb.pix") +
    tlv("01", normalizePixKey(opts.key)) +
    (opts.description ? tlv("02", plain(opts.description, 40)) : "");
  const txid = opts.txid.replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***";
  const payload =
    tlv("00", "01") +
    tlv("26", account) +
    tlv("52", "0000") +
    tlv("53", "986") +
    (opts.amount > 0 ? tlv("54", opts.amount.toFixed(2)) : "") +
    tlv("58", "BR") +
    tlv("59", plain(opts.name, 25) || "ATLETICA CEFET RJ") +
    tlv("60", plain(opts.city, 15) || "RIO DE JANEIRO") +
    tlv("62", tlv("05", txid)) +
    "6304";
  return payload + crc16(payload);
}
