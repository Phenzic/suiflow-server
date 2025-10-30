# ===== Base image =====
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json yarn.lock ./
RUN corepack enable && yarn install --immutable

# ===== Build stage =====
FROM base AS build
COPY . .
RUN yarn build

# ===== Runtime stage =====
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY package.json ./
RUN corepack enable && yarn install --production --immutable
CMD ["node", "dist/server.js"]