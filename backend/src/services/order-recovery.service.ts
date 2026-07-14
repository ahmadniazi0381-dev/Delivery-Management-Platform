import prisma from '../config/db';
import { expireCheckoutSessions } from './checkout.service';
import { buildGatewayRedirect } from './gateway.service';
import { logAudit } from './audit.service';

type RecoveryItem = {
  menuItemId: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
};

export async function restoreCartFromSession(userId: string, itemsPayload: RecoveryItem[]): Promise<number> {
  let restored = 0;
  for (const item of itemsPayload) {
    const menuItem = await prisma.menuItem.findUnique({ where: { id: item.menuItemId } });
    if (!menuItem || !menuItem.isAvailable || !menuItem.inStock) continue;

    await prisma.cartItem.upsert({
      where: { userId_menuItemId: { userId, menuItemId: item.menuItemId } },
      update: { quantity: item.quantity },
      create: { userId, menuItemId: item.menuItemId, quantity: item.quantity },
    });
    restored++;
  }
  return restored;
}

/**
 * REQ-ORDER-RECOVERY-001 — recover checkout after disconnect/expiry.
 */
export async function getCheckoutRecovery(userId: string) {
  await expireCheckoutSessions();

  const recentWindow = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const completedSession = await prisma.checkoutSession.findFirst({
    where: {
      customerId: userId,
      status: 'COMPLETED',
      completedAt: { gte: recentWindow },
      orderId: { not: null },
    },
    orderBy: { completedAt: 'desc' },
    include: { customer: true },
  });

  if (completedSession?.orderId) {
    const order = await prisma.order.findUnique({
      where: { id: completedSession.orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        paymentStatus: true,
        placedAt: true,
      },
    });
    return {
      state: 'COMPLETED' as const,
      checkoutSessionId: completedSession.id,
      order,
      message: 'Your payment completed and your order is available.',
    };
  }

  const pendingSession = await prisma.checkoutSession.findFirst({
    where: {
      customerId: userId,
      status: 'PENDING',
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
    include: { customer: true },
  });

  if (pendingSession) {
    let gatewayRedirect;
    try {
      gatewayRedirect = buildGatewayRedirect(pendingSession);
    } catch {
      gatewayRedirect = null;
    }

    return {
      state: 'PENDING' as const,
      checkoutSessionId: pendingSession.id,
      paymentMethod: pendingSession.paymentMethod,
      amount: parseFloat(pendingSession.total.toString()),
      expiresAt: pendingSession.expiresAt,
      priceLockedUntil: pendingSession.priceLockedUntil,
      gatewayRedirect,
      resumePaymentUrl: `/api/payments/session/${pendingSession.id}/status`,
      message: 'Payment is still pending. Resume checkout to complete payment.',
    };
  }

  const expiredSession = await prisma.checkoutSession.findFirst({
    where: {
      customerId: userId,
      status: { in: ['EXPIRED', 'FAILED'] },
      updatedAt: { gte: recentWindow },
    },
    orderBy: { updatedAt: 'desc' },
  });

  if (expiredSession) {
    const items = expiredSession.itemsPayload as RecoveryItem[];
    const restoredCount = await restoreCartFromSession(userId, items);
    await logAudit('CHECKOUT_RECOVERED', 'SUCCESS', {
      checkoutSessionId: expiredSession.id,
      cartRestored: restoredCount,
    });

    return {
      state: 'CART_RESTORED' as const,
      checkoutSessionId: expiredSession.id,
      restoredItems: restoredCount,
      items,
      message:
        restoredCount > 0
          ? 'Checkout expired. Your cart has been restored — please review prices and checkout again.'
          : 'Checkout expired. Some items are no longer available; please review your cart.',
    };
  }

  return {
    state: 'NONE' as const,
    message: 'No recoverable checkout session found.',
  };
}
