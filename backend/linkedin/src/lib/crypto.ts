import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard 96-bit IV for GCM

/**
 * Derives a secure, consistent 32-byte (256-bit) key from your environment variable.
 * This guarantees that even if your ENCRYPTION_KEY is short, it is hashed into a secure length.
 */
const getEncryptionKey = (): Buffer => {
    const secret = process.env.ENCRYPTION_KEY;
    if (!secret) {
        throw new Error('ENCRYPTION_KEY is not defined in your environment variables!');
    }
    return crypto.createHash('sha256').update(secret).digest();
};

/**
 * Encrypts a string using AES-256-GCM.
 * Returns a single string formatted as "iv:authTag:encryptedText" for easy database storage.
 */
export function encrypt(text: string): string {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a compound "iv:authTag:encryptedText" string back to plaintext.
 */
export function decrypt(encryptedData: string): string {
    const key = getEncryptionKey();
    const parts = encryptedData.split(':');

    if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format. Expected "iv:authTag:ciphertext".');
    }

    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

/**
 * Securely compares an incoming secret against an expected system secret.
 * Defends against timing attacks by hashing both inputs and performing a constant-time comparison.
 */
export function verifySystemSecret(secret: string | undefined | null): boolean {
    const CRON_API_SECRET = process.env.CRON_API_SECRET;

    if (!secret || !CRON_API_SECRET) {
        return false;
    }

    const incomingHash = crypto.createHash('sha256').update(secret).digest();
    const expectedHash = crypto.createHash('sha256').update(CRON_API_SECRET).digest();

    return crypto.timingSafeEqual(incomingHash, expectedHash);
}