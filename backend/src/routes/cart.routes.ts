import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from '../controllers/cart.controller';
import { authenticate } from '../middleware/auth.middleware';
import { userLimiter, validateBody } from '../middleware/security.middleware';
import { CartAddSchema, CartUpdateSchema } from '../middleware/validation.schemas';

const router = Router();

router.use(authenticate, userLimiter);

router.get('/',           getCart);
router.post('/items',     validateBody(CartAddSchema),    addToCart);
router.put('/items/:id',  validateBody(CartUpdateSchema), updateCartItem);
router.delete('/items/:id', removeFromCart);
router.delete('/',          clearCart);

export default router;
