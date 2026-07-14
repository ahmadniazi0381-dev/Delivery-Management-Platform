import { Router } from 'express';
import {
  placeOrder,
  getOrders,
  getOrderById,
  cancelOrder,
  getOwnerOrders,
  updateOrderStatus,
  getOwnerAnalytics,
} from '../controllers/order.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { userLimiter, ownerLimiter, validateBody } from '../middleware/security.middleware';
import { PlaceOrderSchema, OrderStatusSchema } from '../middleware/validation.schemas';

const router = Router();

// Customer endpoints
router.post('/',          userLimiter,  authenticate, validateBody(PlaceOrderSchema), placeOrder);
router.get('/',           userLimiter,  authenticate, getOrders);
router.get('/:id',        userLimiter,  authenticate, getOrderById);
router.post('/:id/cancel',userLimiter,  authenticate, cancelOrder);

// Admin endpoints
router.get('/owner/list',         ownerLimiter, authenticate, requireRole('ADMIN'), getOwnerOrders);
router.put('/owner/status/:id',   ownerLimiter, authenticate, requireRole('ADMIN'), validateBody(OrderStatusSchema), updateOrderStatus);
router.get('/owner/analytics',    ownerLimiter, authenticate, requireRole('ADMIN'), getOwnerAnalytics);

export default router;
