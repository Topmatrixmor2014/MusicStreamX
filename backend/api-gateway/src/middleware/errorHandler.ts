import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function errorHandler(err: Error & { statusCode?: number }, _req: Request, res: Response, _next: NextFunction): void {
  logger.error(err.message, { stack: err.stack });
  const status = err.statusCode ?? 500;
  res.status(status).json({ error: err.message });
}
