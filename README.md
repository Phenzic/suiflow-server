# suiflow

## Setup

This project uses Yarn, TypeScript, and Express.

1. Ensure you have Node.js installed.
2. Install dependencies:

```bash
yarn install
```

## Scripts

- `yarn dev`: Run the server in watch mode with TypeScript via `tsx`
- `yarn build`: Compile TypeScript to `dist`
- `yarn start`: Run compiled server from `dist`
- `yarn typecheck`: Type-check without emitting

## Run the server (dev)

```bash
yarn dev
```

## Build and run (prod)

```bash
yarn build
yarn start
```

Optionally specify a port:

```bash
PORT=4000 yarn dev
```

Then visit `http://localhost:3000` (or your chosen port).

## Project structure (MVC)

```
src/
  app.ts               # Express app config and middleware
  server.ts            # Server bootstrap
  config/              # App configuration
  controllers/         # Route handlers (controllers)
  routes/              # Route definitions
  models/              # Data models/entities
  services/            # Business logic
  middlewares/         # Express middlewares
  utils/               # Utilities (e.g., logger)
```
