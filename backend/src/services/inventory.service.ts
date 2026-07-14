import { Prisma } from '@prisma/client';
import prisma from '../config/db';
import { logAudit } from './audit.service';

type CartLine = { menuItemId: string; quantity: number };

type LockedMenuItem = {
  id: string;
  name: string;
  stockQuantity: number | null;
  inStock: boolean;
  isAvailable: boolean;
  categoryIsActive: boolean;
};

/**
 * Reserve inventory inside an open DB transaction.
 * Uses SELECT ... FOR UPDATE to serialize concurrent reservations on the same item.
 * Two users reserving the last unit: second transaction blocks until first commits,
 * then re-reads availability and rejects if stock is gone.
 */
export async function validateAndReserveInventory(
  tx: Prisma.TransactionClient,
  checkoutSessionId: string,
  items: CartLine[]
): Promise<void> {
  for (const item of items) {
    const lockedRows = await tx.$queryRaw<LockedMenuItem[]>`
      SELECT
        m.id,
        m.name,
        m.stockQuantity,
        m.inStock,
        m.isAvailable,
        c.isActive AS categoryIsActive
      FROM menu_items m
      INNER JOIN categories c ON c.id = m.categoryId
      WHERE m.id = ${item.menuItemId}
      FOR UPDATE
    `;

    const menuItem = lockedRows[0];
    if (!menuItem) {
      const err = new Error(`Menu item not found: ${item.menuItemId}`);
      (err as any).status = 400;
      throw err;
    }

    if (!menuItem.isAvailable || !menuItem.inStock) {
      const err = new Error(`"${menuItem.name}" is currently unavailable.`);
      (err as any).status = 400;
      throw err;
    }

    if (!menuItem.categoryIsActive) {
      const err = new Error(`Category for "${menuItem.name}" is not available.`);
      (err as any).status = 400;
      throw err;
    }

    if (menuItem.stockQuantity !== null) {
      const reservedAgg = await tx.inventoryReservation.aggregate({
        where: { menuItemId: item.menuItemId, status: 'RESERVED' },
        _sum: { quantity: true },
      });
      const reservedQty = reservedAgg._sum.quantity || 0;
      const available = menuItem.stockQuantity - reservedQty;
      if (available < item.quantity) {
        const err = new Error(
          `Insufficient stock for "${menuItem.name}". Only ${Math.max(0, available)} left.`
        );
        (err as any).status = 400;
        throw err;
      }
    }

    await tx.inventoryReservation.create({
      data: {
        checkoutSessionId,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        status: 'RESERVED',
      },
    });
  }

  await logAudit('INVENTORY_RESERVED', 'SUCCESS', { checkoutSessionId, items });
}

export async function releaseInventoryForSession(checkoutSessionId: string): Promise<void> {
  const updated = await prisma.inventoryReservation.updateMany({
    where: { checkoutSessionId, status: 'RESERVED' },
    data: { status: 'RELEASED', releasedAt: new Date() },
  });

  if (updated.count > 0) {
    await logAudit('INVENTORY_RELEASED', 'SUCCESS', { checkoutSessionId, count: updated.count });
  }
}

/**
 * Confirm reservations after payment success.
 * Permanently decrements stockQuantity for tracked items.
 */
export async function confirmInventoryForSession(
  tx: Prisma.TransactionClient,
  checkoutSessionId: string
): Promise<void> {
  const reservations = await tx.inventoryReservation.findMany({
    where: { checkoutSessionId, status: 'RESERVED' },
  });

  for (const reservation of reservations) {
    await tx.$queryRaw`SELECT id FROM menu_items WHERE id = ${reservation.menuItemId} FOR UPDATE`;

    const menuItem = await tx.menuItem.findUnique({ where: { id: reservation.menuItemId } });
    if (menuItem?.stockQuantity !== null && menuItem?.stockQuantity !== undefined) {
      const decremented = await tx.$executeRaw`
        UPDATE menu_items
        SET stockQuantity = stockQuantity - ${reservation.quantity},
            inStock = IF(stockQuantity - ${reservation.quantity} > 0, inStock, 0)
        WHERE id = ${reservation.menuItemId}
          AND stockQuantity >= ${reservation.quantity}
      `;
      if (decremented === 0) {
        const err = new Error(`Stock changed during payment for item ${menuItem.name}.`);
        (err as any).status = 409;
        throw err;
      }
    }
  }

  const updated = await tx.inventoryReservation.updateMany({
    where: { checkoutSessionId, status: 'RESERVED' },
    data: { status: 'CONFIRMED' },
  });

  if (updated.count > 0) {
    await logAudit('INVENTORY_CONFIRMED', 'SUCCESS', { checkoutSessionId, count: updated.count });
  }
}
