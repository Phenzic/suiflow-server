# syntax=docker/dockerfile:1
FROM node:20-alpine AS base

WORKDIR /app

# Copy Yarn setup first
COPY .yarn .yarn
COPY .yarnrc.yml package.json yarn.lock ./

# Enable Corepack and install deps
RUN corepack enable && yarn install --immutable

# Copy rest of the source
COPY . .

# Build
RUN yarn build

CMD ["yarn", "start"]