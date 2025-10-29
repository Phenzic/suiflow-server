import type { ErrorRequestHandler, Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
};

export const errorHandler: ErrorRequestHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
};


