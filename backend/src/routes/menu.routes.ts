import { Router } from 'express';
import {
  getCategories,
  getMenuItems,
  getMenuItemById,
  searchMenu,
  addCategory,
  updateCategory,
  deleteCategory,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from '../controllers/menu.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import {
  publicLimiter,
  searchLimiter,
  ownerLimiter,
  validateBody,
} from '../middleware/security.middleware';
import { CategorySchema, MenuItemSchema } from '../middleware/validation.schemas';

const router = Router();

// Public reads — moderate limiter
router.get('/categories', publicLimiter, getCategories);
router.get('/items',      publicLimiter, getMenuItems);
router.get('/items/:id',  publicLimiter, getMenuItemById);
router.get('/search',     searchLimiter, searchMenu);

// Admin writes — owner limiter + strict validation
router.post(  '/categories',     ownerLimiter, authenticate, requireRole('ADMIN'), validateBody(CategorySchema), addCategory);
router.put(   '/categories/:id', ownerLimiter, authenticate, requireRole('ADMIN'), validateBody(CategorySchema), updateCategory);
router.delete('/categories/:id', ownerLimiter, authenticate, requireRole('ADMIN'), deleteCategory);

router.post(  '/items',     ownerLimiter, authenticate, requireRole('ADMIN'), validateBody(MenuItemSchema), addMenuItem);
router.put(   '/items/:id', ownerLimiter, authenticate, requireRole('ADMIN'), validateBody(MenuItemSchema), updateMenuItem);
router.delete('/items/:id', ownerLimiter, authenticate, requireRole('ADMIN'), deleteMenuItem);

export default router;
