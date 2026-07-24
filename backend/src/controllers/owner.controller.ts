import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { sendPushToUser } from '../services/push.service';
import { logAudit, AuditAction } from '../services/audit.service';
import { PaymentMethod } from '@prisma/client';
import bcrypt from 'bcrypt';
import { deleteImage } from '../services/storage.service';
import { recordOrderAuditTrail, notifyOwner, recordStaffActivity } from '../services/management.service';

async function logAdminAction(
  req: AuthenticatedRequest,
  action: AuditAction,
  details?: string | Record<string, unknown>
) {
  await logAudit(action, 'SUCCESS', details, { req, userId: req.user?.id });
}

// -------------------------------------------------------------
// 1. ANALYTICS
// -------------------------------------------------------------
export async function getAnalytics(req: AuthenticatedRequest, res: Response) {
  try {
    // Total Revenue (sum of all DELIVERED orders)
    const revenueResult = await prisma.order.aggregate({
      where: { status: 'DELIVERED' },
      _sum: { total: true },
    });
    const totalRevenue = parseFloat(revenueResult._sum.total?.toString() || '0');

    // Total Orders
    const totalOrders = await prisma.order.count();

    // Total Customers
    const totalCustomers = await prisma.user.count({
      where: { role: 'CUSTOMER' },
    });

    // Pending Orders count
    const pendingOrders = await prisma.order.count({
      where: { status: 'PENDING' },
    });

    // Order Counts by Status
    const ordersGrouped = await prisma.order.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    const orderCounts: Record<string, number> = {
      PENDING: 0,
      ACCEPTED: 0,
      PREPARING: 0,
      READY: 0,
      OUT_FOR_DELIVERY: 0,
      DELIVERED: 0,
      CANCELLED: 0,
      REJECTED: 0,
    };
    ordersGrouped.forEach((group) => {
      orderCounts[group.status] = group._count._all;
    });

    // Top Selling Items (top 10 by quantity from order items)
    const topSellingItemsGrouped = await prisma.orderItem.groupBy({
      by: ['menuItemId', 'itemName'],
      where: {
        order: { status: 'DELIVERED' }
      },
      _sum: { quantity: true },
      orderBy: {
        _sum: { quantity: 'desc' }
      },
      take: 10,
    });
    const topSellingItems = topSellingItemsGrouped.map((item) => ({
      name: item.itemName,
      quantity: item._sum.quantity || 0,
    }));

    // Revenue by Day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentOrders = await prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        placedAt: { gte: thirtyDaysAgo },
      },
      select: {
        total: true,
        placedAt: true,
      },
    });

    const revenueMap: Record<string, number> = {};
    // Pre-populate last 30 days with 0s
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      revenueMap[dateStr] = 0;
    }
    recentOrders.forEach((order) => {
      const dateStr = order.placedAt.toISOString().split('T')[0];
      if (revenueMap[dateStr] !== undefined) {
        revenueMap[dateStr] += parseFloat(order.total.toString());
      } else {
        revenueMap[dateStr] = parseFloat(order.total.toString());
      }
    });
    const revenueByDay = Object.keys(revenueMap).sort().map((date) => ({
      date,
      revenue: parseFloat(revenueMap[date].toFixed(2)),
    }));

    // Peak Ordering Hours
    const allOrdersTime = await prisma.order.findMany({
      select: { placedAt: true },
    });
    const hourMap: Record<number, number> = {};
    for (let i = 0; i < 24; i++) hourMap[i] = 0;
    allOrdersTime.forEach((order) => {
      const hour = new Date(order.placedAt).getHours();
      hourMap[hour]++;
    });
    const peakHours = Object.keys(hourMap).map((hour) => ({
      hour: parseInt(hour),
      orders: hourMap[parseInt(hour)],
    }));

    return res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        totalCustomers,
        pendingOrders,
        orderCounts,
        topSellingItems,
        revenueByDay,
        peakHours,
      },
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch analytics.' });
  }
}

// -------------------------------------------------------------
// 2. ORDERS MANAGEMENT
// -------------------------------------------------------------
export async function getOrders(req: AuthenticatedRequest, res: Response) {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        customer: {
          select: { name: true, phone: true, email: true }
        },
        address: true,
        orderItems: true,
      },
      orderBy: { placedAt: 'desc' },
      skip,
      take: limitNum,
    });

    const total = await prisma.order.count({ where: whereClause });

    return res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      }
    });
  } catch (error: any) {
    console.error('Get orders error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch orders.' });
  }
}

export async function acceptOrder(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    if (order.status !== 'PENDING') {
      return res.status(409).json({
        success: false,
        error: `Cannot accept order — current status is "${order.status}". Only PENDING orders can be accepted.`,
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
      include: {
        customer: { select: { name: true, phone: true } },
        address: true,
        orderItems: true,
      }
    });

    await logAdminAction(req, 'ADMIN_ACCEPT_ORDER', { orderId: id });

    // Record Audit Trail & Staff Activity
    const staffUser = req.user ? await prisma.user.findUnique({ where: { id: req.user.id } }) : null;
    await recordOrderAuditTrail({
      orderId: id,
      userId: req.user?.id,
      userName: staffUser?.name || 'Staff',
      userRole: req.user?.staffRole || 'MANAGER',
      action: 'ACCEPTED',
      previousStatus: 'PENDING',
      newStatus: 'ACCEPTED',
    });

    await recordStaffActivity({
      userId: req.user!.id,
      action: 'ACCEPT_ORDER',
      details: `Accepted Order #${order.orderNumber}`,
    });

    // Emit Socket.io status update
    const io = req.app.get('io');
    if (io) {
      io.emit('order:status', { orderId: id, status: 'ACCEPTED', updatedAt: new Date() });
    }

    if (req.user?.staffRole !== 'OWNER') {
      notifyOwner({
        io,
        staffName: staffUser?.name || 'Manager',
        action: 'Order Accepted',
        orderNumber: order.orderNumber,
      }).catch(() => {});
    }

    // Send Push Notification
    await sendPushToUser(
      order.customerId,
      'Order Accepted 🍛',
      'Your order has been accepted and is now in preparation!'
    );

    return res.json({ success: true, data: updatedOrder });
  } catch (error) {
    console.error('Accept order error:', error);
    return res.status(500).json({ success: false, error: 'Failed to accept order.' });
  }
}

