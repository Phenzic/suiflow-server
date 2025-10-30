# syntax=docker/dockerfile:1
FROM node:20-alpine AS base

WORKDIR /app

# Copy Yarn and project config first
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn .yarn
COPY .yarn/releases .yarn/releases

# Install dependencies
RUN corepack enable && yarn install --immutable

# Copy rest of the application
COPY . .

# Build your app
RUN yarn build

CMD ["yarn", "start"]