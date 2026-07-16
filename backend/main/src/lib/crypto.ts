import { createHash, randomBytes } from 'crypto';

export function createOpaqueRefreshToken() {
    const rawToken = randomBytes(40).toString('hex');
    const hash = createHash('sha256').update(rawToken).digest('hex');

    return { rawToken, hash };
}