export async function rejectOrder(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { payment: true },
    });
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    const nonRejectableStatuses = ['DELIVERED', 'CANCELLED', 'REJECTED'];
    if (nonRejectableStatuses.includes(order.status)) {
      return res.status(409).json({
        success: false,
        error: `Cannot reject order — current status is "${order.status}".`,
      });
    }

    // If online-paid, flag for refund
    const wasOnlinePaid = order.payment?.status === 'COMPLETED' && order.paymentMethod !== 'COD';

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
          paymentStatus: wasOnlinePaid ? 'REFUNDED' : (order.paymentStatus !== 'COMPLETED' ? 'FAILED' : order.paymentStatus),
        },
        include: {
          customer: { select: { name: true, phone: true } },
          address: true,
          orderItems: true,
        }
      });

      if (wasOnlinePaid && order.payment) {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: { refundStatus: 'FULL', status: 'REFUNDED' },
        });
      }

      return updated;
    });

    await logAdminAction(req, 'ADMIN_REJECT_ORDER', { orderId: id, reason: reason || null, refundInitiated: wasOnlinePaid });

    const staffUser = req.user ? await prisma.user.findUnique({ where: { id: req.user.id } }) : null;
    await recordOrderAuditTrail({
      orderId: id,
      userId: req.user?.id,
      userName: staffUser?.name || 'Staff',
      userRole: req.user?.staffRole || 'MANAGER',
      action: 'REJECTED',
      previousStatus: order.status,
      newStatus: 'REJECTED',
      note: reason || 'Order rejected by staff',
    });

    await recordStaffActivity({
      userId: req.user!.id,
      action: 'REJECT_ORDER',
      details: `Rejected Order #${order.orderNumber}. Reason: ${reason || 'N/A'}`,
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('order:status', { orderId: id, status: 'REJECTED', updatedAt: new Date() });
      if (order.riderId) {
        io.to(`user:${order.riderId}`).emit('delivery:cancelled', {
          orderId: id,
          message: 'This order has been rejected by the admin.',
        });
      }
    }

    if (req.user?.staffRole !== 'OWNER') {
      notifyOwner({
        io,
        staffName: staffUser?.name || 'Manager',
        action: 'Order Rejected',
        orderNumber: order.orderNumber,
        details: reason ? `Reason: ${reason}` : undefined,
      }).catch(() => {});
    }

    // Send Push Notification
    await sendPushToUser(
      order.customerId,
      'Order Rejected ❌',
      wasOnlinePaid
        ? 'Your order could not be accepted. Your payment will be refunded within 3–5 business days.'
        : 'We are sorry, your order could not be accepted by the restaurant.'
    );

    return res.json({ success: true, data: updatedOrder, refundInitiated: wasOnlinePaid });
  } catch (error) {
    console.error('Reject order error:', error);
    return res.status(500).json({ success: false, error: 'Failed to reject order.' });
  }
}

export async function updateOrderStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Ordered state machine — forward-only transitions
    const VALID_TRANSITIONS: Record<string, string[]> = {
      PENDING:         ['ACCEPTED', 'REJECTED', 'CANCELLED'],
      ACCEPTED:        ['PREPARING', 'REJECTED', 'CANCELLED'],
      PREPARING:       ['READY'],
      READY:           ['OUT_FOR_DELIVERY'],
      OUT_FOR_DELIVERY: ['DELIVERED'],
      DELIVERED:       [],
      REJECTED:        [],
      CANCELLED:       [],
    };

    const validStatuses = Object.keys(VALID_TRANSITIONS).filter(s => !['PENDING', 'ACCEPTED'].includes(s));
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid order status for this operation.' });
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    const allowed = VALID_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      return res.status(409).json({
        success: false,
        error: `Cannot transition order from "${order.status}" to "${status}".`,
      });
    }

    const updateData: any = { status };
    if (status === 'PREPARING') updateData.readyAt = null;
    if (status === 'READY') updateData.readyAt = new Date();
    if (status === 'OUT_FOR_DELIVERY') updateData.outForDeliveryAt = new Date();
    if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
      // Only mark COD as completed here; online-paid orders already have COMPLETED payment
      if (order.paymentMethod === 'COD' && order.paymentStatus !== 'COMPLETED') {
        updateData.paymentStatus = 'COMPLETED';
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { name: true, phone: true } },
        address: true,
        orderItems: true,
      }
    });

    await logAdminAction(req, 'ADMIN_UPDATE_ORDER_STATUS', { orderId: id, status });

    const io = req.app.get('io');
    if (io) {
      io.emit('order:status', { orderId: id, status, updatedAt: new Date() });
    }

    // Determine notification message
    let pushTitle = 'Order Update 🍛';
    let pushBody = `Your order status has changed to ${status}.`;

    if (status === 'PREPARING') {
      pushTitle = 'Preparing Your Meal 👨‍🍳';
      pushBody = 'Your food is now being freshly prepared in our kitchen.';
    } else if (status === 'READY') {
      pushTitle = 'Order Ready to Pack 📦';
      pushBody = 'Your order is ready! It will be dispatched shortly.';
    } else if (status === 'OUT_FOR_DELIVERY') {
      pushTitle = 'Out for Delivery 🛵';
      pushBody = 'Our delivery partner is on the way with your food. Keep your phone handy!';
    } else if (status === 'DELIVERED') {
      pushTitle = 'Delivered! Enjoy 🎉';
      pushBody = 'Your order has been delivered. Thank you for choosing Naseeb Baryani UCP!';
    }

    await sendPushToUser(order.customerId, pushTitle, pushBody);

    return res.json({ success: true, data: updatedOrder });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update order status.' });
  }
}

