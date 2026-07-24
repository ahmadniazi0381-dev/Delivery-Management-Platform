import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { OrderStatus } from '@prisma/client';
import { recordOrderAuditTrail, notifyOwner, recordStaffActivity } from '../services/management.service';

// ─── 1. Advanced Analytics ───────────────────────────────────────────────────

export async function getAdvancedAnalytics(req: AuthenticatedRequest, res: Response) {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Revenue Aggregations
    const todayRevenueAgg = await prisma.order.aggregate({
      where: { status: 'DELIVERED', placedAt: { gte: startOfToday } },
      _sum: { total: true },
      _count: { id: true },
    });
    const todayRevenue = parseFloat(todayRevenueAgg._sum.total?.toString() || '0');

    const weeklyRevenueAgg = await prisma.order.aggregate({
      where: { status: 'DELIVERED', placedAt: { gte: startOfWeek } },
      _sum: { total: true },
      _count: { id: true },
    });
    const weeklyRevenue = parseFloat(weeklyRevenueAgg._sum.total?.toString() || '0');

    const monthlyRevenueAgg = await prisma.order.aggregate({
      where: { status: 'DELIVERED', placedAt: { gte: startOfMonth } },
      _sum: { total: true },
      _count: { id: true },
    });
    const monthlyRevenue = parseFloat(monthlyRevenueAgg._sum.total?.toString() || '0');

    // Total delivered orders & Average Order Value (AOV)
    const totalDeliveredAgg = await prisma.order.aggregate({
      where: { status: 'DELIVERED' },
      _sum: { total: true },
      _count: { id: true },
    });
    const totalDeliveredCount = totalDeliveredAgg._count.id || 0;
    const totalDeliveredRevenue = parseFloat(totalDeliveredAgg._sum.total?.toString() || '0');
    const averageOrderValue = totalDeliveredCount > 0 ? totalDeliveredRevenue / totalDeliveredCount : 0;

    // Best & Worst Selling Items (Delivered orders)
    const itemSales = await prisma.orderItem.groupBy({
      by: ['menuItemId', 'itemName'],
      where: { order: { status: 'DELIVERED' } },
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { quantity: 'desc' } },
    });

    const bestSellingItems = itemSales.slice(0, 5).map((i) => ({
      id: i.menuItemId,
      name: i.itemName,
      quantity: i._sum.quantity || 0,
      totalRevenue: parseFloat(i._sum.lineTotal?.toString() || '0'),
    }));

    const worstSellingItems = itemSales.slice(-5).reverse().map((i) => ({
      id: i.menuItemId,
      name: i.itemName,
      quantity: i._sum.quantity || 0,
      totalRevenue: parseFloat(i._sum.lineTotal?.toString() || '0'),
    }));

    // Peak Hours (Group by hour of placedAt)
    const allOrders = await prisma.order.findMany({
      select: { placedAt: true, total: true, status: true },
    });

    const hourCounts: Record<number, number> = {};
    for (let h = 0; h < 24; h++) hourCounts[h] = 0;
    allOrders.forEach((o) => {
      const hour = new Date(o.placedAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakHours = Object.entries(hourCounts).map(([hour, count]) => ({
      hour: `${parseInt(hour, 10).toString().padStart(2, '0')}:00`,
      orderCount: count,
    }));

    // Average Preparation & Delivery Time
    const ordersWithTiming = await prisma.order.findMany({
      where: { status: 'DELIVERED' },
      select: { placedAt: true, acceptedAt: true, readyAt: true, outForDeliveryAt: true, deliveredAt: true },
    });

    let totalPrepMinutes = 0;
    let prepCount = 0;
    let totalDeliveryMinutes = 0;
    let deliveryCount = 0;

    ordersWithTiming.forEach((o) => {
      if (o.acceptedAt && o.readyAt) {
        const prepMin = (new Date(o.readyAt).getTime() - new Date(o.acceptedAt).getTime()) / (1000 * 60);
        if (prepMin > 0 && prepMin < 300) {
          totalPrepMinutes += prepMin;
          prepCount++;
        }
      }
      if (o.outForDeliveryAt && o.deliveredAt) {
        const delMin = (new Date(o.deliveredAt).getTime() - new Date(o.outForDeliveryAt).getTime()) / (1000 * 60);
        if (delMin > 0 && delMin < 300) {
          totalDeliveryMinutes += delMin;
          deliveryCount++;
        }
      }
    });

    const averagePrepTimeMinutes = prepCount > 0 ? Math.round(totalPrepMinutes / prepCount) : 18;
    const averageDeliveryTimeMinutes = deliveryCount > 0 ? Math.round(totalDeliveryMinutes / deliveryCount) : 22;

    // Customer Retention & Cancellation Stats
    const totalCustomers = await prisma.user.count({ where: { role: 'CUSTOMER' } });
    const customersWithMultipleOrders = await prisma.order.groupBy({
      by: ['customerId'],
      _count: { id: true },
      having: { id: { _count: { gt: 1 } } },
    });
    const returningCustomersCount = customersWithMultipleOrders.length;
    const returningCustomerRate = totalCustomers > 0 ? (returningCustomersCount / totalCustomers) * 100 : 0;

    const totalOrdersCount = allOrders.length;
    const cancelledOrdersCount = allOrders.filter((o) => o.status === 'CANCELLED' || o.status === 'REJECTED').length;
    const cancellationRate = totalOrdersCount > 0 ? (cancelledOrdersCount / totalOrdersCount) * 100 : 0;

    // Top Rider (by delivered orders count)
    const riderDeliveries = await prisma.order.groupBy({
      by: ['riderId'],
      where: { status: 'DELIVERED', riderId: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 1,
    });

    let topRider = null;
    if (riderDeliveries.length > 0 && riderDeliveries[0].riderId) {
      const riderUser = await prisma.user.findUnique({
        where: { id: riderDeliveries[0].riderId },
        select: { name: true, phone: true, profilePicture: true },
      });
      if (riderUser) {
        topRider = {
          name: riderUser.name,
          phone: riderUser.phone,
          deliveredCount: riderDeliveries[0]._count.id,
        };
      }
    }

    // Top Manager (by audit trail action count)
    const managerAuditActions = await prisma.orderAuditTrail.groupBy({
      by: ['userName', 'userRole'],
      where: { userRole: { not: 'CUSTOMER' } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 1,
    });

    let topManager = null;
    if (managerAuditActions.length > 0) {
      topManager = {
        name: managerAuditActions[0].userName || 'Manager',
        role: managerAuditActions[0].userRole || 'MANAGER',
        actionsCount: managerAuditActions[0]._count.id,
      };
    }

    return res.json({
      success: true,
      data: {
        todayRevenue,
        weeklyRevenue,
        monthlyRevenue,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        bestSellingItems,
        worstSellingItems,
        peakHours,
        averagePrepTimeMinutes,
        averageDeliveryTimeMinutes,
        returningCustomerRate: Math.round(returningCustomerRate * 10) / 10,
        cancelledOrdersCount,
        cancellationRate: Math.round(cancellationRate * 10) / 10,
        topRider,
        topManager,
      },
    });
  } catch (error) {
    console.error('[ANALYTICS] getAdvancedAnalytics error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch advanced analytics.' });
  }
}

// ─── 2. Activity Center (Chronological Log) ──────────────────────────────────

export async function getActivityCenter(req: AuthenticatedRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '20', 10);
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, role: true, staffProfile: { select: { staffRole: true } } } },
        },
      }),
      prisma.activityLog.count(),
    ]);

    return res.json({
      success: true,
      data: {
        activities,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('[ACTIVITY CENTER] getActivityCenter error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch activity logs.' });
  }
}

