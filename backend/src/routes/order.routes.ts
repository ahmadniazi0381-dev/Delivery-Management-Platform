import { Router } from 'express';
import {
  placeOrder,
  getOrders,
  getOrderById,
  cancelOrder,
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

// End of router definition
export default router;
