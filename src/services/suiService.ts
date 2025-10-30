import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { config } from '../config';
import { GoogleGenAI } from '@google/genai';
import { normalizeSuiAddress, isValidSuiObjectId } from '@mysten/sui.js/utils';

export type SimulateTransferParams = {
  amount: bigint;
  recipientAddress: string;
  senderAddress: string;
  suiCoinObjectId?: string;
};

export function createSuiClient(): SuiClient {
  return new SuiClient({ url: getFullnodeUrl(config.suiNetwork as 'mainnet' | 'testnet' | 'devnet') });
}

export function getKeypairFromEnv(): Ed25519Keypair {
  if (!config.suiMnemonic) {
    throw new Error('SUI_MNEMONIC is not set');
  }
  // Ed25519Keypair.deriveKeypair derives from a BIP-39 mnemonic using the default path
  // If a different derivation path is needed, extend this function accordingly.
  return Ed25519Keypair.deriveKeypair(config.suiMnemonic);
}

export async function buildTransferTx(params: SimulateTransferParams): Promise<TransactionBlock> {
  const { amount, recipientAddress, senderAddress, suiCoinObjectId } = params;
  const tx = new TransactionBlock();
  tx.setSender(senderAddress);
  // Split from provided SUI coin, or fallback to gas coin
  const coinSource = suiCoinObjectId && isValidSuiObjectId(suiCoinObjectId)
    ? tx.object(suiCoinObjectId)
    : tx.gas;
  const coin = tx.splitCoins(coinSource, [tx.pure(amount)]);
  tx.transferObjects([coin], tx.pure(recipientAddress));
  tx.setGasBudget(100_000_000);
  return tx;
}

export async function simulateTransfer(params: SimulateTransferParams) {
  const client = createSuiClient();
  const keypair = getKeypairFromEnv();

  const derived = normalizeSuiAddress(keypair.getPublicKey().toSuiAddress());
  const provided = normalizeSuiAddress(params.senderAddress);
  if (derived !== provided) {
    throw new Error(`Sender address does not match derived keypair address (provided=${provided}, derived=${derived})`);
  }

  const tx = await buildTransferTx(params);
  const bytes = await tx.build({ client });

  // Simulate without broadcasting
  const result = await client.dryRunTransactionBlock({ transactionBlock: bytes });
  return result;
}

export async function executeTransfer(params: SimulateTransferParams) {
  const client = createSuiClient();
  const keypair = getKeypairFromEnv();

  const derived = normalizeSuiAddress(keypair.getPublicKey().toSuiAddress());
  const provided = normalizeSuiAddress(params.senderAddress);
  if (derived !== provided) {
    throw new Error(`Sender address does not match derived keypair address (provided=${provided}, derived=${derived})`);
  }

  const tx = await buildTransferTx(params);

  // Prefer signAndExecute; it's available in current @mysten/sui.js
  const result = await client.signAndExecuteTransactionBlock({
    transactionBlock: tx,
    signer: keypair,
    options: {
      showInput: true,
      showEffects: true,
      showEvents: true,
      showObjectChanges: true,
      showBalanceChanges: true,
    },
    requestType: 'WaitForLocalExecution',
  });

  return result;
}

export async function getTransactionByDigest(digest: string) {
  const client = createSuiClient();
  const result = await client.getTransactionBlock({
    digest,
    options: {
      showInput: true,
      showEffects: true,
      showEvents: true,
      showObjectChanges: true,
      showBalanceChanges: true,
    },
  });
  return result;
}

