# ---- build ----
FROM node:20-alpine AS build
# Force IPv4 first so Node doesn't die on IPv6-only resolution
ENV NODE_OPTIONS=--dns-result-order=ipv4first

WORKDIR /app

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