export async function assignRider(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { riderId } = req.body;

    if (!riderId) {
      return res.status(400).json({ success: false, error: 'riderId is required.' });
    }

    const [order, rider] = await Promise.all([
      prisma.order.findUnique({ where: { id } }),
      prisma.user.findFirst({ where: { id: riderId, role: 'RIDER' } }),
    ]);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }
    if (!rider) {
      return res.status(404).json({ success: false, error: 'Rider not found.' });
    }

    const newStatus = order.status === 'READY' ? 'OUT_FOR_DELIVERY' : order.status;
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        riderId,
        status: newStatus,
        outForDeliveryAt: newStatus === 'OUT_FOR_DELIVERY' ? (order.outForDeliveryAt || new Date()) : order.outForDeliveryAt,
      },
      include: {
        customer: { select: { name: true, phone: true } },
        rider: { select: { id: true, name: true, phone: true } },
        address: true,
        orderItems: true,
      },
    });

    await logAdminAction(req, 'ADMIN_ASSIGN_RIDER', {
      orderId: id,
      riderId,
      riderName: rider.name,
      riderPhone: rider.phone,
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('order:status', {
        orderId: id,
        status: updatedOrder.status,
        riderId,
        updatedAt: new Date(),
      });
      io.to(`user:${riderId}`).emit('delivery:new', {
        orderId: id,
        orderNumber: updatedOrder.orderNumber,
        customerName: updatedOrder.customer.name,
        address: updatedOrder.address?.addressLine,
      });
    }

    await sendPushToUser(
      order.customerId,
      'Rider Assigned 🛵',
      `${rider.name} has been assigned to deliver your order.`
    );
    await sendPushToUser(riderId, 'New Delivery', `You have been assigned order ${updatedOrder.orderNumber}.`);

    return res.json({ success: true, data: updatedOrder });
  } catch (error) {
    console.error('Assign rider error:', error);
    return res.status(500).json({ success: false, error: 'Failed to assign rider.' });
  }
}

export async function refundPayment(req: AuthenticatedRequest, res: Response) {
  try {
    const { paymentId } = req.params;
    const { reason, amount } = req.body;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found.' });
    }
    if (payment.status !== 'COMPLETED') {
      return res.status(400).json({ success: false, error: 'Only completed payments can be refunded.' });
    }
    if (payment.refundStatus !== 'NONE') {
      return res.status(409).json({ success: false, error: 'Payment has already been refunded.' });
    }

    const refundAmount = amount !== undefined ? parseFloat(String(amount)) : parseFloat(payment.paidAmount?.toString() || payment.amount.toString());
    const payAmount = parseFloat(payment.amount.toString());
    if (refundAmount <= 0 || refundAmount > payAmount) {
      return res.status(400).json({ success: false, error: 'Invalid refund amount.' });
    }

    const refundStatus = refundAmount >= payAmount ? 'FULL' : 'PARTIAL';

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.update({
        where: { id: paymentId },
        data: {
          refundStatus,
          status: refundStatus === 'FULL' ? 'REFUNDED' : payment.status,
          gatewayResponse: JSON.stringify({
            refundedAt: new Date().toISOString(),
            refundAmount,
            reason: reason || null,
            refundedBy: req.user?.id,
          }),
        },
      });

      if (refundStatus === 'FULL') {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { paymentStatus: 'REFUNDED' },
        });
      }

      return p;
    });

    await logAdminAction(req, 'ADMIN_REFUND_PAYMENT', {
      paymentId,
      orderId: payment.orderId,
      refundAmount,
      refundStatus,
      reason: reason || null,
    });

    const io = req.app.get('io');
    io?.to(`user:${payment.order.customerId}`).emit('payment:updated', {
      orderId: payment.orderId,
      paymentStatus: refundStatus === 'FULL' ? 'REFUNDED' : payment.status,
      updatedAt: new Date(),
    });

    return res.json({ success: true, data: updated, message: 'Refund recorded successfully.' });
  } catch (error) {
    console.error('Refund payment error:', error);
    return res.status(500).json({ success: false, error: 'Failed to refund payment.' });
  }
}

export async function resetRiderPassword(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || String(newPassword).length < 8) {
      return res.status(400).json({ success: false, error: 'newPassword must be at least 8 characters.' });
    }

    const rider = await prisma.user.findFirst({ where: { id, role: 'RIDER' } });
    if (!rider) {
      return res.status(404).json({ success: false, error: 'Rider not found.' });
    }

    const passwordHash = await bcrypt.hash(String(newPassword), 10);
    await prisma.user.update({
      where: { id },
      data: { passwordHash, mustChangePassword: true },
    });

    await logAdminAction(req, 'ADMIN_RESET_RIDER_PASSWORD', {
      riderId: id,
      riderName: rider.name,
      riderPhone: rider.phone,
    });

    return res.json({ success: true, message: 'Rider password reset successfully. Rider must change password on next login.' });
  } catch (error) {
    console.error('Reset rider password error:', error);
    return res.status(500).json({ success: false, error: 'Failed to reset rider password.' });
  }
}

// -------------------------------------------------------------
// 3. CATEGORIES MANAGEMENT
// -------------------------------------------------------------
export async function getCategories(req: AuthenticatedRequest, res: Response) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return res.json({ success: true, data: categories });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch categories.' });
  }
}

export async function createCategory(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, description, imageUrl, sortOrder } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Category name is required.' });
    }

    const exists = await prisma.category.findUnique({ where: { name } });
    if (exists) {
      return res.status(400).json({ success: false, error: 'Category name already exists.' });
    }

    const category = await prisma.category.create({
      data: {
        name,
        description: description || null,
        imageUrl: imageUrl || null,
        sortOrder: sortOrder ? parseInt(sortOrder.toString()) : 0,
      },
    });

    await logAdminAction(req, 'ADMIN_CREATE_CATEGORY', { name });
    return res.json({ success: true, data: category });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to create category.' });
  }
}

export async function updateCategory(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, description, imageUrl, sortOrder, isActive } = req.body;

    const exists = await prisma.category.findUnique({ where: { id } });
    if (!exists) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name,
        description,
        imageUrl,
        sortOrder: sortOrder ? parseInt(sortOrder.toString()) : undefined,
        isActive,
      },
    });

    await logAdminAction(req, 'ADMIN_UPDATE_CATEGORY', { categoryId: id });
    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update category.' });
  }
}

export async function deleteCategory(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    
    // Check if category has items
    const itemsCount = await prisma.menuItem.count({ where: { categoryId: id } });
    if (itemsCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete category that contains menu items. Delete or move the items first.',
      });
    }

    await prisma.category.delete({ where: { id } });
    await logAdminAction(req, 'ADMIN_DELETE_CATEGORY', { categoryId: id });
    return res.json({ success: true, message: 'Category deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to delete category.' });
  }
}

