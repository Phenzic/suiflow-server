# syntax=docker/dockerfile:1
FROM node:20-alpine AS base

# Enable corepack (Yarn 4) and set workdir
RUN corepack enable
WORKDIR /app

# Install deps in a separate layer
FROM base AS deps
COPY package.json yarn.lock ./
# Respect Yarn version from package.json: "packageManager"
RUN yarn install --immutable

# Build the app
FROM deps AS build
COPY tsconfig.json ./
COPY src ./src
RUN yarn build

# Runtime image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./package.json
COPY dist ./dist

EXPOSE 3000
CMD ["node", "dist/server.js"]


