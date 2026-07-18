FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile --fetch-timeout 300000 --network-concurrency 2

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_LINKEDIN_CLIENT_ID=77detnq5fdbkke

ENV NEXT_PUBLIC_HOME_URL=https://home.markaz.network/
ENV NEXT_PUBLIC_SERVER_URL=http://api-gateway:3000/
ENV NEXT_PUBLIC_FRONTEND_URL=https://mafia.markaz.network/
ENV NEXT_PUBLIC_DEFAULT_REDIRECT_URL=https://mafia.markaz.network/

# ENV NEXT_PUBLIC_HOME_URL=https://home.markaz.network/
# ENV NEXT_PUBLIC_SERVER_URL=http://api-gateway:3000/
# ENV NEXT_PUBLIC_FRONTEND_URL=http://localhost:81/
# ENV NEXT_PUBLIC_DEFAULT_REDIRECT_URL=http://localhost:81/

RUN pnpm run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]