// -------------------------------------------------------------
// 4. MENU ITEMS MANAGEMENT
// -------------------------------------------------------------
export async function getMenuItems(req: AuthenticatedRequest, res: Response) {
  try {
    const { categoryId, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const whereClause: any = {};
    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    const items = await prisma.menuItem.findMany({
      where: whereClause,
      include: { category: true },
      orderBy: { sortOrder: 'asc' },
      skip,
      take: limitNum,
    });

    const total = await prisma.menuItem.count({ where: whereClause });

    return res.json({
      success: true,
      data: items,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch menu items.' });
  }
}

export async function createMenuItem(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      categoryId,
      name,
      description,
      price,
      imageUrl,
      isAvailable,
      inStock,
      isFeatured,
      isSpicy,
      preparationTime,
      sortOrder,
    } = req.body;

    if (!categoryId || !name || price === undefined) {
      return res.status(400).json({ success: false, error: 'Category, name, and price are required.' });
    }

    const categoryExists = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!categoryExists) {
      return res.status(400).json({ success: false, error: 'Selected category does not exist.' });
    }

    const item = await prisma.menuItem.create({
      data: {
        categoryId,
        name,
        description: description || null,
        price: parseFloat(price.toString()),
        imageUrl: imageUrl || null,
        isAvailable: isAvailable !== undefined ? !!isAvailable : true,
        inStock: inStock !== undefined ? !!inStock : true,
        isFeatured: !!isFeatured,
        isSpicy: !!isSpicy,
        preparationTime: preparationTime ? parseInt(preparationTime.toString()) : 20,
        sortOrder: sortOrder ? parseInt(sortOrder.toString()) : 0,
      },
    });

    await logAdminAction(req, 'ADMIN_CREATE_MENU_ITEM', { name, price });
    return res.json({ success: true, data: item });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to create menu item.' });
  }
}

export async function updateMenuItem(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const {
      categoryId,
      name,
      description,
      price,
      imageUrl,
      isAvailable,
      inStock,
      isFeatured,
      isSpicy,
      preparationTime,
      sortOrder,
    } = req.body;

    const exists = await prisma.menuItem.findUnique({ where: { id } });
    if (!exists) {
      return res.status(404).json({ success: false, error: 'Menu item not found.' });
    }

    // Clean up old storage image if image changed
    if (imageUrl !== undefined && imageUrl !== exists.imageUrl && exists.imageUrl) {
      deleteImage(exists.imageUrl).catch((err) => {
        console.error('[OWNER CONTROLLER] Old image cleanup failed:', err);
      });
    }

    const updated = await prisma.menuItem.update({
      where: { id },
      data: {
        categoryId,
        name,
        description,
        price: price !== undefined ? parseFloat(price.toString()) : undefined,
        imageUrl,
        isAvailable,
        inStock,
        isFeatured,
        isSpicy,
        preparationTime: preparationTime ? parseInt(preparationTime.toString()) : undefined,
        sortOrder: sortOrder ? parseInt(sortOrder.toString()) : undefined,
      },
    });

    await logAdminAction(req, exists.price.toString() !== String(price) ? 'ADMIN_CHANGE_PRICE' : 'ADMIN_UPDATE_MENU_ITEM', {
      menuItemId: id,
      price,
    });
    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update menu item.' });
  }
}

export async function deleteMenuItem(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const exists = await prisma.menuItem.findUnique({ where: { id } });
    if (!exists) {
      return res.status(404).json({ success: false, error: 'Menu item not found.' });
    }

    // Delete item from database
    await prisma.menuItem.delete({ where: { id } }).catch(async () => {
      // Fallback: soft-delete if foreign key constraint exists in order_items
      return await prisma.menuItem.update({
        where: { id },
        data: { isAvailable: false, inStock: false },
      });
    });

    // Delete associated image from Supabase Storage (log on failure, do not fail DB response)
    if (exists.imageUrl) {
      deleteImage(exists.imageUrl).catch((err) => {
        console.error('[OWNER CONTROLLER] Storage image deletion error on menu delete:', err);
      });
    }

    await logAdminAction(req, 'ADMIN_DELETE_MENU_ITEM', { menuItemId: id, name: exists.name });
    return res.json({ success: true, message: 'Menu item deleted successfully.' });
  } catch (error) {
    console.error('Delete menu item error:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete menu item.' });
  }
}

// -------------------------------------------------------------
// 5. DISCOUNTS / COUPONS MANAGEMENT
// -------------------------------------------------------------
export async function getDiscounts(req: AuthenticatedRequest, res: Response) {
  try {
    const discounts = await prisma.discount.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: discounts });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch discounts.' });
  }
}

export async function createDiscount(req: AuthenticatedRequest, res: Response) {
  try {
    const { title, type, value, scope, promoCode, startDate, endDate, isActive } = req.body;

    if (!title || !type || value === undefined || !scope || !startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'Missing required discount fields.' });
    }

    if (promoCode) {
      const codeExists = await prisma.discount.findUnique({ where: { promoCode } });
      if (codeExists) {
        return res.status(400).json({ success: false, error: 'Promo code already exists.' });
      }
    }

    const discount = await prisma.discount.create({
      data: {
        title,
        type,
        value: parseFloat(value.toString()),
        scope,
        promoCode: promoCode || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: isActive !== undefined ? !!isActive : true,
      },
    });

    await logAdminAction(req, 'ADMIN_CREATE_DISCOUNT', { title });
    return res.json({ success: true, data: discount });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to create discount.' });
  }
}

export async function updateDiscount(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { title, type, value, scope, promoCode, startDate, endDate, isActive } = req.body;

    const exists = await prisma.discount.findUnique({ where: { id } });
    if (!exists) {
      return res.status(404).json({ success: false, error: 'Discount not found.' });
    }

    const updated = await prisma.discount.update({
      where: { id },
      data: {
        title,
        type,
        value: value !== undefined ? parseFloat(value.toString()) : undefined,
        scope,
        promoCode,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        isActive,
      },
    });

    await logAdminAction(req, 'ADMIN_UPDATE_DISCOUNT', { discountId: id });
    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update discount.' });
  }
}

export async function deleteDiscount(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.discount.delete({ where: { id } });
    await logAdminAction(req, 'ADMIN_DELETE_DISCOUNT', { discountId: id });
    return res.json({ success: true, message: 'Discount deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to delete discount.' });
  }
}

