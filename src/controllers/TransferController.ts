import type { Request, Response } from 'express';
import { executeTransfer, getTransactionByDigest, summarizeTransfer, generateAiExplainer } from '../services/suiService';

function parseAmountToBigInt(input: unknown): bigint | null {
  if (typeof input === 'number' && Number.isFinite(input) && input >= 0) {
    return BigInt(Math.trunc(input));
  }
  if (typeof input === 'string' && input.trim() !== '') {
    try {
      const n = BigInt(input);
      if (n >= 0n) return n;
    } catch {}
  }
  return null;
}

export class TransferController {
  public static async simulateTransfer(req: Request, res: Response): Promise<void> {
    const { amount, recipientAddress, senderAddress } = req.body ?? {};
    // Support both JSON keys: "--sui-coin-object-id" and "suiCoinObjectId"
    const suiCoinObjectId: unknown = (req.body?.['--sui-coin-object-id'] ?? req.body?.suiCoinObjectId);

    const amountBig = parseAmountToBigInt(amount);
    if (!amountBig || !recipientAddress || !senderAddress) {
      res.status(400).json({ error: 'amount (u64), recipientAddress, and senderAddress are required' });
      return;
    }
    if (typeof recipientAddress !== 'string' || typeof senderAddress !== 'string') {
      res.status(400).json({ error: 'recipientAddress and senderAddress must be strings' });
      return;
    }
    if (!recipientAddress.startsWith('0x') || !senderAddress.startsWith('0x')) {
      res.status(400).json({ error: 'addresses must start with 0x' });
      return;
    }

    try {
      const submission = await executeTransfer({
        amount: amountBig,
        recipientAddress,
        senderAddress,
        suiCoinObjectId: typeof suiCoinObjectId === 'string' ? suiCoinObjectId : undefined,
      });
      res.json({ ok: true, submission });
    } catch (err) {
      res.status(400).json({ ok: false, error: (err as Error).message });
    }
  }
}

export class TransferQueryController {
  public static async getTransfer(req: Request, res: Response): Promise<void> {
    const { digest, transactionDigest } = req.body ?? {};
    const value = (typeof digest === 'string' ? digest : (typeof transactionDigest === 'string' ? transactionDigest : ''));
    if (!value) {
      res.status(400).json({ error: 'digest is required' });
      return;
    }
    try {
      const full = await getTransactionByDigest(value);
      const summary = summarizeTransfer(full);
      res.json(summary);
    } catch (err) {
      res.status(400).json({ ok: false, error: (err as Error).message });
    }
  }

  public static async getAiDigest(req: Request, res: Response): Promise<void> {
    const { digest, transactionDigest } = req.body ?? {};
    const value = (typeof digest === 'string' ? digest : (typeof transactionDigest === 'string' ? transactionDigest : ''));
    if (!value) {
      res.status(400).json({ error: 'digest is required' });
      return;
    }
    try {
      const full = await getTransactionByDigest(value);
      const summary = summarizeTransfer(full);
      const ai = await generateAiExplainer(summary);
      res.json({ ...summary, ['ai-explainer']: ai ?? '' });
    } catch (err) {
      res.status(400).json({ ok: false, error: (err as Error).message });
    }
  }
}


