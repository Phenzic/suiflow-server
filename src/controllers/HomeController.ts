import type { Request, Response } from 'express';

export class HomeController {
  public static index(_req: Request, res: Response): void {
    res.json({ status: 'ok' });
  }
}


