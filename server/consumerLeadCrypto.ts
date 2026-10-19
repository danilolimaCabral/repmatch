import crypto from "node:crypto";

const VERSION = "v1";

function encryptionKey() {
  const source = process.env.CONSUMER_LEAD_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!source) throw new Error("Chave de cifragem da base B2C não configurada.");
  return crypto.createHash("sha256").update(source).digest();
}

export function encryptConsumerLeadValue(value: string | null) {
  if (value === null) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${VERSION}:${iv.toString("base64url")}:${tag.toString("base64url")}:${encrypted.toString("base64url")}`;
}

export function decryptConsumerLeadValue(value: string | null) {
  if (value === null) return null;
  const [version, ivText, tagText, encryptedText] = value.split(":");
  if (version !== VERSION || !ivText || !tagText || !encryptedText) return value;
  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivText, "base64url"));
    decipher.setAuthTag(Buffer.from(tagText, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(encryptedText, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    throw new Error("Não foi possível ler um contato B2C protegido.");
  }
}
