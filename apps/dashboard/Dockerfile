# ---- build ----
FROM node:20-alpine AS build
# Force IPv4 first so Node doesn't die on IPv6-only resolution
ENV NODE_OPTIONS=--dns-result-order=ipv4first

WORKDIR /app

ARG DATABASE_URL
ARG RESEND_API_KEY
ARG UPSTASH_REDIS_REST_URL
ARG UPSTASH_REDIS_REST_TOKEN
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG CLICKHOUSE_URL
ARG CLICKHOUSE_DATABASE
ARG CLICKHOUSE_USER_NAME
ARG CLICKHOUSE_PASSWORD

# expose them to `npm run build`
ENV DATABASE_URL=$DATABASE_URL \
    RESEND_API_KEY=$RESEND_API_KEY \
    UPSTASH_REDIS_REST_URL=$UPSTASH_REDIS_REST_URL \
    UPSTASH_REDIS_REST_TOKEN=$UPSTASH_REDIS_REST_TOKEN \
    NEXTAUTH_URL=$NEXTAUTH_URL \
    NEXTAUTH_SECRET=$NEXTAUTH_SECRET \
    GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID \
    GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET \
    CLICKHOUSE_URL=$CLICKHOUSE_URL \
    CLICKHOUSE_DATABASE=$CLICKHOUSE_DATABASE \
    CLICKHOUSE_USER_NAME=$CLICKHOUSE_USER_NAME \
    CLICKHOUSE_PASSWORD=$CLICKHOUSE_PASSWORD

# install deps
COPY package.json ./
RUN npm install

# copy config + sources
COPY next.config.ts tsconfig.json ./
COPY src ./src
COPY public ./public

# copy drizzle config & migrations into build stage so they can be included later
COPY drizzle.config.ts ./drizzle.config.ts

# build Next.js (produces .next/standalone)
RUN npm run build

# ---- run ----
FROM node:20-alpine AS run
ENV NODE_ENV=production

ENV NODE_OPTIONS=--dns-result-order=ipv4first

WORKDIR /app

# copy the standalone server (includes server.js and node_modules needed)
COPY --from=build /app/.next/standalone ./
# static assets
COPY --from=build /app/.next/static ./.next/static
# public assets
COPY --from=build /app/public ./public
# copy drizzle config + migrations into runtime image
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts

EXPOSE 3000
ENV PORT=3000
CMD ["node","server.js"]