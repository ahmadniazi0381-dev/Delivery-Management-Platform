import { Request } from 'express';
import prisma from '../config/db';
import { LogSeverity } from '@prisma/client';

type LogInput = {
  severity?: LogSeverity;
  module: string;
  message: string;
  stack?: string;
  requestId?: string;
  userId?: string;
  ip?: string;
  device?: string;
  details?: Record<string, unknown>;
  req?: Request;
};

export async function logSystemEvent(input: LogInput): Promise<void> {
  try {
    const userAgent = input.req?.headers['user-agent']?.toString();
    await prisma.systemLog.create({
      data: {
        severity: input.severity || 'ERROR',
        module: input.module,
        message: input.message,
        stack: input.stack || null,
        requestId: input.requestId || null,
        userId: input.userId || null,
        ip: input.ip || input.req?.ip || null,
        device: input.device || (userAgent?.includes('mobile') ? 'mobile' : 'web'),
        details: input.details ? JSON.stringify(input.details) : null,
      },
    });
  } catch (error) {
    console.error('[SYSTEM LOG] Failed to persist log:', error);
  }
}
