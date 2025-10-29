# suiflow

## Setup

This project uses Yarn, TypeScript, and Express.

1. Ensure you have Node.js installed.
2. Install dependencies:

```bash
yarn install
```

## Scripts

- `yarn dev`: Run the server with live-reload via `nodemon`
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

## Environment

Copy `env.example` to `.env` and set values:

```
SUI_NETWORK=testnet
SUI_MNEMONIC="word1 word2 ..."
```

## API

- POST `/simulate-transfer`
  - Body JSON:
    - `amount` (u64, in MIST)
    - `recipientAddress` (string, 0x...)
    - `senderAddress` (string, 0x...)
    - `--sui-coin-object-id` (string, optional; specific SUI coin object to spend)
  - Returns: on-chain submission result from Sui testnet (signed and executed).


- POST `/digest`
  - Body JSON:
    - `digest` (string) or `transactionDigest` (string)
  - Returns JSON summary with:
    - `sender`, `transfers` (array of `{ recipient, amount, coinType }`), `status`, `digest`, `gasUsed`, `summary`, `explainer`, `objectChanges`, `moveCall`



- Simulate Transfer Endpoint


```
curl -X POST http://localhost:3000/simulate-transfer   -H "Content-Type: application/json"   -d '{
    "amount": "1000000",
    "recipientAddress": "0x4aa0d92faeda9ec7e24feb2778d65b6898824cc0b54f687e74940ed4b8a59072",
    "senderAddress": "0xad8ea1c01789781777013d67200898da65c7c3736c612126f4c1afc9c310923e"
  }'
```