import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGO = 'aes-256-gcm';
const KEY_ENV = 'INTEGRATION_ENCRYPTION_KEY';

function getKey(): Buffer | null {
  const secret = process.env[KEY_ENV];
  if (!secret) return null;
  return scryptSync(secret, 'adsstarter-salt', 32);
}

export function encryptToken(plain: string): string {
  const key = getKey();
  if (!key) return plain;

  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptToken(stored: string): string {
  if (!stored.startsWith('enc:')) return stored;

  const key = getKey();
  if (!key) throw new Error('INTEGRATION_ENCRYPTION_KEY required to decrypt tokens');

  const [, ivHex, tagHex, dataHex] = stored.split(':');
  const decipher = createDecipheriv(ALGO, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}
