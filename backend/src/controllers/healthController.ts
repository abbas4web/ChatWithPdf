import { Request, Response } from 'express';
import { testConnection } from '../db/pool';

export const getHealth = async (_req: Request, res: Response): Promise<void> => {
  let dbStatus: 'ok' | 'error' = 'ok';
  let dbMessage = 'Connected';

  try {
    await testConnection();
  } catch (err: unknown) {
    dbStatus = 'error';
    if (err instanceof Error) {
      // pg errors carry a `code` property (e.g. ECONNREFUSED, 28P01)
      const pgErr = err as Error & { code?: string };
      dbMessage = err.message || pgErr.code || 'Connection failed';
    } else {
      dbMessage = 'Connection failed';
    }
  }

  const httpStatus = dbStatus === 'ok' ? 200 : 503;

  res.status(httpStatus).json({
    status: dbStatus === 'ok' ? 'ok' : 'degraded',
    api: 'ok',
    db: { status: dbStatus, message: dbMessage },
    timestamp: new Date().toISOString(),
  });
};