// -------------------------------------------------------------
// 6. CUSTOMERS MANAGEMENT
// -------------------------------------------------------------
export async function getCustomers(req: AuthenticatedRequest, res: Response) {
  try {
    const { search, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const whereClause: any = { role: 'CUSTOMER' };
    if (search) {
      whereClause.OR = [
        { name: { contains: search as string } },
        { phone: { contains: search as string } },
        { email: { contains: search as string } },
      ];
    }

    const customers = await prisma.user.findMany({
      where: whereClause,
      include: {
        _count: { select: { ordersPlaced: true } },
        ordersPlaced: {
          where: { status: 'DELIVERED' },
          select: { total: true }
        }
      },
      skip,
      take: limitNum,
    });

    const total = await prisma.user.count({ where: whereClause });

    // Format output with total spend and order counts
    const formatted = customers.map((c) => {
      const totalSpend = c.ordersPlaced.reduce((sum, o) => sum + parseFloat(o.total.toString()), 0);
      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        phoneVerified: c.phoneVerified,
        profilePicture: c.profilePicture,
        loyaltyPoints: c.loyaltyPoints,
        blockedAt: c.blockedAt,
        createdAt: c.createdAt,
        ordersCount: c._count.ordersPlaced,
        totalSpend,
      };
    });

    return res.json({
      success: true,
      data: formatted,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch customers.' });
  }
}

export async function blockCustomer(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const user = await prisma.user.update({
      where: { id },
      data: { blockedAt: new Date() },
    });
    await logAdminAction(req, 'ADMIN_BLOCK_CUSTOMER', { userId: id, phone: user.phone });
    return res.json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to block customer.' });
  }
}

export async function unblockCustomer(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const user = await prisma.user.update({
      where: { id },
      data: { blockedAt: null },
    });
    await logAdminAction(req, 'ADMIN_UNBLOCK_CUSTOMER', { userId: id, phone: user.phone });
    return res.json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to unblock customer.' });
  }
}

// -------------------------------------------------------------
// 7. BANNERS MANAGEMENT
// -------------------------------------------------------------
export async function getBanners(req: AuthenticatedRequest, res: Response) {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return res.json({ success: true, data: banners });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch banners.' });
  }
}

export async function createBanner(req: AuthenticatedRequest, res: Response) {
  try {
    const { title, subtitle, imageUrl, linkUrl, isActive, sortOrder } = req.body;
    if (!title || !imageUrl) {
      return res.status(400).json({ success: false, error: 'Title and image URL are required.' });
    }

    const banner = await prisma.banner.create({
      data: {
        title,
        subtitle: subtitle || null,
        imageUrl,
        linkUrl: linkUrl || null,
        isActive: isActive !== undefined ? !!isActive : true,
        sortOrder: sortOrder ? parseInt(sortOrder.toString()) : 0,
      },
    });

    await logAdminAction(req, 'ADMIN_CREATE_BANNER', { title });
    return res.json({ success: true, data: banner });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to create banner.' });
  }
}

export async function updateBanner(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { title, subtitle, imageUrl, linkUrl, isActive, sortOrder } = req.body;

    const exists = await prisma.banner.findUnique({ where: { id } });
    if (!exists) {
      return res.status(404).json({ success: false, error: 'Banner not found.' });
    }

    const updated = await prisma.banner.update({
      where: { id },
      data: {
        title,
        subtitle,
        imageUrl,
        linkUrl,
        isActive,
        sortOrder: sortOrder ? parseInt(sortOrder.toString()) : undefined,
      },
    });

    await logAdminAction(req, 'ADMIN_UPDATE_BANNER', { bannerId: id });
    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update banner.' });
  }
}

export async function deleteBanner(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.banner.delete({ where: { id } });
    await logAdminAction(req, 'ADMIN_DELETE_BANNER', { bannerId: id });
    return res.json({ success: true, message: 'Banner deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to delete banner.' });
  }
}

// -------------------------------------------------------------
// 8. REVIEWS MANAGEMENT
// -------------------------------------------------------------
export async function getReviews(req: AuthenticatedRequest, res: Response) {
  try {
    const { page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const reviews = await prisma.review.findMany({
      include: {
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    });

    const total = await prisma.review.count();

    return res.json({
      success: true,
      data: reviews,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch reviews.' });
  }
}

export async function hideReview(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const review = await prisma.review.update({
      where: { id },
      data: { isHidden: true },
    });
    await logAdminAction(req, 'ADMIN_HIDE_REVIEW', { reviewId: id });
    return res.json({ success: true, data: review });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to hide review.' });
  }
}

export async function showReview(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const review = await prisma.review.update({
      where: { id },
      data: { isHidden: false },
    });
    await logAdminAction(req, 'ADMIN_SHOW_REVIEW', { reviewId: id });
    return res.json({ success: true, data: review });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to show review.' });
  }
}

// -------------------------------------------------------------
// 9. SETTINGS & SHOP MANAGEMENT
// -------------------------------------------------------------
export async function getShopSettings(req: AuthenticatedRequest, res: Response) {
  try {
    const settings = await prisma.shopSetting.findFirst();
    return res.json({ success: true, data: settings });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch shop settings.' });
  }
}

export async function updateShopSettings(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      shopName,
      contactNumber,
      openingTime,
      closingTime,
      isAcceptingOrders,
      address,
      taxRate,
      facebookUrl,
      instagramUrl,
      whatsappNumber,
      estimatedDeliveryMinutes,
      logoUrl,
    } = req.body;

    const current = await prisma.shopSetting.findFirst();
    let updated;

    if (!current) {
      updated = await prisma.shopSetting.create({
        data: {
          shopName: shopName || 'Karachi Naseeb Baryani & Pulao - UCP Branch',
          contactNumber: contactNumber || '+923001234567',
          openingTime: openingTime || '11:00',
          closingTime: closingTime || '23:00',
          isAcceptingOrders: isAcceptingOrders !== undefined ? !!isAcceptingOrders : true,
          address: address || null,
          taxRate: taxRate !== undefined ? parseFloat(taxRate.toString()) : 0.00,
          facebookUrl: facebookUrl || null,
          instagramUrl: instagramUrl || null,
          whatsappNumber: whatsappNumber || null,
          estimatedDeliveryMinutes: estimatedDeliveryMinutes ? parseInt(estimatedDeliveryMinutes.toString()) : 30,
          logoUrl: logoUrl || null,
        },
      });
    } else {
      updated = await prisma.shopSetting.update({
        where: { id: current.id },
        data: {
          shopName,
          contactNumber,
          openingTime,
          closingTime,
          isAcceptingOrders,
          address,
          taxRate: taxRate !== undefined ? parseFloat(taxRate.toString()) : undefined,
          facebookUrl,
          instagramUrl,
          whatsappNumber,
          estimatedDeliveryMinutes: estimatedDeliveryMinutes ? parseInt(estimatedDeliveryMinutes.toString()) : undefined,
          logoUrl,
        },
      });
    }

    await logAdminAction(req, 'ADMIN_UPDATE_SHOP_SETTINGS', req.body);
    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update shop settings.' });
  }
}

