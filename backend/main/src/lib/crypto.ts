import { createHash, randomBytes } from 'crypto';

export function createOpaqueRefreshToken() {
    const rawToken = randomBytes(40).toString('hex');
    const hash = createHash('sha256').update(rawToken).digest('hex');

    return { rawToken, hash };
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

    const incomingHash = createHash('sha256').update(secret).digest();
    const expectedHash = createHash('sha256').update(CRON_API_SECRET).digest();

    return crypto.timingSafeEqual(incomingHash, expectedHash);
}