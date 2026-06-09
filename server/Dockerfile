# Deft Energy Solutions backend — production image.
# Build context is the server/ directory (rootDir on Render; ./server in compose).

FROM node:20-slim AS base
WORKDIR /app
# Prisma needs OpenSSL at runtime.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
# Dummy URL so `prisma generate` can parse the schema at build time; the real
# DATABASE_URL is injected at runtime by the host.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public"

FROM base AS build
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npx prisma generate && npm run build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json
EXPOSE 4000
# On boot: sync schema, (re)apply RLS policies, seed (idempotent), then serve.
CMD ["sh", "-c", "npx prisma db push --skip-generate && npx prisma db execute --file prisma/rls.sql --schema prisma/schema.prisma && node dist/seed.js && node dist/main.js"]