// ─── 3. Staff Action History (Today's / Date Filtered) ───────────────────────

export async function getStaffActionHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params; // StaffProfile ID or User ID
    const dateStr = req.query.date as string;

    const staffProfile = await prisma.staffProfile.findFirst({
      where: { OR: [{ id }, { userId: id }] },
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
    });

    if (!staffProfile) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const [auditTrails, loginCount, activityLogs] = await Promise.all([
      prisma.orderAuditTrail.findMany({
        where: {
          userId: staffProfile.userId,
          createdAt: { gte: startOfDay, lt: endOfDay },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.loginHistory.count({
        where: {
          userId: staffProfile.userId,
          createdAt: { gte: startOfDay, lt: endOfDay },
        },
      }),
      prisma.activityLog.findMany({
        where: {
          userId: staffProfile.userId,
          createdAt: { gte: startOfDay, lt: endOfDay },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const acceptedOrdersCount = auditTrails.filter((a) => a.action.includes('ACCEPTED') || a.action.includes('Accepted')).length;
    const rejectedOrdersCount = auditTrails.filter((a) => a.action.includes('REJECTED') || a.action.includes('Rejected')).length;
    const editedMenuCount = activityLogs.filter((a) => a.action.includes('MENU')).length;
    const updatedStockCount = activityLogs.filter((a) => a.action.includes('STOCK')).length;
    const printedReceiptsCount = activityLogs.filter((a) => a.action.includes('PRINT')).length;

    return res.json({
      success: true,
      data: {
        staff: staffProfile,
        date: startOfDay.toISOString().split('T')[0],
        summary: {
          acceptedOrders: acceptedOrdersCount,
          rejectedOrders: rejectedOrdersCount,
          editedMenu: editedMenuCount,
          updatedStock: updatedStockCount,
          printedReceipts: printedReceiptsCount,
          loginCount,
        },
        auditTrails,
        activityLogs,
      },
    });
  } catch (error) {
    console.error('[STAFF HISTORY] getStaffActionHistory error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch staff action history.' });
  }
}

// ─── 4. Login History ─────────────────────────────────────────────────────────

export async function getLoginHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.query.userId as string;
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '20', 10);
    const skip = (page - 1) * limit;

    const whereClause = userId ? { userId } : {};

    const [logs, total] = await Promise.all([
      prisma.loginHistory.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, phone: true, email: true, role: true } },
        },
      }),
      prisma.loginHistory.count({ where: whereClause }),
    ]);

    return res.json({
      success: true,
      data: {
        logs,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error('[LOGIN HISTORY] getLoginHistory error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch login history.' });
  }
}

