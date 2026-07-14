import { Request, Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { createCodOrderFromLegacyRoute } from '../services/checkout.service';

/**
 * Place a new order.
 */
export async function placeOrder(req: AuthenticatedRequest, res: Response) {
  try {
    const newOrder = await createCodOrderFromLegacyRoute(req, req.app.get('io'));

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      data: newOrder,
    });
  } catch (error: any) {
    console.error('Place order error:', error);
    return res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Failed to place order.',
      requirePhoneVerification: error.requirePhoneVerification,
    });
  }
}

/**
 * Get active/past orders for the customer.
 */
export async function getOrders(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const orders = await prisma.order.findMany({
      where: { customerId: req.user.id },
      orderBy: { placedAt: 'desc' },
      include: {
        address: true,
        orderItems: true,
      },
    });

    return res.status(200).json(orders);
  } catch (error) {
    console.error('Get customer orders error:', error);
    return res.status(500).json({ error: 'Failed to retrieve orders.' });
  }
}

/**
 * Get details of a specific order.
 */
export async function getOrderById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        address: true,
        orderItems: true,
        customer: { select: { name: true, phone: true, email: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // Authorize: customer must own the order, or user must be Admin
    if (req.user.role !== 'ADMIN' && order.customerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    return res.status(200).json(order);
  } catch (error) {
    console.error('Get order details error:', error);
    return res.status(500).json({ error: 'Failed to retrieve order details.' });
  }
}

/**
 * Cancel order (Customer can only cancel if status is PENDING).
 */
export async function cancelOrder(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (order.customerId !== req.user.id) {
      return res.status(403).json({ error: 'Cannot cancel an order belonging to another customer.' });
    }

    if (order.status !== 'PENDING') {
      return res.status(400).json({
        error: `Order cannot be cancelled. Restaurant has already transition to "${order.status}" status.`,
      });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    // Notify dashboard of cancellation (stops alert on all admin devices)
    const io = req.app.get('io');
    if (io) {
      io.to('admin').emit('order:cancelled', { orderId: order.id, status: 'CANCELLED' });
      // Also notify the customer's personal room
      io.to(`user:${order.customerId}`).emit('order:updated', { orderId: order.id, status: 'CANCELLED' });
    }

    return res.status(200).json({ message: 'Order has been cancelled.', order: updated });
  } catch (error) {
    console.error('Cancel order error:', error);
    return res.status(500).json({ error: 'Failed to cancel order.' });
  }
}

// ==========================================
// ADMIN/OWNER ENDPOINTS
// ==========================================

/**
 * Get all orders for the dashboard (with optional status filters).
 */
export async function getOwnerOrders(req: Request, res: Response) {
  try {
    const { status } = req.query;

    const whereClause: any = {};
    if (status && typeof status === 'string') {
      whereClause.status = status;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      orderBy: { placedAt: 'desc' },
      include: {
        address: true,
        customer: { select: { name: true, phone: true } },
      },
    });

    return res.status(200).json(orders);
  } catch (error) {
    console.error('Get owner orders error:', error);
    return res.status(500).json({ error: 'Failed to retrieve orders.' });
  }
}

/**
 * Update order status (and track time marks).
 */
export async function updateOrderStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === 'ACCEPTED') updateData.acceptedAt = new Date();
      else if (status === 'PREPARING') { /* handled via status change */ }
      else if (status === 'READY') updateData.readyAt = new Date();
      else if (status === 'OUT_FOR_DELIVERY') updateData.outForDeliveryAt = new Date();
      else if (status === 'DELIVERED') {
        updateData.deliveredAt = new Date();
        updateData.paymentStatus = 'COMPLETED'; // Assume completed on CoD/paid
      } else if (status === 'REJECTED') {
        updateData.rejectedAt = new Date();
        updateData.paymentStatus = 'FAILED';
      }
    }

    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
    }

    const updated = await prisma.order.update({
      where: { id },
      data: updateData,
      include: { customer: { select: { name: true, phone: true } } },
    });

    // Notify all parties via socket
    const io = req.app.get('io');
    if (io) {
      const statusEvent = updated.status === 'ACCEPTED' ? 'order:accepted'
        : updated.status === 'REJECTED' ? 'order:rejected'
        : updated.status === 'CANCELLED' ? 'order:cancelled'
        : 'order:updated';

      // Emit to admin room (stops alert loop on accepted/rejected/cancelled)
      io.to('admin').emit(statusEvent, {
        orderId: order.id,
        status: updated.status,
        updatedAt: new Date(),
      });

      // Emit to customer's personal room
      io.to(`user:${order.customerId}`).emit('order:updated', {
        orderId: order.id,
        status: updated.status,
        updatedAt: new Date(),
      });
    }

    return res.status(200).json({ message: 'Order updated successfully.', order: updated });
  } catch (error) {
    console.error('Update order status error:', error);
    return res.status(500).json({ error: 'Failed to update order status.' });
  }
}

/**
 * Get basic sales analytics for the owner dashboard.
 */
export async function getOwnerAnalytics(req: Request, res: Response) {
  try {
    // Total aggregate numbers
    const totalSales = await prisma.order.aggregate({
      where: { status: 'DELIVERED' },
      _sum: { total: true },
    });

    const ordersCount = await prisma.order.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const totalCustomers = await prisma.user.count({
      where: { role: 'CUSTOMER' },
    });

    // Get top 5 selling items
    const topItemsRaw = await prisma.orderItem.groupBy({
      by: ['menuItemId', 'itemName'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    // Clean counts format
    const counts = ordersCount.reduce((acc: any, curr) => {
      acc[curr.status] = curr._count.id;
      return acc;
    }, {});

    return res.status(200).json({
      revenue: parseFloat(totalSales._sum.total?.toString() || '0.00'),
      totalCustomers,
      orderCounts: counts,
      topSellingItems: topItemsRaw.map(item => ({
        name: item.itemName,
        quantity: item._sum.quantity || 0,
      })),
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return res.status(500).json({ error: 'Failed to retrieve sales analytics.' });
  }
}
