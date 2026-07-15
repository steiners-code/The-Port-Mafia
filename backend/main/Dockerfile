FROM oven/bun:latest

WORKDIR /app

ENV NODE_ENV=development

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY ./prisma ./prisma/

RUN bunx prisma generate

COPY . .

EXPOSE 3000

RUN chmod +x start.sh

CMD ["./start.sh"]