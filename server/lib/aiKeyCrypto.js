import crypto from 'node:crypto';

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

const getEncryptionKey = () => {
  const secret = String(process.env.AI_KEYS_ENCRYPTION_SECRET || '').trim();
  if (!secret) {
    throw new Error('AI_KEYS_ENCRYPTION_SECRET is not configured.');
  }

  return crypto.createHash('sha256').update(secret).digest();
};

export const encryptApiKey = (value) => {
  const plainText = String(value || '').trim();
  if (!plainText) {
    throw new Error('API key is required.');
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join(':');
};

export const decryptApiKey = (value) => {
  const payload = String(value || '').trim();
  if (!payload) {
    return '';
  }

  const [ivValue, authTagValue, encryptedValue] = payload.split(':');
  if (!ivValue || !authTagValue || !encryptedValue) {
    throw new Error('Encrypted API key payload is invalid.');
  }

  const decipher = crypto.createDecipheriv(
    ENCRYPTION_ALGORITHM,
    getEncryptionKey(),
    Buffer.from(ivValue, 'base64'),
  );

  decipher.setAuthTag(Buffer.from(authTagValue, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, 'base64')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
};

export default {
  decryptApiKey,
  encryptApiKey,
};
