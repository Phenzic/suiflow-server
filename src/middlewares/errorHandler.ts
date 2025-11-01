import type { ErrorRequestHandler, Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
};

export const jsonErrorHandler: ErrorRequestHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  // Handle JSON parsing errors
  if (err instanceof SyntaxError && 'body' in err && (err as any).type === 'entity.parse.failed') {
    logger.error('JSON Parse Error:', err);
    const bodyPreview = typeof (err as any).body === 'string' ? (err as any).body.slice(0, 200) : 'invalid JSON';
    return res.status(400).json({
      error: 'Invalid JSON in request body',
      details: 'Check for trailing commas, missing quotes, or invalid JSON syntax',
      hint: bodyPreview.includes('},') ? 'Trailing comma detected. Remove comma before closing brace.' : undefined,
      received: bodyPreview,
    });
  }
  next(err);
};

export const errorHandler: ErrorRequestHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(err);
  
  // If it's already a handled error with status code, use it
  if (err && typeof err === 'object' && 'statusCode' in err && typeof (err as any).statusCode === 'number') {
    const statusCode = (err as any).statusCode;
    const message = (err as any).message || 'Error';
    return res.status(statusCode).json({ error: message });
  }
  
  res.status(500).json({ error: 'Internal Server Error' });
};