export async function getDeliverySettings(req: AuthenticatedRequest, res: Response) {
  try {
    const settings = await prisma.deliverySetting.findFirst();
    return res.json({ success: true, data: settings });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch delivery settings.' });
  }
}

export async function updateDeliverySettings(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      shopLatitude,
      shopLongitude,
      maxDeliveryKm,
      baseDeliveryCharge,
      perKmCharge,
      minOrderAmount,
      standardEnabled,
      standardFee,
      standardEta,
      priorityEnabled,
      priorityFee,
      priorityEta,
      maxPriorityOrders,
    } = req.body;

    const current = await prisma.deliverySetting.findFirst();
    let updated;

    if (!current) {
      updated = await prisma.deliverySetting.create({
        data: {
          shopLatitude:       shopLatitude       ? parseFloat(shopLatitude.toString())       : 31.4475531,
          shopLongitude:      shopLongitude      ? parseFloat(shopLongitude.toString())      : 74.2690347,
          maxDeliveryKm:      maxDeliveryKm      ? parseFloat(maxDeliveryKm.toString())      : 2.2,
          baseDeliveryCharge: baseDeliveryCharge ? parseFloat(baseDeliveryCharge.toString()) : 50.00,
          perKmCharge:        perKmCharge        ? parseFloat(perKmCharge.toString())        : 20.00,
          minOrderAmount:     minOrderAmount     ? parseFloat(minOrderAmount.toString())     : 200.00,
          standardEnabled:    standardEnabled    !== undefined ? !!standardEnabled            : true,
          standardFee:        standardFee        !== undefined ? parseFloat(standardFee.toString()) : 50.00,
          standardEta:        standardEta        || '5-20 Minutes',
          priorityEnabled:    priorityEnabled    !== undefined ? !!priorityEnabled            : true,
          priorityFee:        priorityFee        !== undefined ? parseFloat(priorityFee.toString()) : 125.00,
          priorityEta:        priorityEta        || '5-20 Minutes',
          maxPriorityOrders:  maxPriorityOrders  !== undefined ? parseInt(maxPriorityOrders.toString()) : 10,
        },
      });
    } else {
      updated = await prisma.deliverySetting.update({
        where: { id: current.id },
        data: {
          shopLatitude:       shopLatitude       !== undefined ? parseFloat(shopLatitude.toString())       : undefined,
          shopLongitude:      shopLongitude      !== undefined ? parseFloat(shopLongitude.toString())      : undefined,
          maxDeliveryKm:      maxDeliveryKm      !== undefined ? parseFloat(maxDeliveryKm.toString())      : undefined,
          baseDeliveryCharge: baseDeliveryCharge !== undefined ? parseFloat(baseDeliveryCharge.toString()) : undefined,
          perKmCharge:        perKmCharge        !== undefined ? parseFloat(perKmCharge.toString())        : undefined,
          minOrderAmount:     minOrderAmount     !== undefined ? parseFloat(minOrderAmount.toString())     : undefined,
          standardEnabled:    standardEnabled    !== undefined ? !!standardEnabled   : undefined,
          standardFee:        standardFee        !== undefined ? parseFloat(standardFee.toString())        : undefined,
          standardEta:        standardEta        !== undefined ? standardEta         : undefined,
          priorityEnabled:    priorityEnabled    !== undefined ? !!priorityEnabled   : undefined,
          priorityFee:        priorityFee        !== undefined ? parseFloat(priorityFee.toString())        : undefined,
          priorityEta:        priorityEta        !== undefined ? priorityEta         : undefined,
          maxPriorityOrders:  maxPriorityOrders  !== undefined ? parseInt(maxPriorityOrders.toString())   : undefined,
        },
      });
    }

    await logAdminAction(req, 'ADMIN_UPDATE_DELIVERY_SETTINGS', req.body);
    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update delivery settings.' });
  }
}

// -------------------------------------------------------------
// 10. PAYMENT SETTINGS MANAGEMENT — REQ-PAYMENT-003
// -------------------------------------------------------------
export async function getPaymentSettings(req: AuthenticatedRequest, res: Response) {
  try {
    const settings = await prisma.paymentSetting.findMany({
      orderBy: { method: 'asc' },
    });

    // Ensure all known methods have a row
    const allMethods = Object.values(PaymentMethod); // from prisma enum
    const existingMethods = settings.map(s => s.method);
    const missing = allMethods.filter(m => !existingMethods.includes(m));

    if (missing.length > 0) {
      const created = await Promise.all(
        missing.map(method =>
          prisma.paymentSetting.create({
            data: { method: method as PaymentMethod, enabled: true },
          })
        )
      );
      return res.json({ success: true, data: [...settings, ...created] });
    }

    return res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Get payment settings error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch payment settings.' });
  }
}

export async function updatePaymentSetting(req: AuthenticatedRequest, res: Response) {
  try {
    const { method, enabled } = req.body;
    if (!method || enabled === undefined) {
      return res.status(400).json({ success: false, error: 'Method and enabled are required.' });
    }

    const setting = await prisma.paymentSetting.upsert({
      where: { method: method as PaymentMethod },
      update: { enabled: !!enabled },
      create: { method: method as PaymentMethod, enabled: !!enabled },
    });

    await logAdminAction(req, 'ADMIN_UPDATE_PAYMENT_SETTING', { method, enabled });
    return res.json({ success: true, data: setting });
  } catch (error) {
    console.error('Update payment setting error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update payment setting.' });
  }
}