export type FrontendTxSummary = {
  transactionDigest: string;
  status: 'success' | 'failure';
  executedEpoch: string | undefined;
  summary: string | null;
  explainer: string | null;
  gasUsed: {
    computationCost: string;
    storageCost: string;
    storageRebate: string;
    nonRefundableStorageFee: string;
    totalGasUsed: string;
  };
  participants: {
    sender: string | null;
    recipients: string[];
  };
  balanceChanges: Array<{
    address: string;
    amount: string; // signed with commas, in MIST
    coinType: string; // simplified, e.g. SUI
  }>;
  objectChanges: {
    created: Array<{ objectId: string; type: string; owner: string | null }>;
    mutated: Array<{ objectId: string; type: string; owner: string | null }>;
  };
  moveCall: {
    package: string;
    module: string;
    function: string;
    arguments: string[];
  } | null;
};

function formatWithCommas(absStr: string): string {
  // absStr should be non-negative integer string
  const n = absStr;
  const re = /\B(?=(\d{3})+(?!\d))/g;
  return n.replace(re, ',');
}

function formatSignedWithCommas(valueStr: string): string {
  const trimmed = valueStr.trim();
  const sign = trimmed.startsWith('-') ? '-' : '+';
  const abs = trimmed.replace(/^[-+]/, '');
  return `${sign}${formatWithCommas(abs)}`;
}

function bigIntSum(parts: Array<string | undefined>): bigint {
  let total = 0n;
  for (const p of parts) {
    if (typeof p === 'string' && p) {
      total += BigInt(p);
    }
  }
  return total;
}

function bigIntSub(a?: string, b?: string): bigint {
  const A = typeof a === 'string' && a ? BigInt(a) : 0n;
  const B = typeof b === 'string' && b ? BigInt(b) : 0n;
  return A - B;
}

function simplifyCoinType(coinType?: string): string {
  if (!coinType) return 'SUI';
  if (coinType.includes('::sui::SUI')) return 'SUI';
  return coinType;
}

function shortAddress(addr: string | null | undefined): string | null {
  if (!addr) return null;
  const a = addr.toString();
  if (a.length <= 14) return a;
  return `${a.slice(0, 10)}...${a.slice(-4)}`;
}

function mistToSuiDecimal(mist: bigint): string {
  const divisor = 1_000_000_000n;
  const negative = mist < 0n;
  const abs = negative ? -mist : mist;
  const whole = abs / divisor;
  const frac = abs % divisor;
  const fracStr = frac.toString().padStart(9, '0').replace(/0+$/, '');
  const base = fracStr.length ? `${whole.toString()}.${fracStr}` : `${whole.toString()}`;
  return negative ? `-${base}` : base;
}

