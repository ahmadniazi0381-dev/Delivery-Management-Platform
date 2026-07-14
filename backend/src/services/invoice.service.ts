import { Prisma } from '@prisma/client';
import prisma from '../config/db';

function todayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/**
 * Generates INV-YYYYMMDD-000001 format using a daily DB sequence.
 * Safe across server restarts and concurrent checkouts (transaction + upsert).
 */
export async function generateDailyInvoiceNumber(
  tx: Prisma.TransactionClient = prisma
): Promise<string> {
  const dateKey = todayKey();
  const seq = await tx.invoiceSequence.upsert({
    where: { dateKey },
    update: { seq: { increment: 1 } },
    create: { dateKey, seq: 1 },
  });
  return `INV-${dateKey}-${String(seq.seq).padStart(6, '0')}`;
}
