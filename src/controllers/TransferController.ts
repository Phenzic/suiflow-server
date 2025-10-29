import type { Request, Response } from 'express';
import { simulateTransfer } from '../services/suiService';

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
      const simulation = await simulateTransfer({
        amount: amountBig,
        recipientAddress,
        senderAddress,
      });
      res.json({ ok: true, simulation });
    } catch (err) {
      res.status(400).json({ ok: false, error: (err as Error).message });
    }
  }
}


