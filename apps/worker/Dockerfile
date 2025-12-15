# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json ./
RUN npm install

COPY tsconfig.json ./tsconfig.json
COPY src ./src

RUN npm run build

# ---- run ----
FROM node:20-alpine AS run
ENV NODE_ENV=production
WORKDIR /app

COPY package.json ./

# Reuse the already-installed dependencies from build stage
COPY --from=build /app/node_modules ./node_modules

# Copy built output
COPY --from=build /app/dist ./dist

EXPOSE 3002
CMD ["node", "dist/index.js"]