// -------------------------------------------------------------
// 11. SYSTEM ACTIVITY LOGS
// -------------------------------------------------------------
export async function getLogs(req: AuthenticatedRequest, res: Response) {
  try {
    const logs = await prisma.activityLog.findMany({
      include: {
        user: { select: { name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return res.json({ success: true, data: logs });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch logs.' });
  }
}

/**
 * Get all registered riders.
 */
export async function getRiders(req: AuthenticatedRequest, res: Response) {
  try {
    const riders = await prisma.user.findMany({
      where: { role: 'RIDER' },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        phoneVerified: true,
      },
    });
    return res.json({ success: true, data: riders });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch riders.' });
  }
}

// -------------------------------------------------------------
// 12. SYSTEM CONFIG (database-backed, no restart required)
// -------------------------------------------------------------
export async function getSystemConfig(req: AuthenticatedRequest, res: Response) {
  try {
    const { getAllConfig } = await import('../services/config.service');
    const category = req.query.category as string | undefined;
    const data = await getAllConfig(category);
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch system config.' });
  }
}

export async function updateSystemConfig(req: AuthenticatedRequest, res: Response) {
  try {
    const { key, value } = req.body;
    if (!key || value === undefined) {
      return res.status(400).json({ success: false, error: 'key and value are required.' });
    }
    const { setConfig } = await import('../services/config.service');
    await setConfig(key, String(value), req.user?.id);
    await logAdminAction(req, 'ADMIN_UPDATE_SETTINGS', { key, value });
    return res.json({ success: true, message: 'Setting updated.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update system config.' });
  }
}

export async function createRider(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      name, email, phone, password,
      cnicNumber, dateOfBirth, gender,
      houseNumber, street, area, city, province, postalCode,
      emergencyContactName, emergencyContactPhone,
      vehicleType, vehicleNumber, drivingLicenseNumber
    } = req.body;

    if (!name || !phone || !password || !cnicNumber) {
      return res.status(400).json({ success: false, message: 'name, phone, password, cnicNumber are required' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const fullAddress = `${houseNumber || ''}, ${street || ''}, ${area || ''}, ${city || 'Karachi'}, ${province || 'Sindh'} ${postalCode || ''}`;

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email: email || null,
          phone,
          passwordHash,
          role: 'RIDER',
          phoneVerified: true,
        }
      });

      const profile = await tx.riderProfile.create({
        data: {
          userId: user.id,
          cnicNumber,
          dateOfBirth: new Date(dateOfBirth || Date.now()),
          gender: gender || 'MALE',
          houseNumber: houseNumber || '',
          street: street || '',
          area: area || '',
          city: city || 'Karachi',
          province: province || 'Sindh',
          postalCode: postalCode || '',
          fullAddress,
          emergencyContactName: emergencyContactName || '',
          emergencyContactPhone: emergencyContactPhone || '',
          vehicleType: vehicleType || 'BIKE',
          vehicleNumber: vehicleNumber || '',
          drivingLicenseNumber: drivingLicenseNumber || null,
          status: 'ACTIVE',
        }
      });

      return { user, profile };
    });

    await logAdminAction(req, 'CREATE_RIDER' as any, { riderId: result.user.id, name });
    return res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Phone, email, or CNIC already registered' });
    }
    return res.status(500).json({ success: false, message: 'Failed to create rider' });
  }
}

export async function updateRider(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const {
      name, email, phone,
      cnicNumber, dateOfBirth, gender,
      houseNumber, street, area, city, province, postalCode,
      emergencyContactName, emergencyContactPhone,
      vehicleType, vehicleNumber, drivingLicenseNumber,
      cnicFrontUrl, cnicBackUrl, profilePhotoUrl
    } = req.body;

    const riderProfile = await prisma.riderProfile.findFirst({
      where: { userId: id }
    });
    if (!riderProfile) {
      return res.status(404).json({ success: false, message: 'Rider not found' });
    }

    const fullAddress = houseNumber ? `${houseNumber}, ${street}, ${area}, ${city}, ${province} ${postalCode}` : riderProfile.fullAddress;

    await prisma.$transaction(async (tx) => {
      if (name || email || phone) {
        await tx.user.update({
          where: { id },
          data: {
            ...(name && { name }),
            ...(email && { email }),
            ...(phone && { phone }),
          }
        });
      }

      await tx.riderProfile.update({
        where: { id: riderProfile.id },
        data: {
          ...(cnicNumber && { cnicNumber }),
          ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
          ...(gender && { gender }),
          ...(houseNumber && { houseNumber }),
          ...(street && { street }),
          ...(area && { area }),
          ...(city && { city }),
          ...(province && { province }),
          ...(postalCode && { postalCode }),
          fullAddress,
          ...(emergencyContactName && { emergencyContactName }),
          ...(emergencyContactPhone && { emergencyContactPhone }),
          ...(vehicleType && { vehicleType }),
          ...(vehicleNumber && { vehicleNumber }),
          ...(drivingLicenseNumber !== undefined && { drivingLicenseNumber }),
          ...(cnicFrontUrl && { cnicFrontUrl }),
          ...(cnicBackUrl && { cnicBackUrl }),
          ...(profilePhotoUrl && { profilePhotoUrl }),
        }
      });
    });

    await logAdminAction(req, 'UPDATE_RIDER' as any, { riderId: id });
    return res.json({ success: true, message: 'Rider updated successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update rider' });
  }
}

export async function deleteRider(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const profile = await prisma.riderProfile.findFirst({ where: { userId: id } });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Rider not found' });
    }

    await prisma.riderProfile.update({
      where: { id: profile.id },
      data: {
        deletedAt: new Date(),
        deletedBy: req.user?.id,
        deletedReason: reason || 'Deleted by admin',
        status: 'INACTIVE'
      }
    });

    await logAdminAction(req, 'DELETE_RIDER' as any, { riderId: id, reason });
    return res.json({ success: true, message: 'Rider deleted successfully' });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to delete rider' });
  }
}

export async function updateRiderStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ON_BREAK'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const profile = await prisma.riderProfile.findFirst({ where: { userId: id } });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Rider not found' });
    }

    await prisma.riderProfile.update({
      where: { id: profile.id },
      data: { status }
    });

    await logAdminAction(req, 'UPDATE_RIDER_STATUS' as any, { riderId: id, status });
    return res.json({ success: true, message: `Rider status updated to ${status}` });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to update rider status' });
  }
}

