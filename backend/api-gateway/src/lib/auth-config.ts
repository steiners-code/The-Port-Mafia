import { importPublicKey } from "./keys";
import { jwt } from '@elysiajs/jwt';
import { Elysia, t } from 'elysia';

if (!process.env.JWT_PUBLIC_KEY) {
    throw new Error("FATAL: JWT cryptographic keys are missing from environment variables!");
}

// Import them directly on startup
const publicKey = await importPublicKey(process.env.JWT_PUBLIC_KEY);

// auth-config.ts reads the public key for decoding, 
// gets the cryptographic publicKey and uses @elysiajs/jwt
// for defining JWT verification schema name as 'jwt'
// the configuration is then returned as "authConfig"

export const authConfig = new Elysia({ name: 'auth-config' })
    .use(
        jwt({
            name: 'jwt',
            secret: publicKey,
            alg: 'RS256',
            exp: '15m',
            schema: t.Object({
                userId: t.String(),
                firstName: t.String(),
                lastName: t.Optional(t.String()),
                email: t.String(),
                auth_time: t.Date(),
            })
        })
    )