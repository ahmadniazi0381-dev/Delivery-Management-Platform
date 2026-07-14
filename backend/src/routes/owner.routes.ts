import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { ownerLimiter, validateBody } from '../middleware/security.middleware';
import {
  CategorySchema,
  MenuItemSchema,
  DiscountSchema,
  OrderStatusSchema,
  DeliverySettingSchema,
  ShopSettingSchema,
  AssignRiderSchema,
  RefundPaymentSchema,
  ResetRiderPasswordSchema,
} from '../middleware/validation.schemas';
import {
  getAnalytics,
  getOrders,
  getPaymentSettings,
  updatePaymentSetting,
} from '../controllers/owner.controller';
import {
  acceptOrder,
  rejectOrder,
  updateOrderStatus,
  assignRider,
  refundPayment,
  resetRiderPassword,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  getCustomers,
  blockCustomer,
  unblockCustomer,
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  getReviews,
  hideReview,
  showReview,
  getShopSettings,
  updateShopSettings,
  getDeliverySettings,
  updateDeliverySettings,
  getLogs,
  getRiders,
  getSystemConfig,
  updateSystemConfig,
} from '../controllers/owner.controller';
import {
  getMonitoringDashboard,
  getSystemLogs,
  globalSearch,
} from '../controllers/monitoring.controller';


const router = Router();

// All owner routes: auth + admin role + owner rate limiter
router.use(authenticate, requireRole('ADMIN'), ownerLimiter);

// Analytics
router.get('/owner/analytics', getAnalytics);

// Orders
router.get('/owner/orders',                getOrders);
router.put('/owner/orders/:id/accept',     acceptOrder);
router.put('/owner/orders/:id/reject',     rejectOrder);
router.put('/owner/orders/:id/status',     validateBody(OrderStatusSchema), updateOrderStatus);
router.put('/owner/orders/:id/assign-rider', validateBody(AssignRiderSchema), assignRider);
router.post('/owner/payments/:paymentId/refund', validateBody(RefundPaymentSchema), refundPayment);
router.put('/owner/riders/:id/reset-password', validateBody(ResetRiderPasswordSchema), resetRiderPassword);

// Categories
router.get('/owner/categories',            getCategories);
router.post('/owner/categories',           validateBody(CategorySchema),     createCategory);
router.put('/owner/categories/:id',        validateBody(CategorySchema),     updateCategory);
router.delete('/owner/categories/:id',     deleteCategory);

// Menu Items
router.get('/owner/menu-items',            getMenuItems);
router.post('/owner/menu-items',           validateBody(MenuItemSchema),     createMenuItem);
router.put('/owner/menu-items/:id',        validateBody(MenuItemSchema),     updateMenuItem);
router.delete('/owner/menu-items/:id',     deleteMenuItem);

// Discounts
router.get('/owner/discounts',             getDiscounts);
router.post('/owner/discounts',            validateBody(DiscountSchema),     createDiscount);
router.put('/owner/discounts/:id',         validateBody(DiscountSchema),     updateDiscount);
router.delete('/owner/discounts/:id',      deleteDiscount);

// Customers
router.get('/owner/customers',             getCustomers);
router.put('/owner/customers/:id/block',   blockCustomer);
router.put('/owner/customers/:id/unblock', unblockCustomer);

// Banners
router.get('/owner/banners',               getBanners);
router.post('/owner/banners',              createBanner);
router.put('/owner/banners/:id',           updateBanner);
router.delete('/owner/banners/:id',        deleteBanner);

// Reviews
router.get('/owner/reviews',               getReviews);
router.put('/owner/reviews/:id/hide',      hideReview);
router.put('/owner/reviews/:id/show',      showReview);

// Settings
router.get('/owner/settings',              getShopSettings);
router.put('/owner/settings',              validateBody(ShopSettingSchema),      updateShopSettings);
router.get('/owner/delivery-settings',     getDeliverySettings);
router.put('/owner/delivery-settings',     validateBody(DeliverySettingSchema),  updateDeliverySettings);

// Activity Logs
router.get('/owner/logs',                  getLogs);

// Payment Settings — REQ-PAYMENT-003
router.get('/owner/payment-settings',      getPaymentSettings);
router.put('/owner/payment-settings',      updatePaymentSetting);

// Riders
router.get('/owner/riders',                getRiders);

// System config, monitoring, search
router.get('/owner/system-config',         getSystemConfig);
router.put('/owner/system-config',         updateSystemConfig);
router.get('/owner/monitoring',            getMonitoringDashboard);
router.get('/owner/system-logs',           getSystemLogs);
router.get('/owner/search',                globalSearch);

export default router;
