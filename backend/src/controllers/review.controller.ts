import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

/**
 * Submit a review for a delivered order.
 */
export async function submitReview(req: AuthenticatedRequest, res: Response) {
  try {
    const { orderId, rating, comment } = req.body;

    if (!orderId || !rating) {
      return res.status(400).json({ error: 'Order ID and rating are required.' });
    }

    // 1. Verify order exists, belongs to user, and is DELIVERED
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true },
    });

    if (!order || order.customerId !== req.user!.id) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (order.status !== 'DELIVERED') {
      return res.status(400).json({ error: 'You can only review orders that have been successfully delivered.' });
    }

    // 2. Check if a review already exists
    const existingReview = await prisma.review.findUnique({
      where: { orderId },
    });
    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this order.' });
    }

    // 3. Create review & update menuItem ratings in a transaction/sequential update
    const review = await prisma.review.create({
      data: {
        userId: req.user!.id,
        orderId,
        rating: parseInt(rating.toString(), 10),
        comment: comment || null,
      },
    });

    // Recalculate average rating & reviewCount for all items in the order
    for (const item of order.orderItems) {
      const itemReviews = await prisma.review.findMany({
        where: {
          order: {
            orderItems: {
              some: { menuItemId: item.menuItemId },
            },
          },
        },
        select: { rating: true },
      });

      const count = itemReviews.length;
      const averageRating = count > 0
        ? itemReviews.reduce((sum, r) => sum + r.rating, 0) / count
        : 0;

      await prisma.menuItem.update({
        where: { id: item.menuItemId },
        data: {
          rating: parseFloat(averageRating.toFixed(1)),
          reviewCount: count,
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully.',
      data: review,
    });
  } catch (error: any) {
    console.error('Submit review error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'This order has already been reviewed.' });
    }
    return res.status(500).json({ error: 'Failed to submit review.' });
  }
}

/**
 * Get all reviews submitted by the logged-in customer.
 */
export async function getMyReviews(req: AuthenticatedRequest, res: Response) {
  try {
    const reviews = await prisma.review.findMany({
      where: { userId: req.user!.id },
      include: {
        order: {
          select: {
            id: true,
            placedAt: true,
            orderItems: {
              select: {
                itemName: true,
                quantity: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    console.error('Get my reviews error:', error);
    return res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
}
