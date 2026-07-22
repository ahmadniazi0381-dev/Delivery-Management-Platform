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
 * Get active/past orders for the customer or rider.
 */
export async function getOrders(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const whereClause: any = {};
    const includeClause: any = {
      address: true,
      orderItems: true,
    };

    if (req.user.role === 'RIDER') {
      whereClause.riderId = req.user.id;
      includeClause.customer = { select: { name: true, phone: true } };
    } else if (req.user.role === 'CUSTOMER') {
      whereClause.customerId = req.user.id;
    } else if (req.user.role === 'ADMIN') {
      const { customerId, riderId } = req.query;
      if (customerId) whereClause.customerId = customerId;
      if (riderId) whereClause.riderId = riderId;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      orderBy: { placedAt: 'desc' },
      include: includeClause,
    });

    return res.status(200).json({ success: true, data: orders });
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

    // Authorize: customer must own the order, rider must be assigned to it, or user must be Admin
    if (
      req.user.role !== 'ADMIN' &&
      order.customerId !== req.user.id &&
      order.riderId !== req.user.id
    ) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('Get order details error:', error);
    return res.status(500).json({ error: 'Failed to retrieve order details.' });
  }
}

/**
 * Cancel order.
 * - Customers can cancel when status is PENDING, ACCEPTED, PREPARING, or READY
 *   (before a rider has actually departed / picked up the order).
 * - Cancellation is BLOCKED once the order is OUT_FOR_DELIVERY, DELIVERED, CANCELLED, or REJECTED.
 * - Backend enforces this independently of any frontend button visibility.
 * - If payment was completed (online-paid), the payment record enters REFUND_PENDING workflow.
 */
export function canCustomerCancelOrder(orderStatus: string): boolean {
  const cancellableStatuses = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'];
  return cancellableStatuses.includes(orderStatus);
}

export async function cancelOrder(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    // Re-fetch latest order state with a transaction-style read to avoid race conditions
    const order = await prisma.order.findUnique({
      where: { id },
      include: { payment: true },
    });
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (order.customerId !== req.user.id) {
      return res.status(403).json({ error: 'Cannot cancel an order belonging to another customer.' });
    }

    // Server-side eligibility check — never trust frontend button state
    if (!canCustomerCancelOrder(order.status)) {
      return res.status(400).json({
        error: `Order cannot be cancelled once it is in "${order.status}" status. The rider is already on the way — contact support if you need assistance.`,
        cancellable: false,
      });
    }

    // Determine refund requirement for online-paid orders
    const wasOnlinePaid = order.payment?.status === 'COMPLETED' && order.paymentMethod !== 'COD';

    const updated = await prisma.$transaction(async (tx) => {
      // Re-read order inside transaction to prevent TOCTOU race with rider pickup
      const latestOrder = await tx.order.findUnique({ where: { id } });
      if (!latestOrder || !canCustomerCancelOrder(latestOrder.status)) {
        const err = new Error(`Order cannot be cancelled — status changed to "${latestOrder?.status}". The rider may have just picked up your order.`);
        (err as any).status = 409;
        (err as any).cancellable = false;
        throw err;
      }

      const cancelledOrder = await tx.order.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          internalNotes: reason ? `Customer cancellation reason: ${reason}` : undefined,
          // For online-paid: enter REFUND_PENDING state (not REFUNDED — actual refund needs provider confirmation)
          paymentStatus: wasOnlinePaid ? 'PENDING' : order.paymentStatus,
        },
      });

      // Flag payment for refund processing — admin will process via gateway
      if (wasOnlinePaid && order.payment) {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: {
            refundStatus: 'PENDING_ADMIN',
            // Do NOT set status to REFUNDED here — only set after provider confirms
          },
        });
      }

      return cancelledOrder;
    });

    // Emit socket events
    const io = req.app.get('io');
    if (io) {
      io.to('admin').emit('order:cancelled', {
        orderId: order.id,
        status: 'CANCELLED',
        requiresRefund: wasOnlinePaid,
        cancelledBy: 'CUSTOMER',
        reason: reason || null,
      });
      io.to(`user:${order.customerId}`).emit('order:updated', { orderId: order.id, status: 'CANCELLED' });
      // Notify rider if one was assigned (and not yet departed)
      if (order.riderId) {
        io.to(`user:${order.riderId}`).emit('delivery:cancelled', {
          orderId: order.id,
          message: 'This order has been cancelled by the customer.',
        });
      }
    }

    const responseMsg = wasOnlinePaid
      ? 'Order has been cancelled. Your refund is being processed — expect it within 3–5 business days after admin review.'
      : 'Order has been cancelled successfully.';

    return res.status(200).json({
      message: responseMsg,
      order: updated,
      refundInitiated: wasOnlinePaid,
      cancellable: false,
    });
  } catch (error: any) {
    if (error.status === 409) {
      return res.status(409).json({ error: error.message, cancellable: false });
    }
    console.error('Cancel order error:', error);
    return res.status(500).json({ error: 'Failed to cancel order.' });
  }
}

// End of order controller
