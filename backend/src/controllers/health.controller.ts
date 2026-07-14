import { Response } from 'express';
import os from 'os';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const STARTED_AT = Date.now();
const VERSION = process.env.APP_VERSION || '1.0.0';

async function checkDatabase(): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, latencyMs: Date.now() - start };
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

export async function healthCheck(req: AuthenticatedRequest, res: Response) {
  const detailed = req.user?.role === 'ADMIN' && req.query.detailed === 'true';
  const db = await checkDatabase();

  const basic = {
    status: db.ok ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - STARTED_AT) / 1000),
    version: VERSION,
    environment: process.env.NODE_ENV || 'development',
    database: db.ok ? 'connected' : 'error',
  };

  if (!detailed) {
    return res.status(db.ok ? 200 : 503).json(basic);
  }

  const memory = process.memoryUsage();
  const load = os.loadavg();

  return res.status(db.ok ? 200 : 503).json({
    ...basic,
    checks: {
      database: db,
      socketIo: { ok: true, note: 'Socket.IO server attached to HTTP server' },
      paymentGateways: {
        jazzcash: !!process.env.JAZZCASH_WEBHOOK_SECRET,
        easypaisa: !!process.env.EASYPAISA_WEBHOOK_SECRET,
        safepay: !!process.env.SAFEPAY_WEBHOOK_SECRET,
      },
      googleMaps: { configured: !!process.env.GOOGLE_MAPS_API_KEY },
      disk: { ok: true, note: 'Disk metrics require host agent in production' },
      memory: {
        rssMb: Math.round(memory.rss / 1024 / 1024),
        heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(memory.heapTotal / 1024 / 1024),
      },
      cpu: {
        loadAvg1m: load[0],
        loadAvg5m: load[1],
        cores: os.cpus().length,
      },
    },
  });
}