export function summarizeTransfer(tx: any): FrontendTxSummary {
  const digest: string = tx?.digest ?? '';
  const status: 'success' | 'failure' = tx?.effects?.status?.status === 'success' ? 'success' : 'failure';
  const executedEpoch: string | undefined = tx?.effects?.executedEpoch;
  const sender: string | null = tx?.input?.sender ?? tx?.transaction?.data?.sender ?? null;

  // Balance changes and recipients
  const balanceChangesArr: any[] = Array.isArray(tx?.balanceChanges) ? tx.balanceChanges : [];
  const recipientsSet = new Set<string>();
  const balanceChanges = balanceChangesArr.map((ch) => {
    const addr: string = ch?.owner?.AddressOwner ?? '';
    const amountStr: string = typeof ch?.amount === 'string' ? ch.amount : '0';
    const coinType = simplifyCoinType(ch?.coinType);
    try {
      const amt = BigInt(amountStr);
      if (amt > 0n) recipientsSet.add(addr);
    } catch {}
    return {
      address: addr,
      amount: formatSignedWithCommas(amountStr),
      coinType,
    };
  });
  const recipients = Array.from(recipientsSet);

  // Total received SUI for summary (first positive SUI change)
  let receivedMist = 0n;
  for (const ch of balanceChangesArr) {
    const coinType = ch?.coinType;
    if (coinType && coinType.includes('::sui::SUI') && typeof ch?.amount === 'string') {
      try {
        const amt = BigInt(ch.amount);
        if (amt > 0n) {
          receivedMist += amt;
        }
      } catch {}
    }
  }

  const amountSui = mistToSuiDecimal(receivedMist);
  const summary = sender && recipients.length > 0
    ? `${shortAddress(sender)} transferred ${amountSui} SUI to ${shortAddress(recipients[0])}`
    : null;

  // Object changes (declared here so they are available for explainer below)
  const objectChangesArr: any[] = Array.isArray(tx?.objectChanges) ? tx.objectChanges : [];
  const created = objectChangesArr
    .filter((o) => o?.type === 'created')
    .map((o) => ({
      objectId: o?.objectId,
      type: o?.objectType,
      owner: o?.owner?.AddressOwner ?? null,
    }));
  const mutated = objectChangesArr
    .filter((o) => o?.type === 'mutated')
    .map((o) => ({
      objectId: o?.objectId,
      type: o?.objectType,
      owner: o?.owner?.AddressOwner ?? null,
    }));

  // Explainer (static template for now)
  function coinTypeSymbol(coinTypeRaw?: string): string {
    if (!coinTypeRaw) return 'SUI';
    if (coinTypeRaw.includes('::sui::SUI')) return 'SUI';
    const m = /Coin<([^>]+)>/.exec(coinTypeRaw);
    const inner = m ? m[1] : coinTypeRaw;
    const parts = inner.split('::');
    return parts[parts.length - 1] || inner;
  }

  let explainer: string | null = null;
  const firstPositive = balanceChangesArr.find((ch) => {
    try { return BigInt(ch?.amount ?? '0') > 0n; } catch { return false; }
  });
  const anyNonCoinObject = objectChangesArr?.some?.((o) => typeof o?.objectType === 'string' && !o.objectType.includes('::coin::Coin<'));
  if (anyNonCoinObject) {
    // NFT-like transfer template
    const target = created[0] || mutated[0];
    const nftType = target?.type || 'Object';
    const recv = target?.owner || recipients[0] || null;
    explainer = sender && recv
      ? `${shortAddress(sender)} transferred NFT (${nftType}) to ${shortAddress(recv)}`
      : null;
  } else if (firstPositive) {
    const sym = coinTypeSymbol(firstPositive?.coinType);
    const amtRaw = typeof firstPositive?.amount === 'string' ? firstPositive.amount.replace(/^\+/, '') : '0';
    let amtPretty = formatWithCommas(amtRaw);
    if (sym === 'SUI') {
      try { amtPretty = mistToSuiDecimal(BigInt(amtRaw)); } catch {}
    }
    explainer = sender && recipients.length > 0
      ? `${shortAddress(sender)} sent ${amtPretty} ${sym} to ${shortAddress(recipients[0])}`
      : null;
  } else {
    explainer = summary; // fallback
  }

  // Gas used and total
  const gu = tx?.effects?.gasUsed ?? {};
  const computationCost = typeof gu?.computationCost === 'string' ? gu.computationCost : '0';
  const storageCost = typeof gu?.storageCost === 'string' ? gu.storageCost : '0';
  const storageRebate = typeof gu?.storageRebate === 'string' ? gu.storageRebate : '0';
  const nonRefundableStorageFee = typeof gu?.nonRefundableStorageFee === 'string' ? gu.nonRefundableStorageFee : '0';
  const totalGasUsedBi = bigIntSum([computationCost, storageCost, nonRefundableStorageFee]) - BigInt(storageRebate);

  const gasUsed = {
    computationCost: formatWithCommas(computationCost),
    storageCost: formatWithCommas(storageCost),
    storageRebate: formatWithCommas(storageRebate),
    nonRefundableStorageFee: formatWithCommas(nonRefundableStorageFee),
    totalGasUsed: formatWithCommas(totalGasUsedBi.toString()),
  };

  // Move call (heuristic for SUI transfers)
  const moveCall = recipients.length > 0 && receivedMist > 0n
    ? {
        package: '0x2',
        module: 'coin',
        function: 'transfer',
        arguments: [
          `amount: ${formatWithCommas(receivedMist.toString())}`,
          `recipient: ${shortAddress(recipients[0])}`,
        ],
      }
    : null;

  return {
    transactionDigest: digest,
    status,
    executedEpoch,
    summary,
    explainer,
    gasUsed,
    participants: { sender, recipients },
    balanceChanges,
    objectChanges: { created, mutated },
    moveCall,
  };
}

