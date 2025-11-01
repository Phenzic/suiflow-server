# Suivle – On-Chain Transaction Explainer (Backend)

![Suivle Demo](https://github.com/user-attachments/assets/1c072179-0453-469f-aacc-eafd0f3723ea)

> **Suivle** is an intelligent backend service that connects directly with the Sui blockchain to fetch, parse, and humanize transaction data. It converts raw blockchain responses into readable JSON summaries — including participants, amounts, transaction digests, and gas analytics — ready to be rendered in a user-friendly visual flow.

## 🚀 Features

- **Fetch and parse on-chain transaction data** using Sui SDK
- **Generate humanized summaries** for token transfers and Move calls
- **Output structured JSON responses** optimized for front-end rendering
- **AI-powered explanation engine** (Google GenAI or Ollama)
- **Support for multi-token transactions** and NFT transfers
- **Comprehensive gas analytics** with detailed breakdowns
- **Production-ready API** with health checks and error handling


## 🧠 Example Output

```json
{
  "transactionDigest": "DmH3PWELG2ts4fNVrYcGFTp524Twmvo2CrALVYzqvBaf",
  "status": "success",
  "executedEpoch": "902",
  "summary": "0x4aa0d92f...9072 transferred 0.2 SUI to 0xb6a150da...2511",
  "explainer": "0x4aa0d92f...9072 sent 0.2 SUI to 0xb6a150da...2511",
  "gasUsed": {
    "computationCost": "1,000,000",
    "storageCost": "1,976,000",
    "storageRebate": "978,120",
    "nonRefundableStorageFee": "9,880",
    "totalGasUsed": "2,007,760"
  },
  "participants": {
    "sender": "0x4aa0d92faeda9ec7e24feb2778d65b6898824cc0b54f687e74940ed4b8a59072",
    "recipients": ["0xb6a150da076e313901d39ed773c4f1eb6a2dbef7a14e535dfd5a494915762511"]
  },
  "balanceChanges": [
    {
      "address": "0x4aa0d92f...9072",
      "amount": "-201,997,880",
      "coinType": "SUI"
    },
    {
      "address": "0xb6a150da...2511",
      "amount": "+200,000,000",
      "coinType": "SUI"
    }
  ]
}
```

## 🛠️ Tech Stack

- **Runtime:** Node.js 20+ (TypeScript)
- **Framework:** Express.js
- **Blockchain SDK:** Sui.js (@mysten/sui.js)
- **AI Engine:** Google GenAI (Gemini) / Ollama (Mistral)
- **Package Manager:** Yarn 4.6.0 (Corepack)
- **Deployment:** Fly.io / Render.com


## 🏗️ Project Structure

```
src/
├── app.ts                  # Express app configuration
├── server.ts               # Server bootstrap & startup
├── config/                 # Environment configuration
│   └── index.ts
├── controllers/            # Route handlers (MVC)
│   ├── HomeController.ts
│   └── TransferController.ts
├── routes/                 # Route definitions
│   └── index.ts
├── services/               # Business logic
│   └── suiService.ts       # Sui SDK integration & AI explainer
├── middlewares/            # Express middlewares
│   └── errorHandler.ts
└── utils/                  # Utilities
    └── logger.ts           # Structured logging
```


## 🚀 Getting Started

### Prerequisites

- Node.js 20+ installed
- Yarn 4.6.0 (via Corepack)
- Sui mnemonic phrase (for transaction signing)
- Google API key or Ollama (for AI explainer)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd suivle
   ```

2. **Enable Corepack and prepare Yarn**
   ```bash
   corepack enable
   corepack prepare yarn@4.6.0 --activate
   ```

3. **Install dependencies**
   ```bash
   yarn install
   ```

4. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your values:
   ```env
   PORT=3000
   SUI_NETWORK=testnet
   SUI_MNEMONIC="your 12 or 24 word mnemonic phrase"
   
   # AI Configuration
   AI_PROVIDER=google
   GOOGLE_API_KEY=your_google_api_key
   GOOGLE_MODEL=gemini-2.0-flash
   
   # Optional: Ollama fallback
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=mistral
   OLLAMA_TIMEOUT_MS=20000
   ```

### Development

```bash
# Run with live-reload (nodemon)
yarn dev

# Run with debug logging
yarn dev:debug

# Build for production
yarn build

# Run production build
yarn start

# Type checking
yarn typecheck
```

The server will start on `http://localhost:3000` (or `PORT` env variable).

## 📡 API Endpoints

### Base URL

Replace `<BACKEND_URL>` with your backend server URL in the examples below.

### Endpoints

#### `GET /health`

Health check endpoint.

**Response:**
```json
{ "ok": true }
```


#### `POST /digest`

Retrieve a formatted summary of a Sui transaction by its digest (without AI explainer).

**Request:**
```bash
curl -X POST <BACKEND_URL>/digest \
  -H "Content-Type: application/json" \
  -d '{
    "digest": "DmH3PWELG2ts4fNVrYcGFTp524Twmvo2CrALVYzqvBaf"
  }'
```

**Response:** See [API.md](./API.md) for complete response structure.


#### `POST /ai-digest`

Retrieve transaction summary with AI-generated explanation.

**Request:**
```bash
curl -X POST <BACKEND_URL>/ai-digest \
  -H "Content-Type: application/json" \
  -d '{
    "digest": "DmH3PWELG2ts4fNVrYcGFTp524Twmvo2CrALVYzqvBaf"
  }'
```

**Response:** Same as `/digest` plus:
- `ai-explainer` (string): AI-generated detailed explanation
- `aiExplainerError` (string): Error message if AI generation failed


#### `POST /simulate-transfer`

Execute a SUI token transfer on the Sui testnet.

**Request:**
```bash
curl -X POST <BACKEND_URL>/simulate-transfer \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "1000000",
    "recipientAddress": "0x4aa0d92faeda9ec7e24feb2778d65b6898824cc0b54f687e74940ed4b8a59072",
    "senderAddress": "0xad8ea1c01789781777013d67200898da65c7c3736c612126f4c1afc9c310923e",
    "--sui-coin-object-id": "0xCOIN_OBJECT_ID"
  }'
```

**Note:** Requires `SUI_MNEMONIC` in environment. The `senderAddress` must match the address derived from the mnemonic.


📖 **Full API Documentation:** See [API.md](./API.md) for detailed request/response schemas.


## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | Server port |
| `SUI_NETWORK` | Yes | - | Sui network (`mainnet`, `testnet`, `devnet`) |
| `SUI_MNEMONIC` | Yes | - | Wallet mnemonic (12/24 words) |
| `AI_PROVIDER` | No | `google` | AI provider (`google` or `ollama`) |
| `GOOGLE_API_KEY` | Yes* | - | Google GenAI API key |
| `GOOGLE_MODEL` | No | `gemini-2.0-flash` | Google model name |
| `OLLAMA_BASE_URL` | No | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | No | `mistral` | Ollama model name |
| `LOG_LEVEL` | No | `info` | Logging level (`debug`, `info`, `warn`, `error`) |

*Required if `AI_PROVIDER=google`


## 🐳 Docker Deployment

### Build

```bash
docker build -t suivle:latest .
```

### Run

```bash
docker run -p 3000:3000 \
  -e SUI_NETWORK=testnet \
  -e SUI_MNEMONIC="your mnemonic" \
  -e GOOGLE_API_KEY="your key" \
  suivle:latest
```

### Docker Compose

See `docker-compose.yml` (if available) for full stack deployment.


## 🚢 Deployment

### Fly.io

```bash
flyctl deploy --build-only --push -a suivle-servers
```

### Render.com

Set build command:
```bash
corepack enable && corepack prepare yarn@4.6.0 --activate && yarn install --immutable && yarn build
```

Set start command:
```bash
node dist/server.js
```


## 🧩 Roadmap

- ✅ MVP API for transaction fetching and summarization
- ✅ AI-powered contextual transaction explainer
- 🔄 Expanded support for NFT & multi-asset transactions
- 📋 Historical wallet & analytics tracking
- 📋 Full integration with React Flow front-end
- 📋 Rate limiting and caching
- 📋 GraphQL API endpoint

## 🔗 Related Links

- [Full API Documentation](./API.md)
- [Frontend Repository](#) (link to frontend repo)
- [Sui Documentation](https://docs.sui.io/)
