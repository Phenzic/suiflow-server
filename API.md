# SuiFlow API Documentation

## Transaction Digest Endpoint

### GET Transaction Summary

Retrieve a formatted summary of a Sui transaction by its digest.

Base url: https://suiflow-servers.fly.dev/
Base url2: https://suiflow-server.onrender.com/ 

**Endpoint:** `POST /ai-digest`

**Request:**

```bash
curl -X POST http://localhost:3000/digest \
  -H "Content-Type: application/json" \
  -d '{
    "digest": "DmH3PWELG2ts4fNVrYcGFTp524Twmvo2CrALVYzqvBaf"
  }'
```

**Request Body:**
- `digest` (string, required): The transaction digest hash
- `transactionDigest` (string, optional): Alternative field name (same as `digest`)

**Response Example:**

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
    "recipients": [
      "0xb6a150da076e313901d39ed773c4f1eb6a2dbef7a14e535dfd5a494915762511"
    ]
  },
  "balanceChanges": [
    {
      "address": "0x4aa0d92faeda9ec7e24feb2778d65b6898824cc0b54f687e74940ed4b8a59072",
      "amount": "-201,997,880",
      "coinType": "SUI"
    },
    {
      "address": "0xb6a150da076e313901d39ed773c4f1eb6a2dbef7a14e535dfd5a494915762511",
      "amount": "+200,000,000",
      "coinType": "SUI"
    }
  ],
  "objectChanges": {
    "created": [
      {
        "objectId": "0xc29f282e6a621d53c5b61eb67edf211bf5d059d520ead774bc4d61acb56e0043",
        "type": "0x2::coin::Coin<0x2::sui::SUI>",
        "owner": "0xb6a150da076e313901d39ed773c4f1eb6a2dbef7a14e535dfd5a494915762511"
      }
    ],
    "mutated": [
      {
        "objectId": "0x273202886bcd172ab683dc0545bc055c8e5d38eb2d4cdca5d7a7b96b89df748e",
        "type": "0x2::coin::Coin<0x2::sui::SUI>",
        "owner": "0x4aa0d92faeda9ec7e24feb2778d65b6898824cc0b54f687e74940ed4b8a59072"
      }
    ]
  },
  "moveCall": {
    "package": "0x2",
    "module": "coin",
    "function": "transfer",
    "arguments": [
      "amount: 200,000,000",
      "recipient: 0xb6a150da...2511"
    ]
  }
}
```

**Response Fields:**

- `transactionDigest` (string): The transaction digest hash
- `status` (string): Transaction status - `"success"` or `"failure"`
- `executedEpoch` (string | null): Epoch number when transaction was executed
- `summary` (string | null): Human-readable summary (e.g., "0x123...abc transferred 0.2 SUI to 0x456...def")
- `explainer` (string | null): Simplified explainer text (e.g., "0x123...abc sent 0.2 SUI to 0x456...def")
- `gasUsed` (object): Gas usage breakdown
  - `computationCost` (string): Computation cost in MIST (with commas)
  - `storageCost` (string): Storage cost in MIST
  - `storageRebate` (string): Storage rebate in MIST
  - `nonRefundableStorageFee` (string): Non-refundable storage fee in MIST
  - `totalGasUsed` (string): Total gas used (computation + storage - rebate) in MIST
- `participants` (object): Transaction participants
  - `sender` (string | null): Sender address
  - `recipients` (string[]): Array of recipient addresses
- `balanceChanges` (array): Array of balance changes
  - `address` (string): Wallet address
  - `amount` (string): Signed amount with commas (e.g., "+200,000,000" or "-201,997,880") in MIST
  - `coinType` (string): Coin type (e.g., "SUI")
- `objectChanges` (object): Object changes in the transaction
  - `created` (array): Objects created
    - `objectId` (string): Object ID
    - `type` (string): Object type
    - `owner` (string | null): Owner address
  - `mutated` (array): Objects mutated (same structure as `created`)
- `moveCall` (object | null): Move function call details
  - `package` (string): Package ID
  - `module` (string): Module name
  - `function` (string): Function name
  - `arguments` (array): Function arguments

**Error Response:**

```json
{
  "error": "digest is required"
}
```

**Status Codes:**
- `200`: Success
- `400`: Bad Request (missing or invalid digest)

---

## AI-Enhanced Digest Endpoint

For AI-generated explanations, use the `/ai-digest` endpoint which includes an additional `ai-explainer` field.

**Endpoint:** `POST /ai-digest`

**Request:** Same as `/digest`

**Response:** Same as `/digest` plus:
- `ai-explainer` (string): AI-generated detailed explanation of the transaction
- `aiExplainerError` (string): Error message if AI generation failed (empty string if successful)

**Note:** The AI explainer requires configuration of either Google GenAI or Ollama. If unavailable, `ai-explainer` will be an empty string.