export async function getCustomerDetail(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, phone: true,
        role: true, phoneVerified: true, googleId: true,
        profilePicture: true, referralCode: true, loyaltyPoints: true,
        blockedAt: true, createdAt: true, updatedAt: true,
        addresses: true,
        ordersPlaced: {
          orderBy: { placedAt: 'desc' },
          take: 50,
          select: {
            id: true, orderNumber: true, status: true,
            total: true, placedAt: true, deliveredAt: true,
            paymentMethod: true, paymentStatus: true,
            orderItems: { select: { itemName: true, quantity: true, lineTotal: true } }
          }
        },
        loyaltyPointHistory: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: { id: true, points: true, reason: true, createdAt: true }
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, rating: true, comment: true, createdAt: true }
        },
        referralsSent: {
          select: { id: true, createdAt: true, rewardGranted: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const totalOrders = user.ordersPlaced.length;
    const totalSpend = user.ordersPlaced
      .filter(o => o.status === 'DELIVERED')
      .reduce((sum, o) => sum + parseFloat(o.total.toString()), 0);
    const cancelledOrders = user.ordersPlaced.filter(o => o.status === 'CANCELLED').length;

    return res.json({
      success: true,
      data: {
        ...user,
        stats: { totalOrders, totalSpend, cancelledOrders, loyaltyPoints: user.loyaltyPoints }
      }
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to get customer detail' });
  }
}

export async function sendCustomerNotification(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { title, body } = req.body;

    if (!title || !body) {
      return res.status(400).json({ success: false, message: 'title and body are required' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ success: false, message: 'Customer not found' });

    await sendPushToUser(id, title, body);

    await prisma.notification.create({
      data: { userId: id, title, body, type: 'ADMIN_MESSAGE' }
    });

    await logAdminAction(req, 'SEND_NOTIFICATION' as any, { targetUserId: id, title });
    return res.json({ success: true, message: 'Notification sent' });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to send notification' });
  }
}

export async function adjustCustomerLoyalty(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { points, reason, type } = req.body; // type: 'ADD' | 'REMOVE'

    if (!points || !reason) {
      return res.status(400).json({ success: false, message: 'points and reason are required' });
    }

    const absPoints = Math.abs(parseInt(points));
    const delta = type === 'REMOVE' ? -absPoints : absPoints;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ success: false, message: 'Customer not found' });

    if (delta < 0 && user.loyaltyPoints < absPoints) {
      return res.status(400).json({ success: false, message: 'Insufficient loyalty points' });
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id }, data: { loyaltyPoints: { increment: delta } } }),
      prisma.loyaltyPoint.create({ data: { userId: id, points: delta, reason: `ADMIN: ${reason}` } })
    ]);

    await logAdminAction(req, 'ADJUST_LOYALTY' as any, { targetUserId: id, delta, reason });
    return res.json({ success: true, message: `Loyalty points ${type === 'REMOVE' ? 'removed' : 'added'} successfully` });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to adjust loyalty points' });
  }
}

export async function getRevenueAnalytics(req: AuthenticatedRequest, res: Response) {
  try {
    const period = (req.query.period as string) || '7d';
    const fromParam = req.query.from as string;
    const toParam = req.query.to as string;

    let startDate: Date;
    let endDate = new Date();

    if (fromParam && toParam) {
      startDate = new Date(fromParam);
      endDate = new Date(toParam);
    } else {
      startDate = new Date();
      const days = period === '30d' ? 30 : period === '90d' ? 90 : 7;
      startDate.setDate(startDate.getDate() - days);
    }

    const orders = await prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        placedAt: { gte: startDate, lte: endDate },
      },
      select: { total: true, placedAt: true, paymentMethod: true },
    });

    // Group by day
    const revenueByDay: Record<string, { date: string; revenue: number; orders: number }> = {};
    const d = new Date(startDate);
    while (d <= endDate) {
      const key = d.toISOString().split('T')[0];
      revenueByDay[key] = { date: key, revenue: 0, orders: 0 };
      d.setDate(d.getDate() + 1);
    }

    let totalRevenue = 0;
    orders.forEach(o => {
      const key = o.placedAt.toISOString().split('T')[0];
      if (revenueByDay[key]) {
        revenueByDay[key].revenue += parseFloat(o.total.toString());
        revenueByDay[key].orders += 1;
      }
      totalRevenue += parseFloat(o.total.toString());
    });

    const dailyData = Object.values(revenueByDay);
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    return res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders: orders.length,
        avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
        dailyData,
        period,
      }
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to get revenue analytics' });
  }
}

export async function getPeakHoursAnalytics(req: AuthenticatedRequest, res: Response) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const orders = await prisma.order.findMany({
      where: { placedAt: { gte: thirtyDaysAgo } },
      select: { placedAt: true },
    });

    // Build 7x24 grid: day 0-6 (Sun-Sat), hour 0-23
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    orders.forEach(o => {
      const day = o.placedAt.getDay();
      const hour = o.placedAt.getHours();
      grid[day][hour]++;
    });

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const heatmap = grid.map((row, dayIdx) => ({
      day: days[dayIdx],
      hours: row.map((count, hour) => ({ hour, count }))
    }));

    return res.json({ success: true, data: { heatmap } });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to get peak hours' });
  }
}

export async function getPaymentAnalytics(req: AuthenticatedRequest, res: Response) {
  try {
    const grouped = await prisma.payment.groupBy({
      by: ['method'],
      where: { status: 'COMPLETED' },
      _count: { _all: true },
      _sum: { amount: true },
    });

    const data = grouped.map(g => ({
      method: g.method,
      count: g._count._all,
      total: parseFloat(g._sum.amount?.toString() || '0'),
    }));

    return res.json({ success: true, data });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to get payment analytics' });
  }
}

export async function getOrderDetail(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, name: true, phone: true, email: true, profilePicture: true }
        },
        rider: {
          select: { id: true, name: true, phone: true, riderProfile: {
            select: { vehicleNumber: true, vehicleType: true, status: true }
          }}
        },
        address: true,
        orderItems: {
          include: { menuItem: { select: { imageUrl: true } } }
        },
        payment: true,
        review: true,
      }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    return res.json({ success: true, data: order });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to get order detail' });
  }
}

export async function updateOrderNotes(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { internalNotes } = req.body;

    await prisma.order.update({
      where: { id },
      data: { internalNotes: internalNotes || '' }
    });

    await logAdminAction(req, 'UPDATE_ORDER_NOTES' as any, { orderId: id });
    return res.json({ success: true, message: 'Notes updated' });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to update notes' });
  }
}