const BASE_TEMPLATE = `\n This Sui transaction is a transfer of 0.2 SUI (Sui token) from the sender \naddress \n"0x4aa0d92faeda9ec7e24feb2778d65b6898824cc0b54f687e74940ed4b8a59072" to \nthe recipient address \n"0xb6a150da076e313901d39ed773c4f1eb6a2dbef7a14e535dfd5a494915762511".\n\nThe transaction was executed in epoch 902 and cost a total of 2,007,760 \ngas units. The gas cost breakdown is as follows:\n- Computation cost: 1,000,000\n- Storage cost: 1,976,000\n- Storage rebate: 978,120\n- Non-refundable storage fee: 9,880\n\nThe sender's balance decreased by 201,997,880 SUI, and the recipient's \nbalance increased by 200,000,000 SUI. Additionally, a new coin object with \nID "0xc29f282e6a621d53c5b61eb67edf211bf5d059d520ead774bc4d61acb56e0043" \nwas created, and another coin object with ID \n"0x273202886bcd172ab683dc0545bc055c8e5d38eb2d4cdca5d7a7b96b89df748e" was \nmutated.\n\nThe transaction invokes the "transfer" function from the "coin" module of \npackage "0x2". The arguments passed to this function are "amount: \n200,000,000" and "recipient: 0xb6a150da...2511". This function is used to \ntransfer SUI tokens between addresses.\n`;

function buildExplainerPrompt(summary: FrontendTxSummary): string {
  return [
    'You are an AI explainer and your job is to briefly explain a transaction based on the transaction digest given to you from the Sui network.',
    'Follow this template for your response:',
    BASE_TEMPLATE,
    'Now explain this Sui transaction:',
    JSON.stringify(summary, null, 2)
  ].join('\n\n');
}

async function generateAiExplainerOllama(summary: FrontendTxSummary): Promise<string> {
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), config.ollamaTimeoutMs);
  try {
    const prompt = buildExplainerPrompt(summary);
    const res = await fetch(`${config.ollamaBaseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: config.ollamaModel, prompt, stream: false }),
      signal: controller.signal,
    } as any);
    clearTimeout(to);
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Ollama error ${res.status}: ${txt}`);
    }
    const data = await res.json();
    const text: string | undefined = (data && (data.response as string)) || undefined;
    if (!text) throw new Error('Ollama returned empty response');
    return text;
  } catch (e) {
    clearTimeout(to);
    throw e instanceof Error ? e : new Error('AI explainer failed');
  }
}

async function generateAiExplainerGoogle(summary: FrontendTxSummary): Promise<string> {
  if (!config.googleApiKey) throw new Error('GOOGLE_API_KEY not set');
  const ai = new GoogleGenAI({ apiKey: config.googleApiKey, httpOptions: { apiVersion: 'v1alpha' } as any } as any);
  const prompt = buildExplainerPrompt(summary);
  const resp: any = await ai.models.generateContent({ model: config.googleModel, contents: prompt } as any);
  const text: string | undefined = (resp && (resp.text as string)) || (resp?.response?.text as string);
  if (!text) throw new Error('GoogleGenAI returned empty response');
  return text;
}

export async function generateAiExplainer(summary: FrontendTxSummary): Promise<string> {
  if (config.aiProvider === 'google') {
    return await generateAiExplainerGoogle(summary);
  }
  return await generateAiExplainerOllama(summary);
}



