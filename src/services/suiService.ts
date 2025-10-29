import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { config } from '../config';
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

export type TransferSummary = {
  digest: string;
  status: 'success' | 'failure';
  sender: string | null;
  transfers: Array<{ recipient: string; amount: string; coinType: string }>; // amount as string (MIST)
  gasUsed?: {
    computationCost?: string;
    storageCost?: string;
    storageRebate?: string;
    nonRefundableStorageFee?: string;
  };
};

export function summarizeTransfer(tx: any): TransferSummary {
  const digest: string = tx.digest ?? '';
  const status: 'success' | 'failure' = tx?.effects?.status?.status === 'success' ? 'success' : 'failure';
  const sender: string | null = tx?.transaction?.data?.sender ?? tx?.input?.sender ?? null;

  const transfers: Array<{ recipient: string; amount: string; coinType: string }> = [];
  const changes: any[] = Array.isArray(tx?.balanceChanges) ? tx.balanceChanges : [];
  for (const ch of changes) {
    const ownerAddr = ch?.owner?.AddressOwner;
    const amountStr = ch?.amount;
    const coinType = ch?.coinType ?? '0x2::sui::SUI';
    if (ownerAddr && amountStr && typeof amountStr === 'string') {
      try {
        const amt = BigInt(amountStr);
        if (amt > 0n) {
          transfers.push({ recipient: ownerAddr, amount: amountStr, coinType });
        }
      } catch {}
    }
  }

  const gasUsed = tx?.effects?.gasUsed;
  return { digest, status, sender, transfers, gasUsed };
}