export async function getInventoryAlerts(_req: AuthenticatedRequest, res: Response) {
  try {
    const items = await prisma.menuItem.findMany({
      orderBy: { stockQuantity: 'asc' },
    });

    const formattedItems = items
      .filter((i) => !i.inStock || (i.stockQuantity !== null && i.stockQuantity <= 5))
      .map((i) => ({
        id: i.id,
        name: i.name,
        stock: i.stockQuantity ?? 0,
        unit: 'portions',
        lowStockThreshold: 5,
        menuItem: { name: i.name, image: i.imageUrl },
      }));

    return res.json({
      success: true,
      data: { items: formattedItems },
      items: formattedItems,
    });
  } catch (error) {
    console.error('[INVENTORY ALERTS] getInventoryAlerts error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch inventory alerts.' });
  }
}

export async function getInventoryOverview(_req: AuthenticatedRequest, res: Response) {
  try {
    const items = await prisma.menuItem.findMany({
      orderBy: { name: 'asc' },
    });

    const formattedItems = items.map((i) => ({
      id: i.id,
      name: i.name,
      stock: i.stockQuantity ?? 0,
      unit: 'portions',
      lowStockThreshold: 5,
      menuItem: { name: i.name, image: i.imageUrl },
    }));

    return res.json({
      success: true,
      data: { items: formattedItems },
      items: formattedItems,
    });
  } catch (error) {
    console.error('[INVENTORY OVERVIEW] getInventoryOverview error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch inventory overview.' });
  }
}

export async function updateMenuItemStock(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { stock, lowStockThreshold } = req.body;

    const newStock = Math.max(0, parseInt(stock, 10) || 0);
    const updated = await prisma.menuItem.update({
      where: { id },
      data: {
        stockQuantity: newStock,
        inStock: newStock > 0,
      },
    });

    await recordStaffActivity({
      userId: req.user!.id,
      action: 'UPDATE_STOCK',
      details: `Updated stock for ${updated.name} to ${newStock}`,
    });

    return res.json({
      success: true,
      message: 'Stock updated successfully.',
      data: {
        id: updated.id,
        name: updated.name,
        stock: updated.stockQuantity ?? 0,
        unit: 'portions',
        lowStockThreshold: lowStockThreshold || 5,
        menuItem: { name: updated.name, image: updated.imageUrl },
      },
    });
  } catch (error) {
    console.error('[UPDATE STOCK] updateMenuItemStock error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update stock.' });
  }
}

// ─── 6. Order Audit Trail ────────────────────────────────────────────────────

export async function getOrderAuditTrail(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params; // Order ID
    const auditTrails = await prisma.orderAuditTrail.findMany({
      where: { orderId: id },
      orderBy: { createdAt: 'asc' },
    });

    return res.json({ success: true, data: auditTrails });
  } catch (error) {
    console.error('[ORDER AUDIT] getOrderAuditTrail error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch order audit trail.' });
  }
}

// ─── 7. Owner Override ────────────────────────────────────────────────────────

