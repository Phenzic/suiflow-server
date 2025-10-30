import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 3000),
  suiNetwork: process.env.SUI_NETWORK ?? 'mainnet',
  suiMnemonic: process.env.SUI_MNEMONIC ?? '',
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
  ollamaModel: process.env.OLLAMA_MODEL ?? 'mistral',
  ollamaTimeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS ?? 20000),
};


