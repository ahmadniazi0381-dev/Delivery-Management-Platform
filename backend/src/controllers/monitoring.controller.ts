import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getMonitoringDashboard(req: AuthenticatedRequest, res: Response) {
  try {
    const today = startOfToday();

    const [
      todayOrders,
      todayRevenue,
      pendingOrders,
      completedToday,
      cancelledToday,
      rejectedToday,
      paymentCompleted,
      paymentFailed,
      activeRiders,
      avgRating,
      refunds,
      deliveredOrders,
    ] = await Promise.all([
      prisma.order.count({ where: { placedAt: { gte: today } } }),
      prisma.order.aggregate({
        where: { placedAt: { gte: today }, paymentStatus: 'COMPLETED' },
        _sum: { total: true },
      }),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { placedAt: { gte: today }, status: 'DELIVERED' } }),
      prisma.order.count({ where: { placedAt: { gte: today }, status: 'CANCELLED' } }),
      prisma.order.count({ where: { placedAt: { gte: today }, status: 'REJECTED' } }),
      prisma.payment.count({ where: { createdAt: { gte: today }, status: 'COMPLETED' } }),
      prisma.payment.count({
        where: {
          createdAt: { gte: today },
          status: { in: ['FAILED', 'EXPIRED'] },
        },
      }),
      prisma.user.count({ where: { role: 'RIDER', riderProfile: { status: { in: ['ONLINE', 'ACTIVE'] } } } }),
      prisma.review.aggregate({ _avg: { rating: true } }),
      prisma.payment.count({ where: { createdAt: { gte: today }, refundStatus: { not: 'NONE' } } }),
      prisma.order.findMany({
        where: { placedAt: { gte: today }, status: 'DELIVERED', deliveredAt: { not: null } },
        select: { placedAt: true, deliveredAt: true, readyAt: true },
      }),
    ]);

    const paymentAttempts = paymentCompleted + paymentFailed;
    const paymentSuccessRate = paymentAttempts > 0 ? (paymentCompleted / paymentAttempts) * 100 : 100;
    const paymentFailureRate = paymentAttempts > 0 ? (paymentFailed / paymentAttempts) * 100 : 0;

    let avgDeliveryMinutes: number | null = null;
    let avgPreparationMinutes: number | null = null;
    if (deliveredOrders.length > 0) {
      const deliveryDurations = deliveredOrders
        .filter((o) => o.deliveredAt)
        .map((o) => (o.deliveredAt!.getTime() - o.placedAt.getTime()) / 60000);
      avgDeliveryMinutes =
        deliveryDurations.reduce((a, b) => a + b, 0) / Math.max(deliveryDurations.length, 1);

      const prepDurations = deliveredOrders
        .filter((o) => o.readyAt)
        .map((o) => (o.readyAt!.getTime() - o.placedAt.getTime()) / 60000);
      if (prepDurations.length > 0) {
        avgPreparationMinutes = prepDurations.reduce((a, b) => a + b, 0) / prepDurations.length;
      }
    }

    const checkoutSessionsToday = await prisma.checkoutSession.groupBy({
      by: ['status'],
      where: { createdAt: { gte: today } },
      _count: { _all: true },
    });

    return res.json({
      success: true,
      data: {
        todayOrders,
        todayRevenue: parseFloat(todayRevenue._sum.total?.toString() || '0'),
        pendingOrders,
        completedOrdersToday: completedToday,
        cancelledOrdersToday: cancelledToday,
        rejectedOrdersToday: rejectedToday,
        paymentSuccessRate: Math.round(paymentSuccessRate * 100) / 100,
        paymentFailureRate: Math.round(paymentFailureRate * 100) / 100,
        refundsToday: refunds,
        activeRiders,
        averageRating: Math.round((avgRating._avg.rating || 0) * 100) / 100,
        averageDeliveryMinutes: avgDeliveryMinutes ? Math.round(avgDeliveryMinutes) : null,
        averagePreparationMinutes: avgPreparationMinutes ? Math.round(avgPreparationMinutes) : null,
        checkoutSessionsToday,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Monitoring dashboard error:', error);
    return res.status(500).json({ success: false, error: 'Failed to load monitoring dashboard.' });
  }
}

export async function getSystemLogs(req: AuthenticatedRequest, res: Response) {
  try {
    const { severity, module, search, page = '1', limit = '50' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (severity) where.severity = severity;
    if (module) where.module = module;
    if (search) {
      where.OR = [
        { message: { contains: search as string } },
        { module: { contains: search as string } },
        { details: { contains: search as string } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.systemLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limitNum }),
      prisma.systemLog.count({ where }),
    ]);

    return res.json({
      success: true,
      data: logs,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch system logs.' });
  }
}

export async function globalSearch(req: AuthenticatedRequest, res: Response) {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) {
      return res.status(400).json({ success: false, error: 'Search query must be at least 2 characters.' });
    }

    const [orders, payments, customers, menuItems, reviews] = await Promise.all([
      prisma.order.findMany({
        where: {
          OR: [
            { orderNumber: { contains: q } },
            { recipientName: { contains: q } },
            { recipientPhone: { contains: q } },
            { id: { contains: q } },
          ],
        },
        take: 10,
        orderBy: { placedAt: 'desc' },
        select: { id: true, orderNumber: true, status: true, total: true, placedAt: true },
      }),
      prisma.payment.findMany({
        where: {
          OR: [
            { invoiceNumber: { contains: q } },
            { gatewayTransactionId: { contains: q } },
            { transactionRef: { contains: q } },
            { id: { contains: q } },
          ],
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, invoiceNumber: true, status: true, amount: true, orderId: true },
      }),
      prisma.user.findMany({
        where: {
          role: 'CUSTOMER',
          OR: [{ name: { contains: q } }, { phone: { contains: q } }, { email: { contains: q } }],
        },
        take: 10,
        select: { id: true, name: true, phone: true, email: true },
      }),
      prisma.menuItem.findMany({
        where: { OR: [{ name: { contains: q } }, { description: { contains: q } }] },
        take: 10,
        select: { id: true, name: true, price: true, isAvailable: true },
      }),
      prisma.review.findMany({
        where: { OR: [{ comment: { contains: q } }, { id: { contains: q } }] },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, rating: true, comment: true, orderId: true, createdAt: true },
      }),
    ]);

    return res.json({
      success: true,
      data: { orders, payments, customers, menuItems, reviews, query: q },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Search failed.' });
  }
}