export async function ownerOverrideOrder(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { action, newStatus, riderId, note } = req.body;

    const callerProfile = await prisma.staffProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (callerProfile?.staffRole !== 'OWNER' && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only an Owner can override order actions.' });
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const previousStatus = order.status;
    const updateData: any = {};

    if (newStatus) {
      updateData.status = newStatus as OrderStatus;
      if (newStatus === 'PENDING') {
        updateData.acceptedAt = null;
        updateData.readyAt = null;
        updateData.outForDeliveryAt = null;
        updateData.deliveredAt = null;
        updateData.cancelledAt = null;
        updateData.rejectedAt = null;
      } else if (newStatus === 'ACCEPTED') {
        updateData.acceptedAt = new Date();
      } else if (newStatus === 'CANCELLED') {
        updateData.cancelledAt = new Date();
      }
    }

    if (riderId !== undefined) {
      updateData.riderId = riderId || null;
    }

    if (note) {
      updateData.internalNotes = order.internalNotes
        ? `${order.internalNotes}\n[OWNER OVERRIDE]: ${note}`
        : `[OWNER OVERRIDE]: ${note}`;
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: { orderItems: true, address: true, customer: { select: { name: true, phone: true } } },
    });

    // Record audit trail entry
    const userObj = await prisma.user.findUnique({ where: { id: req.user!.id } });
    await recordOrderAuditTrail({
      orderId: id,
      userId: req.user!.id,
      userName: userObj?.name || 'Owner',
      userRole: 'OWNER',
      action: action || 'OWNER_OVERRIDE',
      previousStatus,
      newStatus: newStatus as OrderStatus || previousStatus,
      note: note || `Owner override applied: ${action}`,
      isOverride: true,
    });

    await recordStaffActivity({
      userId: req.user!.id,
      action: 'OWNER_OVERRIDE',
      details: `Owner override on Order #${order.orderNumber}: ${action || 'Status change'}`,
    });

    const io = req.app.get('io');
    if (io) {
      io.to('admin').emit('order:updated', { orderId: id, status: updatedOrder.status, isOverride: true });
      io.to(`user:${order.customerId}`).emit('order:updated', { orderId: id, status: updatedOrder.status });
    }

    return res.json({ success: true, message: 'Owner override applied successfully.', data: updatedOrder });
  } catch (error) {
    console.error('[OWNER OVERRIDE] ownerOverrideOrder error:', error);
    return res.status(500).json({ success: false, message: 'Failed to apply owner override.' });
  }
}

// ─── 8. Update Internal Notes ─────────────────────────────────────────────────

export async function updateInternalNotes(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { internalNotes } = req.body;

    const order = await prisma.order.update({
      where: { id },
      data: { internalNotes: internalNotes || null },
    });

    await recordStaffActivity({
      userId: req.user!.id,
      action: 'UPDATE_INTERNAL_NOTES',
      details: `Updated internal notes on Order #${order.orderNumber}`,
    });

    return res.json({ success: true, message: 'Internal notes updated.', data: order });
  } catch (error) {
    console.error('[INTERNAL NOTES] updateInternalNotes error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update internal notes.' });
  }
}

// ─── 9. KDS (Kitchen Display System) Orders & Status ─────────────────────────

export async function getKdsOrders(_req: AuthenticatedRequest, res: Response) {
  try {
    const activeOrders = await prisma.order.findMany({
      where: {
        status: { in: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'] },
      },
      orderBy: { placedAt: 'asc' },
      include: {
        orderItems: {
          include: { menuItem: { select: { isSpicy: true, preparationTime: true } } },
        },
        customer: { select: { name: true, phone: true } },
        address: { select: { label: true } },
      },
    });

    const pending = activeOrders.filter((o) => o.status === 'PENDING' || o.status === 'ACCEPTED');
    const preparing = activeOrders.filter((o) => o.status === 'PREPARING');
    const ready = activeOrders.filter((o) => o.status === 'READY');

    return res.json({
      success: true,
      data: {
        pending,
        preparing,
        ready,
        totalActive: activeOrders.length,
      },
    });
  } catch (error) {
    console.error('[KDS] getKdsOrders error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch KDS orders.' });
  }
}

export async function updateKdsOrderStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body; // PREPARING, READY, DELIVERED/COMPLETED

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const previousStatus = order.status;
    const updateData: any = { status };

    if (status === 'PREPARING') {
      updateData.acceptedAt = order.acceptedAt || new Date();
    } else if (status === 'READY') {
      updateData.readyAt = new Date();
    } else if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    }

    const updated = await prisma.order.update({
      where: { id },
      data: updateData,
      include: { orderItems: true, customer: { select: { name: true } } },
    });

    const userObj = await prisma.user.findUnique({ where: { id: req.user!.id } });
    await recordOrderAuditTrail({
      orderId: id,
      userId: req.user!.id,
      userName: userObj?.name || 'Kitchen Staff',
      userRole: 'KDS',
      action: `KDS_${status}`,
      previousStatus,
      newStatus: status as OrderStatus,
    });

    await recordStaffActivity({
      userId: req.user!.id,
      action: `KDS_UPDATE_${status}`,
      details: `Kitchen updated Order #${order.orderNumber} to ${status}`,
    });

    const io = req.app.get('io');
    if (io) {
      io.to('admin').emit('order:updated', { orderId: id, status });
      io.to(`user:${order.customerId}`).emit('order:updated', { orderId: id, status });
    }

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('[KDS] updateKdsOrderStatus error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update KDS order status.' });
  }
}
