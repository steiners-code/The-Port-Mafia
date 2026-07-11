import { importPrivateKey, importPublicKey } from "./keys";
import { jwt } from '@elysiajs/jwt';
import { Elysia, t } from 'elysia';

const rawPublic = await Bun.file('./public.pem').text();
const publicKey = await importPublicKey(rawPublic);

const rawPrivate = await Bun.file('./private.pem').text();
const privateKey = await importPrivateKey(rawPrivate);

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
            exp: '7d',
            schema: t.Object({
                userId: t.String(),
                firstName: t.String(),
                lastName: t.Optional(t.String()),
                email: t.String(),
                refreshed: t.Boolean(),
            })
        })
    )
    .use(
        jwt({
            name: 'sign-jwt',
            secret: privateKey,
            alg: 'RS256',
            exp: '7d',
            schema: t.Object({
                userId: t.String(),
                firstName: t.String(),
                lastName: t.Optional(t.String()),
                email: t.String(),
                refreshed: t.Boolean(),
            })
        })
    );