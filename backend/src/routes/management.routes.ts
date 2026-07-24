import { Router } from 'express';
import { authenticate, requireRole, requirePermission } from '../middleware/auth.middleware';
import { ownerLimiter } from '../middleware/security.middleware';
import {
  getAdvancedAnalytics,
  getActivityCenter,
  getStaffActionHistory,
  getLoginHistory,
  getInventoryAlerts,
  getInventoryOverview,
  updateMenuItemStock,
  getOrderAuditTrail,
  ownerOverrideOrder,
  updateInternalNotes,
  getKdsOrders,
  updateKdsOrderStatus,
} from '../controllers/management.controller';

const router = Router();

// Protect all management endpoints with authentication + ADMIN role
router.use(authenticate, requireRole('ADMIN'), ownerLimiter);

// ── Analytics & Activity ──────────────────────────────────────────────────────
router.get('/owner/analytics/advanced', requirePermission('REPORTS_VIEW'), getAdvancedAnalytics);
router.get('/owner/activity', requirePermission('DASHBOARD_VIEW'), getActivityCenter);

// ── Staff Action & Login History ──────────────────────────────────────────────
router.get('/owner/staff/:id/history', requirePermission('STAFF_MANAGE'), getStaffActionHistory);
router.get('/owner/login-history', requirePermission('STAFF_MANAGE'), getLoginHistory);

// ── Inventory ─────────────────────────────────────────────────────────────────
router.get('/owner/inventory/alerts', requirePermission('MENU_VIEW'), getInventoryAlerts);
router.get('/owner/inventory', requirePermission('MENU_VIEW'), getInventoryOverview);
router.put('/owner/menu/:id/stock', requirePermission('MENU_MANAGE'), updateMenuItemStock);

// ── Order Audit Trail & Notes ─────────────────────────────────────────────────
router.get('/orders/:id/audit-trail', requirePermission('ORDERS_VIEW'), getOrderAuditTrail);
router.post('/orders/:id/override', requirePermission('ORDERS_MANAGE'), ownerOverrideOrder);
router.put('/orders/:id/internal-notes', requirePermission('ORDERS_MANAGE'), updateInternalNotes);

// ── KDS (Kitchen Display System) ──────────────────────────────────────────────
router.get('/kds/orders', requirePermission('KDS_VIEW'), getKdsOrders);
router.put('/kds/orders/:id/status', requirePermission('KDS_MANAGE'), updateKdsOrderStatus);

export default router;
